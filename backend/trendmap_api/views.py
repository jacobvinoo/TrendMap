import os
from rest_framework import viewsets, filters
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.conf import settings
from django.db import transaction
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from html import unescape
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from urllib.parse import quote_plus, urljoin, urlparse
from xml.etree import ElementTree
from email.utils import parsedate_to_datetime
from datetime import datetime, time as datetime_time
from io import BytesIO
from zipfile import ZipFile, BadZipFile
import re
import json
import time

@api_view(["GET"])
def version(_request):
    return Response({"version": "1.0.0", "framework": "django"})

from rest_framework import status
import uuid

@api_view(["GET"])
def health(_request):
    return Response({"status": "ok"})


@ensure_csrf_cookie
@api_view(["GET"])
def csrf_token(request):
    return Response({"csrfToken": get_token(request)})

@api_view(["POST"])
def agent_extract(_request, document_id):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response({"detail": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    signals = Signal.objects.filter(document=document)
    EvidenceLink.objects.filter(signal__in=signals).delete()
    signals.delete()
    extracted = []
    for key, meta, sentence in extract_document_signals(document):
        signal = Signal.objects.create(
            id=str(uuid.uuid4()),
            document=document,
            source=document.source,
            extraction_run=document.extraction_run,
            title=meta["name"],
            summary=sentence[:1000],
            signal_type=key,
            pestle_category=meta["category"],
            novelty_score=0.72,
            strength_score=0.78 if len(sentence.split()) > 18 else 0.66,
            confidence_score=0.74,
            evidence_date=document.published_at,
            created_at=timezone.now(),
        )
        extracted.append(signal)

    document.status = "extracted" if extracted else "processed"
    document.created_at = document.created_at or timezone.now()
    document.save(update_fields=["status", "created_at"])
    return Response(SignalSerializer(extracted, many=True).data)

@api_view(["POST"])
def cluster_trend(request):
    data = {**request.data, "id": request.data.get("id") or str(uuid.uuid4())}
    serializer = TrendSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
from .models import Industry, Source, Document, Signal, Trend, TrendTheme, ExtractionRun, NewsScanRun, NewsSnippet, AgentActivity, AgentDebate, Alert, Assumption, AuditEvent, ChangeEvent, DataExport, DecisionBrief, Embedding, EvidenceLink, HealthCheck, KgEdge, KgNode, LeadingIndicator, MonitoringRule, MonitoringRun, PredictionOutcome, PredictionUpdate, Prediction, RoadmapItem, Scenario, SourceSnapshot, StrategicContext, StrategicImplication, StrategicOption, TrendScoreChange, TrendScoreSnapshot, WhatChangedSummary
from .source_utils import normalize_source_url, preferred_source
from .serializers import (
    IndustrySerializer, SourceSerializer, DocumentSerializer, 
    SignalSerializer, TrendSerializer, TrendThemeSerializer, NewsScanRunSerializer, NewsSnippetSerializer, AgentActivitySerializer, AgentDebateSerializer, AlertSerializer, AssumptionSerializer, AuditEventSerializer, ChangeEventSerializer, DataExportSerializer, DecisionBriefSerializer, EmbeddingSerializer, EvidenceLinkSerializer, HealthCheckSerializer, KgEdgeSerializer, KgNodeSerializer, LeadingIndicatorSerializer, MonitoringRuleSerializer, MonitoringRunSerializer, PredictionOutcomeSerializer, PredictionUpdateSerializer, PredictionSerializer, RoadmapItemSerializer, ScenarioSerializer, SourceSnapshotSerializer, StrategicContextSerializer, StrategicImplicationSerializer, StrategicOptionSerializer, TrendScoreChangeSerializer, TrendScoreSnapshotSerializer, WhatChangedSummarySerializer
)


def extract_pdf_text_from_bytes(data):
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ValueError("PDF extraction requires the pypdf package. Install backend requirements, then try again.")

    try:
        reader = PdfReader(BytesIO(data))
        return clean_extracted_text(" ".join(page.extract_text() or "" for page in reader.pages))
    except Exception as exc:
        raise ValueError(f"Could not read text from the PDF file: {exc}")


def extract_uploaded_document_text(uploaded_file):
    filename = (uploaded_file.name or "").lower()
    data = uploaded_file.read()
    if len(data) > 5 * 1024 * 1024:
        raise ValueError("Uploaded file is larger than the 5 MB limit.")

    if filename.endswith(".docx"):
        try:
            with ZipFile(BytesIO(data)) as archive:
                xml = archive.read("word/document.xml")
        except (KeyError, BadZipFile):
            raise ValueError("Could not read text from the DOCX file.")
        root = ElementTree.fromstring(xml)
        text_parts = [node.text for node in root.iter() if node.text]
        return clean_extracted_text(" ".join(text_parts))

    if filename.endswith(".pdf"):
        return extract_pdf_text_from_bytes(data)

    try:
        raw_text = data.decode("utf-8")
    except UnicodeDecodeError:
        raw_text = data.decode("latin-1", errors="ignore")

    if filename.endswith((".html", ".htm")):
        _title, raw_text = strip_html_text(raw_text)
    return clean_extracted_text(raw_text)


def database_datetime(value=None):
    if not value:
        value = timezone.now()
    elif isinstance(value, str):
        parsed = parse_datetime(value)
        if parsed is None:
            parsed_day = parse_date(value)
            parsed = datetime.combine(parsed_day, datetime_time.min) if parsed_day else None
        value = parsed or timezone.now()

    if not settings.USE_TZ and timezone.is_aware(value):
        return timezone.make_naive(value)
    if settings.USE_TZ and timezone.is_naive(value):
        return timezone.make_aware(value)
    return value


@api_view(["POST"])
def upload_document(request):
    source_id = request.data.get("source_id") or request.data.get("sourceId")
    source = Source.objects.filter(id=source_id).first()
    if not source:
        return Response({"detail": "A valid source_id is required for uploaded documents."}, status=status.HTTP_400_BAD_REQUEST)

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response({"detail": "Upload a document file."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        content = extract_uploaded_document_text(uploaded_file)
    except (ValueError, ElementTree.ParseError) as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if len(content.split()) < 8:
        return Response({"detail": "The uploaded file did not contain enough readable text to store."}, status=status.HTTP_400_BAD_REQUEST)

    title = (request.data.get("title") or uploaded_file.name or "Uploaded document").strip()
    published_at = database_datetime(request.data.get("published_date") or request.data.get("publishedDate"))
    document = Document.objects.create(
        id=str(uuid.uuid4()),
        source=source,
        title=title[:255],
        url=request.data.get("url", ""),
        content=content[:8000],
        status="raw",
        published_at=published_at,
        created_at=database_datetime(),
    )
    return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)

ANALYSIS_CLEAR_TARGETS = [
    ("prediction_outcomes", PredictionOutcome),
    ("prediction_updates", PredictionUpdate),
    ("predictions", Prediction),
    ("agent_debates", AgentDebate),
    ("alerts", Alert),
    ("assumptions", Assumption),
    ("strategic_implications", StrategicImplication),
    ("trend_score_changes", TrendScoreChange),
    ("trend_score_snapshots", TrendScoreSnapshot),
    ("what_changed_summaries", WhatChangedSummary),
    ("evidence_links", EvidenceLink),
    ("signals", Signal),
    ("documents", Document),
    ("trends", Trend),
    ("extraction_runs", ExtractionRun),
]


@api_view(["POST"])
def clear_analysis_data(_request):
    counts = {label: model.objects.count() for label, model in ANALYSIS_CLEAR_TARGETS}
    with transaction.atomic():
        for _label, model in ANALYSIS_CLEAR_TARGETS:
            model.objects.all().delete()

    return Response({
        "status": "cleared",
        "deleted_counts": counts,
        "message": "Generated documents, signals, trends, evidence, runs, and insight-like analysis data were cleared. Industries and sources were preserved.",
    })


@api_view(["POST"])
def data_health(_request):
    start = time.perf_counter()
    issues = []

    approved_trends = Trend.objects.filter(status="approved")
    for trend in approved_trends:
        if not EvidenceLink.objects.filter(trend=trend).exists():
            issues.append({
                "severity": "error",
                "entity_type": "trend",
                "entity_id": str(trend.id),
                "message": "Approved trend has no evidence links. Regenerate candidate trends from the current signals and approve again.",
            })

    for signal in Signal.objects.select_related("document", "source"):
        if not signal.document_id:
            issues.append({
                "severity": "error",
                "entity_type": "signal",
                "entity_id": str(signal.id),
                "message": "Signal is missing its source document.",
            })
            continue
        if not signal.source_id:
            issues.append({
                "severity": "error",
                "entity_type": "signal",
                "entity_id": str(signal.id),
                "message": "Signal is missing its source.",
            })
        if signal.document and not (signal.document.content or "").strip():
            issues.append({
                "severity": "warning",
                "entity_type": "document",
                "entity_id": str(signal.document_id),
                "message": "Signal points to a document with no stored excerpt.",
            })

    for document in Document.objects.select_related("source"):
        content = document.content or ""
        if len(content.split()) < 40:
            issues.append({
                "severity": "warning",
                "entity_type": "document",
                "entity_id": str(document.id),
                "message": "Stored document excerpt is too short to support reliable signal review.",
            })
        if looks_like_site_metadata(content[:2000]) or looks_like_landing_page_text(content[:2000]) or looks_like_page_chrome(content[:2000]):
            issues.append({
                "severity": "error",
                "entity_type": "document",
                "entity_id": str(document.id),
                "message": "Stored document appears to contain page chrome, site metadata, or landing-page copy.",
            })
        if document.source and document.source.status != "approved":
            issues.append({
                "severity": "warning",
                "entity_type": "document",
                "entity_id": str(document.id),
                "message": "Document is linked to a source that is not currently approved.",
            })

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    health_status = "healthy" if not issues else "degraded"
    check = HealthCheck.objects.create(
        id=str(uuid.uuid4()),
        component="data_integrity",
        status=health_status,
        latency_ms=latency_ms,
        details=json.dumps({"issueCount": len(issues)}),
        timestamp=timezone.now(),
    )
    latest_checks = HealthCheck.objects.order_by("-timestamp")[:5]

    return Response({
        "status": health_status,
        "checks_run": 1,
        "issue_count": len(issues),
        "issues": issues,
        "latest_checks": HealthCheckSerializer(latest_checks, many=True).data,
    })


def _score(value):
    return value if value is not None else 0


def _trend_sort_key(trend):
    return (-_score(trend.impact_score), -_score(trend.confidence_score), trend.name.lower())


@api_view(["GET"])
def insights_summary(_request):
    industry = Industry.objects.order_by("-updated_at", "-created_at").first()
    approved_trends = sorted(Trend.objects.filter(status="approved"), key=_trend_sort_key)
    trend_ids = "-".join(sorted(str(trend.id) for trend in approved_trends)) or "empty"

    key_trends = approved_trends[:3]
    watch_items = [
        trend for trend in approved_trends
        if _score(trend.impact_score) >= 0.7 and _score(trend.confidence_score) < 0.7
    ]
    emerging_risks = [
        trend for trend in approved_trends
        if trend.blockers or "risk" in f"{trend.name} {trend.summary or ''}".lower()
    ]
    opportunities = [
        trend for trend in approved_trends
        if trend.recommended_actions or _score(trend.impact_score) >= 0.7
    ]

    profile_id = str(industry.id) if industry else "default"
    industry_name = industry.name if industry else "the saved industry"
    if approved_trends:
        ai_summary = (
            f"{len(approved_trends)} approved trend"
            f"{'s' if len(approved_trends) != 1 else ''} are ready for strategic review for {industry_name}. "
            "Use the evidence traceability controls to inspect the source documents behind each trend before moving into strategy options."
        )
    else:
        ai_summary = "No approved trends are available yet. Approve candidate trends to generate the strategic brief."

    return Response({
        "id": f"summary-{profile_id}-{trend_ids}",
        "industry_profile_id": profile_id,
        "generated_at": timezone.now().isoformat(),
        "ai_summary": ai_summary,
        "key_trends": TrendSerializer(key_trends, many=True).data,
        "watch_items": TrendSerializer(watch_items, many=True).data,
        "emerging_risks": TrendSerializer(emerging_risks, many=True).data,
        "opportunities": TrendSerializer(opportunities, many=True).data,
    })

GENERAL_RETAIL_SOURCES = [
    ("McKinsey Retail Insights", "https://www.mckinsey.com/industries/retail/our-insights", "report"),
    ("Retail Dive", "https://www.retaildive.com/", "news"),
    ("Grocery Dive", "https://www.grocerydive.com/", "news"),
    ("NielsenIQ Retail and Consumer Insights", "https://nielseniq.com/global/en/insights/", "research"),
    ("Forrester Digital Commerce Research", "https://www.forrester.com/blogs/category/digital-business/", "research"),
]

NZ_RETAIL_SOURCES = [
    ("Inside Retail New Zealand", "https://insideretail.co.nz/", "news"),
    ("New Zealand Herald Business", "https://www.nzherald.co.nz/business/", "news"),
]

DOMAIN_TERMS = {
    "ai_grocery_discovery": {
        "name": "AI-assisted grocery discovery",
        "keywords": ["ai", "artificial intelligence", "personalisation", "personalization", "recommendation", "semantic search", "conversational", "assistant", "search"],
        "category": "Technology",
        "impact": 0.82,
    },
    "fulfilment_convenience": {
        "name": "Convenience and fulfilment innovation",
        "keywords": ["delivery", "fulfilment", "fulfillment", "last mile", "click and collect", "pickup", "logistics", "substitution", "availability"],
        "category": "Operations",
        "impact": 0.78,
    },
    "value_seeking": {
        "name": "Value-seeking grocery behaviour",
        "keywords": ["price", "inflation", "value", "private label", "discount", "promotion", "cost of living", "loyalty"],
        "category": "Economic",
        "impact": 0.74,
    },
    "retail_media": {
        "name": "Retail media influence on grocery discovery",
        "keywords": ["retail media", "sponsored", "advertising", "ad placement", "media network"],
        "category": "Economic",
        "impact": 0.68,
    },
    "trust_transparency": {
        "name": "Trust and transparency in digital grocery",
        "keywords": ["trust", "transparency", "privacy", "explainability", "data use", "disclosure"],
        "category": "Regulatory",
        "impact": 0.66,
    },
    "sustainable_operations": {
        "name": "Sustainable grocery operations",
        "keywords": ["sustainability", "food waste", "packaging", "emissions", "carbon", "circular"],
        "category": "Environmental",
        "impact": 0.62,
    },
}

THEME_CATALOG = [
    {
        "name": "Shopper value and affordability",
        "description": "Price sensitivity, private label, promotions, loyalty mechanics, basket trade-down, and value perception.",
        "keywords": ["price", "inflation", "value", "private label", "discount", "promotion", "cost of living", "loyalty"],
    },
    {
        "name": "Digital grocery discovery and personalisation",
        "description": "Search, recommendations, conversational shopping, product discovery, substitution guidance, and basket-building journeys.",
        "keywords": ["search", "recommendation", "personalisation", "personalization", "ai", "semantic", "conversational", "basket"],
    },
    {
        "name": "Fulfilment, availability, and convenience",
        "description": "Delivery, pickup, click-and-collect, substitution, last-mile economics, stock availability, and service promises.",
        "keywords": ["delivery", "fulfilment", "fulfillment", "pickup", "click and collect", "availability", "substitution", "last mile"],
    },
    {
        "name": "Trust, transparency, and data use",
        "description": "Trust in AI recommendations, sponsored results, data use, privacy, disclosure, and customer confidence.",
        "keywords": ["trust", "transparency", "privacy", "data use", "disclosure", "sponsored", "explainability"],
    },
    {
        "name": "Retail media and supplier monetisation",
        "description": "Retail media networks, sponsored placement, supplier-funded offers, advertising yield, and search relevance trade-offs.",
        "keywords": ["retail media", "advertising", "sponsored", "media network", "supplier funded", "ad placement"],
    },
    {
        "name": "Sustainable and resilient grocery operations",
        "description": "Food waste, packaging, emissions, supply resilience, inventory efficiency, and operational sustainability.",
        "keywords": ["sustainability", "food waste", "packaging", "emissions", "carbon", "resilience", "inventory"],
    },
]

THEME_SOURCE_CANDIDATES = {
    "Shopper value and affordability": [
        ("NielsenIQ Retail and Consumer Insights", "https://nielseniq.com/global/en/insights/", "research"),
        ("Consumer NZ", "https://www.consumer.org.nz/articles", "publication"),
        ("Stats NZ Consumer Prices", "https://www.stats.govt.nz/topics/consumer-price-index", "research"),
    ],
    "Digital grocery discovery and personalisation": [
        ("Retail Dive", "https://www.retaildive.com/", "news"),
        ("Grocery Dive", "https://www.grocerydive.com/", "news"),
        ("Forrester Digital Commerce Research", "https://www.forrester.com/blogs/category/digital-business/", "research"),
    ],
    "Fulfilment, availability, and convenience": [
        ("McKinsey Retail Insights", "https://www.mckinsey.com/industries/retail/our-insights", "report"),
        ("Grocery Dive", "https://www.grocerydive.com/", "news"),
        ("Retail NZ", "https://retail.kiwi/news-and-insights/", "publication"),
    ],
    "Trust, transparency, and data use": [
        ("Office of the Privacy Commissioner NZ", "https://www.privacy.org.nz/publications/", "regulatory"),
        ("Forrester Digital Commerce Research", "https://www.forrester.com/blogs/category/digital-business/", "research"),
        ("Retail Dive", "https://www.retaildive.com/", "news"),
    ],
    "Retail media and supplier monetisation": [
        ("Retail Dive", "https://www.retaildive.com/", "news"),
        ("McKinsey Retail Insights", "https://www.mckinsey.com/industries/retail/our-insights", "report"),
        ("IAB New Zealand", "https://www.iab.org.nz/news", "publication"),
    ],
    "Sustainable and resilient grocery operations": [
        ("Sustainable Business Network", "https://sustainable.org.nz/learn/news-insights/", "publication"),
        ("Ministry for the Environment NZ", "https://environment.govt.nz/news/", "regulatory"),
        ("Grocery Dive", "https://www.grocerydive.com/", "news"),
    ],
}

NOISE_TERMS = ["fashion", "beauty", "tourism", "data center", "data centres", "zero trust security", "bankruptcy", "sports", "apparel"]
EXTRACTION_LOGS = []
FETCH_CACHE = {}
FETCH_BYTES_CACHE = {}
SITE_METADATA_TERMS = [
    "sectionkeywords", "lastmodified", "site-menu", "site-path", "breadcrumb",
    "subitems", "accentcolor", "root_slug", "rootslug", "expires", "horizontal navigation",
    "main navigation", "__next_data__", "window.__", "webpack", "application/ld+json",
]
LANDING_PAGE_TERMS = [
    "skip to content", "who we serve", "what we offer", "request a demo",
    "learn more", "forrester decisions", "forrester wave", "technology architecture",
    "b2b marketing", "revenue operations", "customer experience digital business",
    "industries financial services", "consulting demand generation",
]
LOW_EVIDENCE_PHRASES = [
    "learn more", "request a demo", "skip to content", "who we serve", "what we offer",
    "forrester decisions", "advance technology modernization initiatives",
    "capture new opportunities and deliver business value",
    "turn strategy into resilient, scalable technology foundations",
    "no aspect of operations or experiences will remain untouched",
]
LOW_VALUE_TITLE_TERMS = [
    "resources for retailers and business owners",
    "perceptions of retail as a career",
    "member benefits",
    "membership",
]
ARTICLE_TAIL_MARKERS = [
    "Recommended By", "Related Articles", "Read More", "More from", "Sponsored Content",
    "Partner Content", "Share this article", "Sign up for", "Subscribe to",
]
PAGE_CHROME_TERMS = [
    "desktop logo", "mobile logo", "toggle mega menu", "toggle topics", "site search",
    "submit site search", "latest startups venture", "events podcasts newsletters",
    "partner content", "brand studio", "crunchboard", "login subscribe",
    "member login", "join now", "preferred partners", "choose language",
    "solutions industries partner network", "contact us solutions",
    "let’s talk intro", "let's talk intro", "trusted ai for new era", "fast facts",
]
COMMERCE_CONTEXT_TERMS = [
    "grocery", "grocer", "supermarket", "instacart", "kroger", "costco", "safeway",
    "foodstuffs", "four square", "new world", "woolworths", "countdown",
    "retail", "retailer", "shopping", "shopper", "commerce", "e-commerce",
    "product", "pricing", "price", "loyalty", "basket", "checkout", "store",
    "consumer nz", "consumer reports",
]
ARTICLE_START_PATTERNS = [
    r"\bA recent study\b",
    r"\bAccording to\b",
    r"\bLoyalty cards\b",
    r"\bSeven out of 10\b",
    r"“Retailers know\b",
    r"\bThe survey found\b",
    r"\bBut its arrival\b",
    r"\bFrom order management\b",
    r"\bAI is reshaping\b",
    r"\bHow Eastern platform\b",
]
ARTICLE_PATH_HINTS = [
    "article", "insight", "news", "trend", "research", "report", "grocery", "retail",
    "commerce", "consumer", "supermarket", "shopping", "delivery", "technology"
]
SOURCE_FETCH_LIMIT = 4


def extraction_log(message):
    timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
    EXTRACTION_LOGS.append(f"[{timestamp}] {message}")
    del EXTRACTION_LOGS[:-200]


def sse_event(message):
    return f"data: {message.replace(chr(10), ' ')}\n\n"


def latest_industry():
    return Industry.objects.order_by("-updated_at", "-id").first()

def parse_json_list_field(value):
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if str(item).strip()]
        except (TypeError, ValueError):
            return [part.strip() for part in value.split(",") if part.strip()]
    return []


def theme_text(industry=None):
    industry = industry or latest_industry()
    if not industry:
        return ""
    parts = [
        industry.name,
        industry.geography,
        industry.description,
        " ".join(parse_json_list_field(getattr(industry, "strategic_priorities", ""))),
        " ".join(parse_json_list_field(getattr(industry, "customer_segments", ""))),
        " ".join(parse_json_list_field(getattr(industry, "competitors", ""))),
        " ".join(parse_json_list_field(getattr(industry, "time_horizons", ""))),
    ]
    return " ".join(str(part or "") for part in parts).lower()


def default_theme_payloads(industry=None):
    text = theme_text(industry)
    payloads = []
    for item in THEME_CATALOG:
        keyword_hits = sum(1 for keyword in item["keywords"] if keyword_matches(text, keyword))
        broad_retail_context = any(term in text for term in ["grocery", "supermarket", "retail", "commerce"])
        include = keyword_hits > 0 or broad_retail_context
        if include:
            payloads.append({
                **item,
                "status": "suggested",
                "origin": "agent",
                "evidence_summary": (
                    f"Suggested from the saved industry context. Matched {keyword_hits} theme keyword"
                    f"{'' if keyword_hits == 1 else 's'}; use approval to focus source discovery."
                ),
            })
    return payloads[:8]


def ensure_theme(industry, payload, default_status="suggested"):
    existing = TrendTheme.objects.filter(industry=industry, name__iexact=payload.get("name", "")).first()
    defaults = {
        "description": payload.get("description", ""),
        "keywords": payload.get("keywords", []),
        "status": payload.get("status") or default_status,
        "origin": payload.get("origin", "agent"),
        "evidence_summary": payload.get("evidence_summary", ""),
        "updated_at": database_datetime(),
    }
    if existing:
        if existing.status == "approved":
            defaults["status"] = "approved"
        if existing.origin == "manual":
            defaults["origin"] = "manual"
        for key, value in defaults.items():
            setattr(existing, key, value)
        existing.save(update_fields=list(defaults.keys()))
        return existing, False
    theme = TrendTheme.objects.create(
        id=str(uuid.uuid4()),
        industry=industry,
        name=payload.get("name", "Untitled theme"),
        created_at=database_datetime(),
        **defaults,
    )
    return theme, True


def approved_themes(industry=None):
    industry = industry or latest_industry()
    return list(TrendTheme.objects.filter(industry=industry, status="approved").order_by("name")) if industry else []


def source_candidates_for_industry(industry=None):
    industry = industry or latest_industry()
    candidates = list(GENERAL_RETAIL_SOURCES)
    if industry and "new zealand" in f"{industry.geography} {industry.description}".lower():
        candidates.extend(NZ_RETAIL_SOURCES)
    theme_names = []
    for theme in approved_themes(industry):
        theme_names.append(theme.name)
        candidates.extend(THEME_SOURCE_CANDIDATES.get(theme.name, []))
    deduped = []
    seen = set()
    for name, url, source_type in candidates:
        normalized = normalize_source_url(url)
        if normalized in seen:
            continue
        seen.add(normalized)
        deduped.append((name, url, source_type, theme_names))
    return deduped


def source_for_url(url):
    normalized = normalize_source_url(url)
    matches = [
        source for source in Source.objects.all()
        if normalize_source_url(source.url) == normalized
    ]
    if not matches:
        return None
    return preferred_source(matches)


def latest_extraction_run(stage=None):
    runs = ExtractionRun.objects.all()
    if stage:
        runs = runs.filter(stage=stage)
    return runs.order_by("-started_at", "-id").first()


def industry_terms(industry=None):
    industry = industry or latest_industry()
    text = " ".join(
        str(value or "")
        for value in [
            getattr(industry, "name", ""),
            getattr(industry, "geography", ""),
            getattr(industry, "description", ""),
            getattr(industry, "strategic_priorities", ""),
            getattr(industry, "customer_segments", ""),
            getattr(industry, "competitors", ""),
            getattr(industry, "time_horizons", ""),
        ]
    ).lower()
    terms = set(re.findall(r"[a-z][a-z\-]{2,}", text))
    terms.update(["retail", "grocery", "supermarket", "online", "customer", "experience", "commerce", "delivery", "convenience"])
    return {term for term in terms if term not in {"the", "and", "for", "with", "that", "this", "from", "into"}}


def relevance_score(text, industry=None):
    haystack = (text or "").lower()
    terms = industry_terms(industry)
    strong_terms = {"grocery", "supermarket", "retail", "online", "commerce", "delivery", "customer", "shopper", "shopping"}
    strong_hits = sum(1 for term in strong_terms if term in haystack)
    industry_hits = sum(1 for term in terms if term in haystack)
    noise_hits = sum(1 for term in NOISE_TERMS if term in haystack)
    return strong_hits * 3 + industry_hits - min(noise_hits * 2, 6)


def has_commerce_context(text):
    lower = (text or "").lower()
    return any(keyword_matches(lower, term) for term in COMMERCE_CONTEXT_TERMS)


def is_industry_relevant(text, industry=None, threshold=3):
    return relevance_score(text, industry) >= threshold


def fetch_url_bytes(url):
    cache_key = (url or "").rstrip("/")
    if cache_key in FETCH_BYTES_CACHE:
        return FETCH_BYTES_CACHE[cache_key]
        
    if os.environ.get("E2E_TEST") == "1":
        content = b"<html><body><a href='/mock-e2e-article'>Mock E2E Article</a><p>This is a mock extracted content for testing source capture. AI is completely revolutionizing the modern grocery shopping experience for consumers worldwide in retail online commerce. This means that supermarkets must adapt to a new paradigm of digital transformation and operational efficiency. We are seeing increased adoption of cloud technologies, machine learning, predictive analytics, and automated supply chain management across the entire industry ecosystem. Early adopters will gain a significant competitive advantage over traditional brick and mortar operations.</p></body></html>"
        FETCH_BYTES_CACHE[cache_key] = (content, "text/html")
        return content, "text/html"
        
    request = Request(url, headers={"User-Agent": "TrendMap/1.0 (+local research workflow)"})
    with urlopen(request, timeout=12) as response:
        raw = response.read(250000)
        content_type = response.headers.get("Content-Type", "")
    FETCH_BYTES_CACHE[cache_key] = (raw, content_type)
    return raw, content_type


def fetch_url_text(url):
    cache_key = (url or "").rstrip("/")
    if cache_key in FETCH_CACHE:
        return FETCH_CACHE[cache_key]
    raw, content_type = fetch_url_bytes(url)
    text = raw.decode("utf-8", errors="ignore")
    FETCH_CACHE[cache_key] = (text, content_type)
    return text, content_type


def strip_html_text(text):
    title_match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    title = unescape(re.sub(r"\s+", " ", title_match.group(1))).strip() if title_match else ""
    article_blocks = re.findall(r"(?is)<article[^>]*>(.*?)</article>", text)
    if not article_blocks:
        article_blocks = re.findall(r"(?is)<main[^>]*>(.*?)</main>", text)
    if article_blocks:
        largest = max(article_blocks, key=len)
        if len(strip_html_text_fragment(largest).split()) >= 40:
            return title, strip_html_text_fragment(largest)
    text = re.sub(r"(?is)<(script|style|noscript|svg|template).*?</\1>", " ", text)
    text = re.sub(r"(?is)<(header|nav|footer|aside)[^>]*>.*?</\1>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = unescape(re.sub(r"\s+", " ", text)).strip()
    return title, text


def strip_html_text_fragment(text):
    text = re.sub(r"(?is)<(script|style|noscript|svg|template|header|nav|footer|aside).*?</\1>", " ", text or "")
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()


def looks_like_site_metadata(text):
    lower = (text or "").lower()
    if not lower:
        return False
    metadata_hits = sum(1 for term in SITE_METADATA_TERMS if term in lower)
    structural_chars = sum(lower.count(char) for char in ['{', '}', '":', '","'])
    words = max(1, len(lower.split()))
    return metadata_hits >= 2 or structural_chars / words > 0.08


def looks_like_landing_page_text(text):
    lower = (text or "").lower()
    if not lower:
        return False
    hits = sum(1 for term in LANDING_PAGE_TERMS if term in lower)
    return hits >= 5 or ("skip to content" in lower and hits >= 3)


def looks_like_page_chrome(text):
    lower = (text or "").lower()
    if not lower:
        return False
    hits = sum(1 for term in PAGE_CHROME_TERMS if term in lower)
    return hits >= 3 or ("skip to content" in lower and hits >= 2)


def focus_article_text(title, text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return ""

    title_core = re.sub(r"\s+\|\s+.*$", "", title or "").strip()
    candidates = []
    if title_core:
        first = text.lower().find(title_core.lower())
        second = text.lower().find(title_core.lower(), first + len(title_core)) if first >= 0 else -1
        if second >= 0:
            candidates.append(second)
    for pattern in ARTICLE_START_PATTERNS:
        match = re.search(pattern, text, re.I)
        if match:
            candidates.append(match.start())
    byline = re.search(r"\bBy\s+[A-Z][A-Za-z .'-]{2,60}\s+(?:Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May)\b", text)
    if byline:
        candidates.append(byline.start())

    if candidates:
        start = min(candidates)
        prefix = text[:start + 1]
        prefix_lower = prefix.lower()
        if (
            looks_like_page_chrome(prefix)
            or "skip to content" in prefix_lower
            or ("let" in prefix_lower and "talk" in prefix_lower and len(prefix.split()) < 90)
        ):
            text = text[start:]

    if title_core and text.lower().startswith(title_core.lower()):
        text = text[len(title_core):].strip(" -|")
    for marker in ARTICLE_TAIL_MARKERS:
        index = text.find(marker)
        if index > 250:
            text = text[:index].strip()
    return text


def clean_extracted_text(text):
    cleaned_segments = []
    for segment in re.split(r"(?<=[.!?])\s+|\n+", text or ""):
        segment = segment.strip()
        if not segment:
            continue
        if looks_like_site_metadata(segment):
            continue
        if looks_like_landing_page_text(segment):
            continue
        if looks_like_page_chrome(segment):
            continue
        if len(segment) > 1200 and any(term in segment.lower() for term in SITE_METADATA_TERMS):
            continue
        cleaned_segments.append(segment)
    return re.sub(r"\s+", " ", " ".join(cleaned_segments)).strip()


def fetch_source_excerpt(url):
    raw_bytes, content_type = fetch_url_bytes(url)
    if "pdf" in (content_type or "").lower() or urlparse(url or "").path.lower().endswith(".pdf"):
        text = extract_pdf_text_from_bytes(raw_bytes)
        if len(text.split()) < 40:
            raise ValueError(f"Fetched PDF from {url} did not contain enough readable text to review.")
        title = urlparse(url or "").path.rsplit("/", 1)[-1] or url
        return title[:240], text[:8000], content_type

    raw_text = raw_bytes.decode("utf-8", errors="ignore")
    title, text = strip_html_text(raw_text)
    if any(term in (title or "").lower() for term in LOW_VALUE_TITLE_TERMS):
        raise ValueError(f"Fetched content from {url} looked like a low-value resource or directory page rather than article evidence.")
    source_text = text
    text = focus_article_text(title, text)
    text = clean_extracted_text(text)
    if looks_like_site_metadata(source_text[:3000]) and len(text.split()) < 80:
        raise ValueError(f"Fetched content from {url} looked like site metadata rather than article text.")
    if looks_like_landing_page_text(source_text[:3000]) and len(text.split()) < 180:
        raise ValueError(f"Fetched content from {url} looked like a service or navigation landing page rather than article evidence.")
    if looks_like_landing_page_text(text[:2000]):
        raise ValueError(f"Fetched content from {url} still looked like a service or navigation landing page after cleanup.")
    if len(text.split()) < 40:
        raise ValueError(f"Fetched content from {url} was too thin to review.")
    return (title or url)[:240], text[:8000], content_type


def extract_feed_items(xml_text, base_url):
    try:
        root = ElementTree.fromstring(xml_text.encode("utf-8"))
    except ElementTree.ParseError:
        return []
    items = []
    for item in root.findall(".//item")[:20]:
        title = item.findtext("title") or ""
        link = item.findtext("link") or ""
        description = item.findtext("description") or ""
        if link:
            items.append((unescape(title), urljoin(base_url, link.strip()), strip_html_text(description)[1]))
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall(".//atom:entry", ns)[:20]:
        title = entry.findtext("atom:title", default="", namespaces=ns)
        link_node = entry.find("atom:link", ns)
        link = link_node.get("href", "") if link_node is not None else ""
        summary = entry.findtext("atom:summary", default="", namespaces=ns)
        if link:
            items.append((unescape(title), urljoin(base_url, link.strip()), strip_html_text(summary)[1]))
    return items


def parse_feed_date(value):
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
        if parsed and parsed.tzinfo:
            return parsed.astimezone(timezone.get_current_timezone()).replace(tzinfo=None)
        return parsed
    except (TypeError, ValueError, IndexError, OverflowError):
        return None


def node_text(node, child_name):
    found = node.find(child_name)
    return found.text if found is not None and found.text else ""


def parse_news_feed_items(xml_text, base_url):
    try:
        root = ElementTree.fromstring(xml_text.encode("utf-8"))
    except ElementTree.ParseError:
        return []

    items = []
    for item in root.findall(".//item")[:50]:
        source_node = item.find("source")
        source_url = source_node.get("url", "") if source_node is not None else ""
        source_name = source_node.text if source_node is not None and source_node.text else ""
        title = node_text(item, "title")
        link = node_text(item, "link")
        description = strip_html_text(node_text(item, "description"))[1]
        items.append({
            "title": unescape(title).strip(),
            "url": urljoin(base_url, link.strip()) if link else "",
            "publisher": unescape(source_name).strip(),
            "publisher_url": source_url.strip(),
            "snippet": description,
            "published_at": parse_feed_date(node_text(item, "pubDate")),
        })

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall(".//atom:entry", ns)[:50]:
        link_node = entry.find("atom:link", ns)
        source_node = entry.find("atom:source", ns)
        publisher = source_node.findtext("atom:title", default="", namespaces=ns) if source_node is not None else ""
        publisher_link = source_node.find("atom:link", ns) if source_node is not None else None
        items.append({
            "title": unescape(entry.findtext("atom:title", default="", namespaces=ns)).strip(),
            "url": urljoin(base_url, link_node.get("href", "")) if link_node is not None else "",
            "publisher": unescape(publisher).strip(),
            "publisher_url": publisher_link.get("href", "") if publisher_link is not None else "",
            "snippet": strip_html_text(entry.findtext("atom:summary", default="", namespaces=ns))[1],
            "published_at": parse_feed_date(entry.findtext("atom:updated", default="", namespaces=ns)),
        })
    return items


def industry_news_queries(industry=None):
    industry = industry or latest_industry()
    base = " ".join(part for part in [
        getattr(industry, "name", "") if industry else "",
        getattr(industry, "geography", "") if industry else "",
    ] if part).strip() or "retail trends"
    query_terms = [
        f"{base} news",
        f"{base} technology customer experience",
        f"{base} delivery supermarket grocery",
        f"{base} competitors market trends",
    ]
    return query_terms


def google_news_rss_url(query):
    return f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-NZ&gl=NZ&ceid=NZ:en"


def source_home_from_url(url):
    parsed = urlparse(url or "")
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def source_from_news_item(item):
    publisher_url = source_home_from_url(item.get("publisher_url")) or source_home_from_url(item.get("url"))
    publisher = item.get("publisher") or urlparse(publisher_url).netloc
    if not publisher_url or "news.google." in publisher_url:
        return None, False

    source = source_for_url(publisher_url)
    if source:
        return source, False

    source = Source.objects.create(
        id=str(uuid.uuid4()),
        name=publisher[:255] or publisher_url,
        url=publisher_url,
        source_type="news",
        credibility_score=0.68,
        relevance_score=0.72,
        freshness_score=0.92,
        status="suggested",
        notes="Discovered from daily news scanning because a relevant article snippet matched the saved industry context.",
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )
    return source, True


def run_news_scan(industry=None, queries=None):
    industry = industry or latest_industry()
    queries = queries or industry_news_queries(industry)
    run = NewsScanRun.objects.create(
        id=str(uuid.uuid4()),
        industry=industry,
        status="running",
        query="\n".join(queries),
        started_at=timezone.now(),
        scanned_count=0,
        matched_count=0,
        created_source_count=0,
    )
    errors = []
    seen_urls = set()
    created_source_count = 0
    scanned_count = 0
    matched_count = 0

    for query in queries:
        feed_url = google_news_rss_url(query)
        try:
            xml_text, _content_type = fetch_url_text(feed_url)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
            errors.append(f"{query}: {exc}")
            continue

        for item in parse_news_feed_items(xml_text, feed_url):
            url = (item.get("url") or "").split("#")[0]
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            scanned_count += 1
            text = f"{item.get('title', '')} {item.get('snippet', '')} {item.get('publisher', '')}"
            score = relevance_score(text, industry)
            if score < 5:
                continue
            source, created_source = source_from_news_item(item)
            if not source:
                continue
            matched_count += 1
            if created_source:
                created_source_count += 1
            NewsSnippet.objects.update_or_create(
                url=url,
                defaults={
                    "run": run,
                    "source": source,
                    "title": (item.get("title") or url)[:255],
                    "publisher": item.get("publisher", "")[:255],
                    "publisher_url": item.get("publisher_url", "")[:500],
                    "snippet": item.get("snippet", ""),
                    "relevance_score": score,
                    "status": "matched",
                    "published_at": item.get("published_at"),
                    "created_at": timezone.now(),
                },
            )

    run.status = "completed" if not errors or matched_count else "failed"
    run.completed_at = timezone.now()
    run.scanned_count = scanned_count
    run.matched_count = matched_count
    run.created_source_count = created_source_count
    run.summary = f"Scanned {scanned_count} news item(s), matched {matched_count}, created {created_source_count} source candidate(s)."
    run.error_summary = "\n".join(errors[:20])
    run.save(update_fields=["status", "completed_at", "scanned_count", "matched_count", "created_source_count", "summary", "error_summary"])
    return run


def discover_document_candidates(source, industry=None):
    base_url = source.url
    raw_text, content_type = fetch_url_text(base_url)
    candidates = []
    if "xml" in content_type or "<rss" in raw_text[:500].lower() or "<feed" in raw_text[:500].lower():
        candidates.extend(extract_feed_items(raw_text, base_url))

    feed_links = re.findall(r'<link[^>]+(?:type=["\']application/(?:rss|atom)\+xml["\'][^>]*href=["\']([^"\']+)["\']|href=["\']([^"\']+)["\'][^>]*type=["\']application/(?:rss|atom)\+xml["\'])', raw_text, re.I)
    for match in feed_links[:3]:
        feed_url = urljoin(base_url, next((part for part in match if part), ""))
        try:
            feed_text, _feed_type = fetch_url_text(feed_url)
            candidates.extend(extract_feed_items(feed_text, feed_url))
        except (HTTPError, URLError, TimeoutError, ValueError, OSError):
            continue

    for href, label in re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', raw_text, re.I | re.S)[:200]:
        url = urljoin(base_url, href)
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            continue
        label_text = strip_html_text(label)[1]
        path = parsed.path.lower()
        if not any(hint in f"{path} {label_text.lower()}" for hint in ARTICLE_PATH_HINTS):
            continue
        candidates.append((label_text[:240] or url, url, label_text))

    candidates.append((source.name, base_url, ""))
    deduped = []
    seen = set()
    for title, url, snippet in candidates:
        normalized = url.split("#")[0].rstrip("/")
        if normalized in seen:
            continue
        seen.add(normalized)
        score = relevance_score(f"{title} {snippet} {url}", industry)
        deduped.append((score, title, normalized, snippet))
    deduped.sort(key=lambda item: item[0], reverse=True)
    return deduped[:SOURCE_FETCH_LIMIT]


@api_view(["GET"])
def extraction_logs(_request):
    return Response({"logs": EXTRACTION_LOGS[-200:]})


def extraction_log_stream(_request):
    def events():
        snapshot = EXTRACTION_LOGS[-200:] or ["Extraction log stream connected."]
        yield "retry: 5000\n\n"
        for entry in snapshot:
            yield sse_event(entry)
        for _ in range(6):
            time.sleep(5)
            yield ": heartbeat\n\n"

    response = StreamingHttpResponse(events(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    return response


def sentence_chunks(text):
    chunks = re.split(r"(?<=[.!?])\s+", text or "")
    return [
        chunk.strip()
        for chunk in chunks
        if len(chunk.strip().split()) >= 8
        and not looks_like_site_metadata(chunk)
        and not looks_like_landing_page_text(chunk)
        and not looks_like_page_chrome(chunk)
        and not any(phrase in chunk.lower() for phrase in LOW_EVIDENCE_PHRASES)
    ]


def looks_like_title_only_evidence(sentence, document):
    sentence_norm = re.sub(r"[^a-z0-9]+", " ", sentence.lower()).strip()
    title_norm = re.sub(r"[^a-z0-9]+", " ", (document.title or "").lower()).strip()
    if not sentence_norm or not title_norm:
        return False
    return sentence_norm == title_norm or (sentence_norm in title_norm and len(sentence_norm.split()) < 14)


def infer_emergent_signal(sentence):
    lower = sentence.lower()
    themes = [
        ("customer_experience", "Customer experience pressure", ["customer", "shopper", "experience", "service", "loyalty", "checkout"]),
        ("availability_resilience", "Availability and resilience pressure", ["availability", "out of stock", "substitution", "supply", "inventory", "resilience"]),
        ("competitive_moves", "Competitive moves in grocery", ["competitor", "woolworths", "foodstuffs", "amazon", "walmart", "partnership", "launch"]),
        ("margin_value_tradeoff", "Margin and value trade-offs", ["margin", "price", "cost", "value", "discount", "inflation", "promotion"]),
        ("operating_model_change", "Operating model change", ["automation", "labour", "labor", "store", "fulfilment", "fulfillment", "operations"]),
    ]
    for key, title, keywords in themes:
        if any(keyword_matches(lower, keyword) for keyword in keywords):
            return key, {
                "name": title,
                "keywords": keywords,
                "category": "Strategic",
                "impact": 0.7,
            }
    return "emergent_grocery_signal", {
        "name": "Emergent grocery market signal",
        "keywords": [],
        "category": "Strategic",
        "impact": 0.64,
    }


def classify_existing_signal(signal):
    if signal.signal_type in DOMAIN_TERMS:
        return signal.signal_type, DOMAIN_TERMS[signal.signal_type]
    if signal.signal_type and str(signal.signal_type).startswith("emergent_"):
        return signal.signal_type, {
            "name": signal.title or "Emergent grocery market signal",
            "keywords": [],
            "category": signal.pestle_category or "Strategic",
            "impact": max(0.6, min(0.85, signal.strength_score or 0.68)),
        }
    classified = classify_signal(f"{signal.title} {signal.summary}") or classify_signal(getattr(signal.document, "content", ""))
    if classified:
        return classified
    if relevance_score(f"{signal.title} {signal.summary}", latest_industry()) >= 6:
        return infer_emergent_signal(f"{signal.title}. {signal.summary}")
    return None


def classify_signal(sentence):
    lower = sentence.lower()
    if "zero trust" in lower:
        return None
    for key, meta in DOMAIN_TERMS.items():
        if any(keyword_matches(lower, keyword) for keyword in meta["keywords"]):
            return key, meta
    return None


def keyword_matches(text, keyword):
    keyword = (keyword or "").lower().strip()
    if not keyword:
        return False
    escaped = re.escape(keyword)
    if " " in keyword or "-" in keyword:
        return re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text) is not None
    return re.search(rf"\b{escaped}\b", text) is not None


def extract_document_signals(document, industry=None):
    industry = industry or latest_industry()
    candidates = []
    seen_sentences = set()
    for sentence in sentence_chunks(document.content):
        if looks_like_title_only_evidence(sentence, document):
            continue
        if not has_commerce_context(sentence):
            continue
        score = relevance_score(sentence, industry)
        if score < 3:
            continue
        classified = classify_signal(sentence)
        if not classified and score >= 6:
            classified = infer_emergent_signal(sentence)
        if not classified:
            continue
        key, meta = classified
        normalized_sentence = sentence.lower()[:180]
        if key in {item[0] for item in candidates} or normalized_sentence in seen_sentences:
            continue
        seen_sentences.add(normalized_sentence)
        candidates.append((key, meta, sentence))
        if len(candidates) >= 8:
            break
    return candidates


def trend_payload_for_cluster(key, meta, signals, run=None):
    source_count = len({signal.source_id for signal in signals})
    avg_strength = sum(signal.strength_score or 0.6 for signal in signals) / len(signals)
    confidence = min(0.95, (sum(signal.confidence_score or 0.65 for signal in signals) / len(signals)) + min(source_count, 4) * 0.03)
    horizon = "6-12 months" if len(signals) >= 3 and avg_strength >= 0.75 else "12-24 months"
    name = meta["name"]
    run_suffix = f"-{str(run.id)[:8]}" if run else ""
    evidence_examples = [strategy_grade_quote(key, meta, signal) for signal in signals[:3]]
    evidence_examples = [quote for quote in evidence_examples if quote]
    thesis = strategic_trend_thesis(key, name, evidence_examples)
    strategic_fields = strategic_trend_fields(key, name)
    return {
        "id": f"trend-{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')}{run_suffix}",
        "extraction_run": run,
        "name": name,
        "summary": thesis,
        "status": "candidate",
        "horizon": horizon,
        "likelihood_score": min(1.0, avg_strength + min(source_count, 4) * 0.04),
        "confidence_score": confidence,
        "impact_score": meta["impact"],
        "maturity_stage": "emerging",
        "related_signal_ids": [str(signal.id) for signal in signals],
        "drivers": strategic_fields["drivers"],
        "blockers": strategic_fields["blockers"],
        "what_needs_to_be_true": strategic_fields["what_needs_to_be_true"],
        "leading_indicators": strategic_fields["leading_indicators"],
        "monitoring_questions": strategic_fields["monitoring_questions"],
        "recommended_actions": strategic_fields["recommended_actions"],
        "updated_at": timezone.now(),
    }


def strategy_grade_quote(key, meta, signal):
    keywords = meta.get("keywords", [])
    text_candidates = [
        signal.summary or "",
        getattr(signal.document, "content", "") or "",
    ]
    for text in text_candidates:
        for sentence in sentence_chunks(text):
            lower = sentence.lower()
            if not has_commerce_context(sentence):
                continue
            if not any(keyword_matches(lower, keyword) for keyword in keywords):
                continue
            if looks_like_weak_trend_evidence(sentence):
                continue
            return sentence[:700]
    return ""


def looks_like_weak_trend_evidence(sentence):
    lower = (sentence or "").lower()
    if len((sentence or "").split()) < 10:
        return True
    if any(phrase in lower for phrase in LOW_EVIDENCE_PHRASES):
        return True
    if any(term in lower for term in ["sporting goods", "fashion", "technology architecture", "b2b marketing"]):
        return True
    return False


def has_strategy_grade_evidence(key, meta, signals):
    qualified = []
    seen_quotes = set()
    for signal in signals:
        quote = strategy_grade_quote(key, meta, signal)
        if not quote:
            continue
        quote_key = re.sub(r"[^a-z0-9]+", " ", quote.lower())[:160]
        if quote_key in seen_quotes:
            continue
        seen_quotes.add(quote_key)
        qualified.append((signal, quote))
    source_count = len({signal.source_id for signal, _quote in qualified})
    return qualified if len(qualified) >= 2 and source_count >= 2 else []


def signal_matches_theme(signal, theme):
    haystack = f"{signal.title} {signal.summary} {getattr(signal.document, 'title', '')} {getattr(signal.document, 'content', '')[:800]}".lower()
    return any(keyword_matches(haystack, keyword) for keyword in (theme.keywords or []))


def propose_theme_from_signal(industry, key, meta, signal):
    if not industry:
        return None
    name = meta.get("name") or signal.title or "Emerging theme"
    existing = TrendTheme.objects.filter(industry=industry, name__iexact=name).first()
    if existing:
        return existing
    theme = TrendTheme.objects.create(
        id=str(uuid.uuid4()),
        industry=industry,
        name=name,
        description=f"Proposed from an off-theme signal during analysis: {signal.summary[:240]}",
        keywords=meta.get("keywords", []),
        status="suggested",
        origin="pipeline",
        evidence_summary=f"Signal '{signal.title}' did not match the current approved themes but may indicate a new area to monitor.",
        created_at=database_datetime(),
        updated_at=database_datetime(),
    )
    return theme


def strategic_trend_thesis(key, name, evidence_examples):
    evidence_clause = " ".join(evidence_examples[:2])
    if key == "value_seeking":
        return (
            "Shoppers are becoming more deliberate about grocery value, which can shift demand toward sharper price architecture, "
            "private label, personalised offers, and loyalty mechanics. Strategy should test where value perception can grow baskets "
            f"without eroding margin. Evidence: {evidence_clause}"
        ).strip()
    if key == "trust_transparency":
        return (
            "Trust is becoming a purchase and loyalty constraint for digital grocery experiences that use data, AI, retail media, "
            "substitutions, or personalised recommendations. Strategy should make recommendation logic, sponsored influence, and data use "
            f"visible enough to protect conversion and brand confidence. Evidence: {evidence_clause}"
        ).strip()
    if key == "ai_grocery_discovery":
        return (
            "AI-assisted discovery can reduce failed grocery searches and help shoppers build baskets faster, but it must be grounded in "
            "availability, merchandising rules, and customer trust. Strategy should prioritise narrow high-intent journeys before broad chatbot rollout. "
            f"Evidence: {evidence_clause}"
        ).strip()
    if key == "fulfilment_convenience":
        return (
            "Convenience expectations are raising the bar for delivery, pickup, substitution, and availability promises. Strategy should identify "
            "which fulfilment improvements drive retention and where service promises need operational guardrails. "
            f"Evidence: {evidence_clause}"
        ).strip()
    if key == "retail_media":
        return (
            "Retail media can create new revenue but may distort grocery discovery if sponsored placements reduce shopper trust or relevance. "
            "Strategy should balance ad yield with search quality, conversion, and customer experience. "
            f"Evidence: {evidence_clause}"
        ).strip()
    return (
        f"{name} appears in multiple approved grocery-relevant sources and should be treated as a strategic hypothesis, not a confirmed trend. "
        f"Strategy should validate customer impact, operational feasibility, and commercial upside. Evidence: {evidence_clause}"
    ).strip()


def strategic_trend_fields(key, name):
    templates = {
        "value_seeking": {
            "drivers": ["Cost-of-living pressure", "Greater shopper willingness to compare value across channels", "Private label and promotion sensitivity"],
            "blockers": ["Margin dilution from blanket discounting", "Supplier funding limits", "Weak personalisation data"],
            "what_needs_to_be_true": ["Value-seeking behaviour affects basket composition, not only headline price perception", "Targeted value mechanics can lift retention without broad margin erosion"],
            "leading_indicators": ["Private-label share movement", "Promotion redemption and incrementality", "Basket size among loyalty cohorts", "Searches and filters using price or deal terms"],
            "monitoring_questions": ["Which customer segments are trading down or splitting baskets?", "Which value offers change retention rather than subsidising existing demand?"],
            "recommended_actions": ["Model value-seeking segments by basket behaviour", "Test personalised value bundles against margin controls", "Track private-label substitution and repeat rate"],
        },
        "trust_transparency": {
            "drivers": ["Rising use of AI recommendations and retail media", "Customer sensitivity to data use and sponsored influence", "Regulatory scrutiny of algorithmic decisions"],
            "blockers": ["Opaque ranking logic", "Conflicts between ad revenue and customer relevance", "Insufficient consent and disclosure design"],
            "what_needs_to_be_true": ["Transparent recommendations improve trust or conversion", "Disclosure can be added without creating decision friction"],
            "leading_indicators": ["Complaint themes about recommendations or substitutions", "Opt-out rates for personalisation", "Sponsored placement conversion versus organic conversion"],
            "monitoring_questions": ["Where do shoppers need explanation most: search, recommendations, substitutions, or offers?", "Does disclosure reduce conversion or increase loyalty?"],
            "recommended_actions": ["Prototype 'why am I seeing this' labels", "Set governance rules for sponsored and AI-generated recommendations", "Measure trust, conversion, and complaint impact in A/B tests"],
        },
        "ai_grocery_discovery": {
            "drivers": ["Shopper expectation for natural-language search", "Retail investment in AI commerce", "Need to reduce zero-result and low-relevance searches"],
            "blockers": ["Product data quality", "Hallucinated or unavailable recommendations", "Latency and integration with inventory rules"],
            "what_needs_to_be_true": ["AI discovery improves conversion on high-intent grocery missions", "Recommendations respect availability, substitutions, price, and dietary constraints"],
            "leading_indicators": ["Zero-result search rate", "Search-to-cart conversion", "Conversational query volume", "Recommendation complaint rate"],
            "monitoring_questions": ["Which shopping missions benefit most from AI discovery?", "Does AI discovery lift basket size or only shift product mix?"],
            "recommended_actions": ["Pilot AI discovery on constrained missions such as meal planning or substitutions", "Improve product attributes and synonym coverage", "Add guardrails for sponsored and unavailable items"],
        },
    }
    return templates.get(key, {
        "drivers": ["Changing grocery shopper expectations", "Competitor experimentation", "Pressure to improve digital commerce economics"],
        "blockers": ["Unclear customer adoption", "Operational complexity", "Weak measurable business case"],
        "what_needs_to_be_true": [f"{name} affects grocery customer behaviour or operating economics", "Evidence continues across independent approved sources"],
        "leading_indicators": ["Repeat mentions across approved sources", "Retailer pilots or launches", "Measurable adoption or financial impact"],
        "monitoring_questions": ["Which customer segment or operating process is affected?", "What would make this material enough to fund?"],
        "recommended_actions": ["Validate the trend with internal data", "Define a small experiment and success metric", "Review source evidence before approving strategic options"],
    })

class IndustryViewSet(viewsets.ModelViewSet):
    queryset = Industry.objects.all().order_by('-updated_at', '-created_at')
    serializer_class = IndustrySerializer

    def perform_create(self, serializer):
        now = database_datetime()
        serializer.save(created_at=now, updated_at=now)

    def perform_update(self, serializer):
        serializer.save(updated_at=database_datetime())


class TrendThemeViewSet(viewsets.ModelViewSet):
    queryset = TrendTheme.objects.all().order_by('-updated_at', '-created_at')
    serializer_class = TrendThemeSerializer

    def perform_create(self, serializer):
        serializer.save(created_at=database_datetime(), updated_at=database_datetime())

    def perform_update(self, serializer):
        serializer.save(updated_at=database_datetime())

    @action(detail=False, methods=['post'], url_path='derive')
    def derive(self, request):
        industry_id = request.data.get("industry_id") or request.data.get("industryId")
        industry = Industry.objects.filter(id=industry_id).first() if industry_id else latest_industry()
        if not industry:
            return Response({"detail": "Industry profile not found"}, status=status.HTTP_404_NOT_FOUND)

        created_or_updated = []
        for payload in default_theme_payloads(industry):
            theme, _created = ensure_theme(industry, payload)
            created_or_updated.append(theme)
        return Response(TrendThemeSerializer(created_or_updated, many=True).data, status=status.HTTP_201_CREATED)


class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all().order_by('-created_at')
    serializer_class = SourceSerializer

class NewsScanRunViewSet(viewsets.ModelViewSet):
    queryset = NewsScanRun.objects.all().order_by('-started_at')
    serializer_class = NewsScanRunSerializer

class NewsSnippetViewSet(viewsets.ModelViewSet):
    queryset = NewsSnippet.objects.all().order_by('-created_at')
    serializer_class = NewsSnippetSerializer

@api_view(["POST"])
def scan_news(request):
    industry_id = request.data.get("industry_id") or request.data.get("industryId")
    industry = Industry.objects.filter(id=industry_id).first() if industry_id else latest_industry()
    queries = request.data.get("queries")
    if queries and not isinstance(queries, list):
        return Response({"detail": "queries must be a list of search strings."}, status=status.HTTP_400_BAD_REQUEST)
    run = run_news_scan(industry=industry, queries=queries)
    snippets = NewsSnippet.objects.filter(run=run)
    return Response({
        "run": NewsScanRunSerializer(run).data,
        "snippets": NewsSnippetSerializer(snippets, many=True).data,
        "sources_created": int(run.created_source_count or 0),
    }, status=status.HTTP_201_CREATED)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        with transaction.atomic():
            signal_ids = list(Signal.objects.filter(document=document).values_list('id', flat=True))
            EvidenceLink.objects.filter(document=document).delete()
            if signal_ids:
                EvidenceLink.objects.filter(signal_id__in=signal_ids).delete()
            Signal.objects.filter(document=document).delete()
            document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'sourceId' in data and 'source_id' not in data and 'source' not in data:
            data['source_id'] = data.pop('sourceId')
        if 'publishedDate' in data and 'published_date' not in data:
            data['published_date'] = data.pop('publishedDate')
        if 'ingestionStatus' in data and 'ingestion_status' not in data:
            data['ingestion_status'] = data.pop('ingestionStatus')

        content = (data.get('content') or '').strip()
        url = (data.get('url') or '').strip()
        if url and not content:
            try:
                title, extracted_content, _content_type = fetch_source_excerpt(url)
            except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
                return Response({"detail": f"Could not extract readable content from the reference URL: {exc}"}, status=status.HTTP_400_BAD_REQUEST)
            data['content'] = extracted_content
            if not (data.get('title') or '').strip():
                data['title'] = title

        if 'published_date' in data:
            data['published_date'] = database_datetime(data.get('published_date'))
        if 'created_at' not in data:
            data['created_at'] = database_datetime()

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'], url_path='extract-from-sources')
    def extract_from_sources(self, request):
        FETCH_CACHE.clear()
        FETCH_BYTES_CACHE.clear()
        industry = latest_industry()
        run = ExtractionRun.objects.create(
            id=str(uuid.uuid4()),
            industry=industry,
            stage="document_extraction",
            status="running",
            started_at=timezone.now(),
        )
        approved_sources = Source.objects.filter(status='approved')
        created_ids = []
        errors = []
        seen_urls = set()
        unique_sources = []
        for source in approved_sources:
            normalized_url = (source.url or "").rstrip("/").lower()
            if not normalized_url:
                continue
            if normalized_url in seen_urls:
                extraction_log(f"Skipped duplicate approved source URL: {source.name} ({source.url})")
                continue
            seen_urls.add(normalized_url)
            unique_sources.append(source)

        extraction_log(f"Starting document extraction run {run.id} for {len(unique_sources)} unique approved source URLs.")
        for source in unique_sources:
            try:
                candidates = discover_document_candidates(source, industry)
            except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
                error = f"{source.name}: {exc}"
                errors.append(error)
                extraction_log(f"Failed {error}")
                continue

            stored_for_source = 0
            last_error = None
            for candidate_score, candidate_title, candidate_url, _snippet in candidates:
                if candidate_score < 2 and candidate_url != (source.url or "").rstrip("/"):
                    continue
                extraction_log(f"Fetching {source.name}: {candidate_url}")
                try:
                    title, content, _content_type = fetch_source_excerpt(candidate_url)
                except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
                    last_error = f"{candidate_url}: {exc}"
                    continue

                if not is_industry_relevant(f"{title} {content}", industry, threshold=4):
                    last_error = f"{candidate_url}: fetched content did not match the saved industry context."
                    continue

                doc, _created = Document.objects.update_or_create(
                    source=source,
                    url=candidate_url,
                    defaults={
                        "extraction_run": run,
                        "title": (title or candidate_title or f"{source.name} extracted source")[:255],
                        "content": content,
                        "status": "raw",
                        "published_at": timezone.now(),
                        "created_at": timezone.now(),
                    },
                )
                created_ids.append(str(doc.id))
                stored_for_source += 1
                extraction_log(f"Stored excerpt from {source.name}: {doc.title} ({len(content.split())} words)")
                if stored_for_source >= 2:
                    break

            if stored_for_source == 0:
                error = f"{source.name}: {last_error or 'no relevant article or report candidates were found.'}"
                errors.append(error)
                extraction_log(f"Rejected {error}")
                continue

        run.status = "completed" if created_ids else "failed"
        run.completed_at = timezone.now()
        run.summary = f"{len(created_ids)} documents stored from {len(unique_sources)} unique approved source URLs."
        run.error_summary = "\n".join(errors[:20])
        run.save(update_fields=["status", "completed_at", "summary", "error_summary"])
        extraction_log(f"Document extraction completed for run {run.id}: {len(created_ids)} stored, {len(errors)} failed.")
        
        return Response({
            "import_record": {"id": str(run.id), "operation_type": "import", "entity_type": "documents", "status": run.status},
            "imported_count": len(created_ids),
            "entity_ids": created_ids,
            "message": f"Fetched and stored {len(created_ids)} real document excerpt{'s' if len(created_ids) != 1 else ''} in extraction run {run.id}.",
            "errors": errors
        }, status=status.HTTP_201_CREATED)

class SignalViewSet(viewsets.ModelViewSet):
    queryset = Signal.objects.all().order_by('-created_at')
    serializer_class = SignalSerializer

class TrendViewSet(viewsets.ModelViewSet):
    queryset = Trend.objects.all().order_by('-created_at')
    serializer_class = TrendSerializer

    @action(detail=True, methods=['get', 'post'])
    def evidence(self, request, pk=None):
        trend = self.get_object()
        if request.method == 'GET':
            qs = EvidenceLink.objects.filter(trend=trend)
            return Response(EvidenceLinkSerializer(qs, many=True).data)

        data = request.data.copy()
        data['trend'] = trend.id
        data['signal'] = data.get('signal_id')
        data['document'] = data.get('document_id')
        data['source'] = data.get('source_id')
        data['relationship_type'] = data.get('relationship_type', 'supports')
        serializer = EvidenceLinkSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='score-history')
    def score_history(self, request, pk=None):
        trend = self.get_object()
        snapshots = TrendScoreSnapshot.objects.filter(trend=trend).order_by('captured_at')
        changes = TrendScoreChange.objects.filter(trend=trend).order_by('changed_at')
        return Response({
            'snapshots': TrendScoreSnapshotSerializer(snapshots, many=True).data,
            'changes': TrendScoreChangeSerializer(changes, many=True).data
        })

class AgentActivityViewSet(viewsets.ModelViewSet):
    queryset = AgentActivity.objects.all()
    serializer_class = AgentActivitySerializer

class AgentDebateViewSet(viewsets.ModelViewSet):
    queryset = AgentDebate.objects.all()
    serializer_class = AgentDebateSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    def _process_arrays(self, data):
        import json
        for list_field in ['related_signal_ids', 'related_document_ids', 'related_source_ids']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
        if 'acknowledged' in data and isinstance(data['acknowledged'], bool):
            data['acknowledged'] = str(data['acknowledged']).lower()
        return data

    def create(self, request, *args, **kwargs):
        data = self._process_arrays(request.data.copy())
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._process_arrays(request.data.copy())
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class AssumptionViewSet(viewsets.ModelViewSet):
    queryset = Assumption.objects.all()
    serializer_class = AssumptionSerializer

class AuditEventViewSet(viewsets.ModelViewSet):
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer

class ChangeEventViewSet(viewsets.ModelViewSet):
    queryset = ChangeEvent.objects.all()
    serializer_class = ChangeEventSerializer

class DataExportViewSet(viewsets.ModelViewSet):
    queryset = DataExport.objects.all()
    serializer_class = DataExportSerializer

class DecisionBriefViewSet(viewsets.ModelViewSet):
    queryset = DecisionBrief.objects.all()
    serializer_class = DecisionBriefSerializer

    def create(self, request, *args, **kwargs):
        import json
        data = request.data.copy()
        for list_field in ['top_opportunities', 'top_threats', 'recommended_options', 'assumptions_to_test', 'indicators_to_monitor', 'evidence_ids']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
                
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class EmbeddingViewSet(viewsets.ModelViewSet):
    queryset = Embedding.objects.all()
    serializer_class = EmbeddingSerializer

class EvidenceLinkViewSet(viewsets.ModelViewSet):
    queryset = EvidenceLink.objects.all()
    serializer_class = EvidenceLinkSerializer

class HealthCheckViewSet(viewsets.ModelViewSet):
    queryset = HealthCheck.objects.all()
    serializer_class = HealthCheckSerializer

class KgEdgeViewSet(viewsets.ModelViewSet):
    queryset = KgEdge.objects.all()
    serializer_class = KgEdgeSerializer

class KgNodeViewSet(viewsets.ModelViewSet):
    queryset = KgNode.objects.all()
    serializer_class = KgNodeSerializer

class LeadingIndicatorViewSet(viewsets.ModelViewSet):
    queryset = LeadingIndicator.objects.all()
    serializer_class = LeadingIndicatorSerializer

class MonitoringRuleViewSet(viewsets.ModelViewSet):
    queryset = MonitoringRule.objects.all()
    serializer_class = MonitoringRuleSerializer

    def _process_data(self, data):
        import json
        if 'sourceId' in data:
            data['source'] = data.pop('sourceId')
        elif 'source_id' in data:
            data['source'] = data.pop('source_id')
        if 'enabled' in data:
            data['enabled'] = str(data['enabled']).lower()
        if 'industry_profile_id' not in data:
            data['industry_profile_id'] = 'default'
        
        # map camelCase to snake_case
        if 'includePatterns' in data:
            data['include_patterns'] = data.pop('includePatterns')
        if 'excludePatterns' in data:
            data['exclude_patterns'] = data.pop('excludePatterns')
            
        for list_field in ['keywords', 'include_patterns', 'exclude_patterns']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
        return data

    def create(self, request, *args, **kwargs):
        data = self._process_data(request.data.copy())
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._process_data(request.data.copy())
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        rule = self.get_object()
        
        # Create a mock MonitoringRun
        run_obj = MonitoringRun.objects.create(
            rule=rule,
            source=rule.source,
            status='completed',
            documents_scanned=10,
            new_documents_found=2,
            updated_documents_found=0,
            new_signals_found=3
        )
        
        # Create a mock WhatChangedSummary
        WhatChangedSummary.objects.create(
            monitoring_run=run_obj,
            headline="Found 3 new signals in latest scan",
            new_signals="[{\"id\": \"sig1\", \"title\": \"New signal found\"}]",
            changed_trends="[]",
            new_candidate_trends="[]",
            alerts="[]",
            recommended_actions="[\"Review candidate trend\"]"
        )
        
        return Response({'status': 'success'}, status=status.HTTP_200_OK)

class MonitoringRunViewSet(viewsets.ModelViewSet):
    queryset = MonitoringRun.objects.all()
    serializer_class = MonitoringRunSerializer

class PredictionOutcomeViewSet(viewsets.ModelViewSet):
    queryset = PredictionOutcome.objects.all()
    serializer_class = PredictionOutcomeSerializer

class PredictionUpdateViewSet(viewsets.ModelViewSet):
    queryset = PredictionUpdate.objects.all()
    serializer_class = PredictionUpdateSerializer

class PredictionViewSet(viewsets.ModelViewSet):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer

class RoadmapItemViewSet(viewsets.ModelViewSet):
    queryset = RoadmapItem.objects.all()
    serializer_class = RoadmapItemSerializer

class ScenarioViewSet(viewsets.ModelViewSet):
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer

    def create(self, request, *args, **kwargs):
        import json
        data = request.data.copy()
        for list_field in ['trigger_conditions', 'assumptions', 'implications', 'early_warning_indicators']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
                
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class SourceSnapshotViewSet(viewsets.ModelViewSet):
    queryset = SourceSnapshot.objects.all()
    serializer_class = SourceSnapshotSerializer

class StrategicContextViewSet(viewsets.ModelViewSet):
    queryset = StrategicContext.objects.all()
    serializer_class = StrategicContextSerializer

    def _process_data(self, data):
        mapping = {
            'industryProfileId': 'industry_profile_id',
            'companyName': 'company_name',
            'businessModel': 'business_model',
            'targetCustomers': 'target_customers',
            'strategicGoals': 'strategic_goals',
            'currentCapabilities': 'current_capabilities',
            'riskAppetite': 'risk_appetite',
            'planningHorizons': 'planning_horizons'
        }
        for camel, snake in mapping.items():
            if camel in data:
                data[snake] = data.pop(camel)
        return data

    def create(self, request, *args, **kwargs):
        import json
        data = self._process_data(request.data.copy())
        for list_field in ['target_customers', 'strategic_goals', 'current_capabilities', 'constraints', 'planning_horizons']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
                
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class StrategicImplicationViewSet(viewsets.ModelViewSet):
    queryset = StrategicImplication.objects.all()
    serializer_class = StrategicImplicationSerializer

class StrategicOptionViewSet(viewsets.ModelViewSet):
    queryset = StrategicOption.objects.all()
    serializer_class = StrategicOptionSerializer

    def create(self, request, *args, **kwargs):
        import json
        data = request.data.copy()
        for list_field in ['linked_trend_ids', 'linked_scenario_ids', 'linked_assumption_ids', 'expected_benefits', 'key_risks', 'required_capabilities']:
            if list_field in data and isinstance(data[list_field], list):
                data[list_field] = json.dumps(data[list_field])
                
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class TrendScoreChangeViewSet(viewsets.ModelViewSet):
    queryset = TrendScoreChange.objects.all()
    serializer_class = TrendScoreChangeSerializer

class TrendScoreSnapshotViewSet(viewsets.ModelViewSet):
    queryset = TrendScoreSnapshot.objects.all()
    serializer_class = TrendScoreSnapshotSerializer

class WhatChangedSummaryViewSet(viewsets.ModelViewSet):
    queryset = WhatChangedSummary.objects.all()
    serializer_class = WhatChangedSummarySerializer


@api_view(['POST'])
def agent_discovery(request, industry_id):
    industry = Industry.objects.filter(id=industry_id).first()
    if not industry:
        return Response({"detail": "Industry profile not found"}, status=status.HTTP_404_NOT_FOUND)
    created = []

    if not TrendTheme.objects.filter(industry=industry).exists():
        for payload in default_theme_payloads(industry):
            ensure_theme(industry, payload)

    approved_theme_names = [theme.name for theme in approved_themes(industry)]
    for name, url, source_type, _theme_names in source_candidates_for_industry(industry):
        src = source_for_url(url) or Source.objects.filter(name=name).first()
        note_theme_text = f" Approved themes: {', '.join(approved_theme_names)}." if approved_theme_names else " No approved themes yet; suggested from broad industry context."
        if not src:
            src = Source.objects.create(
                id=str(uuid.uuid4()),
                name=name,
                url=url,
                source_type=source_type or 'report',
                credibility_score=0.78,
                relevance_score=0.78,
                freshness_score=0.72,
                status='suggested',
                notes=f"Discovered for {industry.name}.{note_theme_text}",
                created_at=timezone.now(),
                updated_at=timezone.now(),
            )
        elif src.status != "approved":
            src.notes = f"{src.notes or ''}\nRediscovered for {industry.name}.{note_theme_text}".strip()
            src.updated_at = timezone.now()
            src.save(update_fields=["notes", "updated_at"])
        created.append(src)
        
    from .serializers import SourceSerializer
    return Response(SourceSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def agent_analyze(_request):
    industry = latest_industry()
    run_id = _request.data.get("run_id") or _request.data.get("runId")
    if run_id:
        source_run = ExtractionRun.objects.filter(id=run_id).first()
    else:
        source_run = latest_extraction_run("document_extraction")

    analysis_run = ExtractionRun.objects.create(
        id=str(uuid.uuid4()),
        industry=industry,
        stage="trend_analysis",
        status="running",
        started_at=timezone.now(),
        summary=f"Analyzing document extraction run {getattr(source_run, 'id', 'none')}.",
    )
    eligible_signals = []
    active_themes = approved_themes(industry)
    for signal in Signal.objects.select_related("document", "source").order_by("-created_at"):
        if source_run and signal.extraction_run_id != source_run.id:
            continue
        if source_run and signal.document and signal.document.extraction_run_id != source_run.id:
            continue
        if signal.source.status != "approved":
            continue
        if not signal.document or signal.document.status not in {"raw", "processed", "extracted"}:
            continue
        if "mock extracted content" in (signal.document.content or "").lower():
            continue
        text = f"{signal.title} {signal.summary} {signal.document.title} {signal.document.content[:1000]}"
        if not is_industry_relevant(text, industry):
            continue
        classified_signal = classify_existing_signal(signal)
        if not classified_signal:
            continue
        if active_themes and not any(signal_matches_theme(signal, theme) for theme in active_themes):
            key, meta = classified_signal
            propose_theme_from_signal(industry, key, meta, signal)
            continue
        eligible_signals.append(signal)

    clusters = {}
    for signal in eligible_signals:
        classified = classify_existing_signal(signal)
        if not classified:
            continue
        key, meta = classified
        clusters.setdefault(key, {"meta": meta, "signals": []})["signals"].append(signal)

    created_or_updated = []
    for key, cluster in clusters.items():
        qualified_signal_quotes = has_strategy_grade_evidence(key, cluster["meta"], cluster["signals"])
        if not qualified_signal_quotes:
            continue
        signals = [signal for signal, _quote in qualified_signal_quotes]
        payload = trend_payload_for_cluster(key, cluster["meta"], signals, source_run)
        trend, _created = Trend.objects.update_or_create(
            id=payload["id"],
            defaults=payload,
        )
        EvidenceLink.objects.filter(trend=trend).delete()
        for signal, quote in qualified_signal_quotes:
            EvidenceLink.objects.create(
                id=str(uuid.uuid4()),
                trend=trend,
                signal=signal,
                document=signal.document,
                source=signal.source,
                extraction_run=source_run,
                relationship_type="supports",
                quote=quote,
                relevance_reason=f"Cluster-specific evidence from '{signal.title}' supports the strategic thesis '{trend.name}' for {getattr(industry, 'name', 'the saved industry')}.",
                created_at=timezone.now(),
            )
        created_or_updated.append(trend)

    analysis_run.status = "completed"
    analysis_run.completed_at = timezone.now()
    analysis_run.summary = f"Created or updated {len(created_or_updated)} candidate trends from {len(eligible_signals)} eligible signals."
    analysis_run.save(update_fields=["status", "completed_at", "summary"])
    return Response(TrendSerializer(created_or_updated, many=True).data, status=status.HTTP_200_OK)
