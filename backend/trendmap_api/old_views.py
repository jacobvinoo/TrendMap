import json
from functools import wraps

from django.middleware.csrf import CsrfViewMiddleware
from django.utils import timezone
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import (
    AuditEvent,
    Document,
    EvidenceLink,
    Industry,
    MonitoringRule,
    MonitoringRun,
    Signal,
    Source,
    StrategicContext,
    Trend,
    new_uuid,
)
from .serializers import (
    AuditEventSerializer,
    DocumentSerializer,
    EvidenceLinkSerializer,
    IndustrySerializer,
    MonitoringRuleSerializer,
    MonitoringRunSerializer,
    SignalSerializer,
    SourceSerializer,
    StrategicContextSerializer,
    TrendSerializer,
)


csrf_middleware = CsrfViewMiddleware(lambda request: None)


def protected_api_view(methods):
    def decorator(view_func):
        drf_view = api_view(methods)(view_func)

        @wraps(drf_view)
        def wrapped(request, *args, **kwargs):
            if request.method not in {"GET", "HEAD", "OPTIONS"}:
                failure = csrf_middleware.process_view(request, view_func, args, kwargs)
                if failure is not None:
                    return failure
            return drf_view(request, *args, **kwargs)

        return wrapped

    return decorator


def audit(action: str, entity_type: str, entity_id: str, details: dict | None = None):
    AuditEvent.objects.create(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user_id="system",
        details=json.dumps(details or {}),
    )


@api_view(["GET"])
def version(_request):
    return Response({"version": "1.0.0", "framework": "django"})


@api_view(["GET"])
def health(_request):
    return Response({"status": "ok"})


@ensure_csrf_cookie
@api_view(["GET"])
def csrf_token(request):
    return Response({"csrfToken": get_token(request)})


@protected_api_view(["GET", "POST"])
def industries(request):
    if request.method == "GET":
        queryset = Industry.objects.order_by("-updated_at", "-created_at")
        return Response(IndustrySerializer(queryset, many=True).data)

    item_id = request.data.get("id") or new_uuid()
    instance = Industry.objects.filter(id=item_id).first()
    serializer = IndustrySerializer(instance, data={**request.data, "id": item_id}, partial=bool(instance))
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_at=timezone.now())
    return Response(serializer.data)


@protected_api_view(["GET", "POST"])
def sources(request):
    if request.method == "GET":
        return Response(SourceSerializer(Source.objects.order_by("-created_at"), many=True).data)

    serializer = SourceSerializer(data={**request.data, "id": request.data.get("id") or new_uuid()})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@protected_api_view(["PATCH", "DELETE"])
def source_detail(request, source_id):
    try:
        source = Source.objects.get(id=source_id)
    except Source.DoesNotExist:
        return Response({"detail": "Source not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        source.delete()
        audit("delete", "sources", source_id, {"reason": "User requested deletion"})
        return Response({"success": True})

    previous_status = source.status
    serializer = SourceSerializer(source, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_at=timezone.now())
    if "status" in request.data:
        audit(f"source_{request.data['status']}", "sources", source_id, {"previous_value": previous_status, "new_value": request.data["status"]})
    return Response(serializer.data)


@protected_api_view(["GET", "POST"])
def documents(request):
    if request.method == "GET":
        return Response(DocumentSerializer(Document.objects.order_by("-created_at"), many=True).data)

    data = {**request.data, "id": request.data.get("id") or new_uuid()}
    serializer = DocumentSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@protected_api_view(["PATCH"])
def document_detail(request, document_id):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response({"detail": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
    previous_status = document.status
    serializer = DocumentSerializer(document, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    if "status" in request.data:
        audit(f"document_status_{request.data['status']}", "documents", document_id, {"previous_value": previous_status, "new_value": request.data["status"]})
    return Response(serializer.data)


@api_view(["GET"])
def signals(request):
    return Response(SignalSerializer(Signal.objects.order_by("-created_at"), many=True).data)


@protected_api_view(["POST"])
def extract_signal(request):
    data = {**request.data, "id": request.data.get("id") or new_uuid()}
    serializer = SignalSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    audit("signal_created", "signals", serializer.instance.id, {"title": serializer.instance.title})
    return Response(serializer.data)


@api_view(["GET"])
def history(_request, entity_type, entity_id):
    queryset = AuditEvent.objects.filter(entity_type=entity_type, entity_id=entity_id).order_by("-created_at")
    return Response(AuditEventSerializer(queryset, many=True).data)


@api_view(["GET"])
def signal_history(request, entity_id):
    return history(request, "signals", entity_id)


@api_view(["GET"])
def trend_history(request, entity_id):
    return history(request, "trends", entity_id)


@api_view(["GET"])
def trends(_request):
    return Response(TrendSerializer(Trend.objects.order_by("-created_at"), many=True).data)


@protected_api_view(["POST"])
def cluster_trend(request):
    data = {**request.data, "id": request.data.get("id") or new_uuid()}
    serializer = TrendSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@protected_api_view(["PATCH"])
def trend_detail(request, trend_id):
    try:
        trend = Trend.objects.get(id=trend_id)
    except Trend.DoesNotExist:
        return Response({"detail": "Trend not found"}, status=status.HTTP_404_NOT_FOUND)
    previous_status = trend.status
    serializer = TrendSerializer(trend, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_at=timezone.now())
    if "status" in request.data:
        audit(f"trend_{request.data['status']}", "trends", trend_id, {"previous_value": previous_status, "new_value": request.data["status"]})
    return Response(serializer.data)


@protected_api_view(["GET", "POST"])
def trend_evidence(request, trend_id):
    if request.method == "GET":
        queryset = EvidenceLink.objects.filter(trend_id=trend_id)
        return Response(EvidenceLinkSerializer(queryset, many=True).data)

    data = {**request.data, "id": request.data.get("id") or new_uuid(), "trend_id": trend_id}
    serializer = EvidenceLinkSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    audit("evidence_linked", "evidence_links", serializer.instance.id, {"trend_id": trend_id})
    return Response(serializer.data)


@protected_api_view(["GET", "POST"])
def monitoring_rules(request):
    if request.method == "GET":
        return Response(MonitoringRuleSerializer(MonitoringRule.objects.all(), many=True).data)
    data = {**request.data, "id": request.data.get("id") or new_uuid()}
    serializer = MonitoringRuleSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@protected_api_view(["DELETE"])
def monitoring_rule_detail(_request, rule_id):
    MonitoringRule.objects.filter(id=rule_id).delete()
    audit("monitoring_rule_deleted", "monitoring_rules", rule_id)
    return Response({"success": True})


@protected_api_view(["POST"])
def run_monitoring_rule(_request, rule_id):
    try:
        rule = MonitoringRule.objects.get(id=rule_id)
    except MonitoringRule.DoesNotExist:
        return Response({"detail": "Monitoring rule not found"}, status=status.HTTP_404_NOT_FOUND)
    run = MonitoringRun.objects.create(
        id=new_uuid(),
        rule=rule,
        source=rule.source,
        started_at=timezone.now(),
        completed_at=timezone.now(),
        status="completed",
        documents_scanned=0,
        new_documents_found=0,
        updated_documents_found=0,
        new_signals_found=0,
    )
    audit("monitoring_run_triggered", "monitoring_runs", run.id, {"rule_id": rule_id})
    return Response(MonitoringRunSerializer(run).data)


@api_view(["GET"])
def monitoring_runs(_request):
    return Response(MonitoringRunSerializer(MonitoringRun.objects.all(), many=True).data)


@protected_api_view(["GET", "POST"])
def strategic_contexts(request):
    if request.method == "GET":
        return Response(StrategicContextSerializer(StrategicContext.objects.all(), many=True).data)

    item_id = request.data.get("id") or new_uuid()
    instance = StrategicContext.objects.filter(id=item_id).first()
    serializer = StrategicContextSerializer(instance, data={**request.data, "id": item_id}, partial=bool(instance))
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@protected_api_view(["POST"])
def agent_extract(_request, document_id):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response({"detail": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
    signal = Signal.objects.create(
        id=new_uuid(),
        document=document,
        source=document.source,
        title=document.title,
        summary=(document.content or "")[:500],
        signal_type="extracted",
        pestle_category="Technology",
        novelty_score=0.5,
        strength_score=0.5,
        confidence_score=0.5,
        evidence_date=document.published_at,
    )
    return Response([SignalSerializer(signal).data])


@api_view(["GET"])
def source_snapshots_for_source(_request, _source_id):
    return Response([])


@api_view(["GET"])
def insights_summary(_request):
    trends_data = TrendSerializer(Trend.objects.order_by("-updated_at"), many=True).data
    return Response(
        {
            "id": "insight-summary",
            "industry_profile_id": "default",
            "generated_at": timezone.now().isoformat(),
            "ai_summary": f"{len(trends_data)} trends available for review.",
            "key_trends": trends_data[:3],
            "watch_items": trends_data[3:6],
            "emerging_risks": [],
            "opportunities": trends_data[:2],
        }
    )


@protected_api_view(["POST"])
def data_health(_request):
    issues = []
    approved = Trend.objects.filter(status="approved")
    for trend in approved:
        if not trend.evidence_links.exists():
            issues.append({"severity": "error", "entity_type": "trend", "entity_id": trend.id, "message": "Approved trend has no evidence links"})
    return Response({"status": "healthy" if not issues else "degraded", "checks_run": 1, "issue_count": len(issues), "issues": issues, "latest_checks": []})


@protected_api_view(["GET", "POST", "PATCH"])
def generic_empty(request, **_kwargs):
    if request.method == "GET":
        return Response([])
    return Response({})


@protected_api_view(["POST"])
def import_sources(request):
    created = 0
    for source in request.data.get("sources", []):
        serializer = SourceSerializer(data={**source, "id": source.get("id") or new_uuid()})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        created += 1
    return Response({"import_record": {"id": new_uuid(), "status": "completed"}, "imported_count": created, "errors": [], "message": f"Imported {created} sources"})


@protected_api_view(["POST"])
def import_documents(request):
    created = 0
    for document in request.data.get("documents", []):
        serializer = DocumentSerializer(data={**document, "id": document.get("id") or new_uuid()})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        created += 1
    return Response({"import_record": {"id": new_uuid(), "status": "completed"}, "imported_count": created, "errors": [], "message": f"Imported {created} documents"})


@protected_api_view(["POST"])
def extract_documents_from_sources(_request):
    return Response({"import_record": {"id": new_uuid(), "status": "completed"}, "imported_count": 0, "errors": [], "message": "Django backend is connected. Document fetching can be configured next."})


@protected_api_view(["POST"])
def search_semantic(_request):
    return Response({"results": []})


@api_view(["GET"])
def score_history(_request, _trend_id):
    return Response({"snapshots": [], "changes": []})


@api_view(["GET"])
def export_trend(_request, trend_id):
    return Response({"export": {"id": "export", "status": "completed"}, "payload": {"trend": {"id": trend_id}}})


@api_view(["GET"])
def export_industry(_request, industry_id):
    return Response({"export": {"id": "export", "status": "completed"}, "payload": {"industry": {"id": industry_id}}})


@protected_api_view(["POST"])
def build_knowledge_graph(_request, trend_id):
    return Response({"trend_id": trend_id, "nodes_created": 0, "edges_created": 0, "node_ids": [], "edge_ids": []})


@api_view(["GET"])
def knowledge_neighborhood(_request, entity_id):
    return Response({"center_entity_id": entity_id, "nodes": [], "edges": []})


@protected_api_view(["POST"])
def source_reliability(_request, source_id):
    return Response({"source_id": source_id, "reliability_score": 0, "rationale": []})


@protected_api_view(["POST"])
def prediction_calibration(_request, prediction_id=None):
    return Response({"prediction_id": prediction_id, "prediction_count": 0, "mean_absolute_error": 0, "calibration_notes": []})
