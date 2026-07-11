from __future__ import annotations

import json
import time

from sqlalchemy.orm import Session

from app.models.core import (
    Document,
    EvidenceLink,
    HealthCheck,
    Signal,
    Source,
    Trend,
    TrendStatus,
)


def validate_data_health(db: Session) -> tuple[str, list[dict], list[HealthCheck]]:
    start = time.perf_counter()
    issues: list[dict] = []

    approved_trends = db.query(Trend).filter(Trend.status == TrendStatus.approved).all()
    for trend in approved_trends:
        evidence_count = db.query(EvidenceLink).filter(EvidenceLink.trend_id == trend.id).count()
        if evidence_count == 0:
            issues.append({
                "severity": "error",
                "entity_type": "trend",
                "entity_id": trend.id,
                "message": "Approved trend has no evidence links.",
            })

    for signal in db.query(Signal).all():
        if not db.query(Document).filter(Document.id == signal.document_id).first():
            issues.append({
                "severity": "error",
                "entity_type": "signal",
                "entity_id": signal.id,
                "message": "Signal references a missing document.",
            })
        if not db.query(Source).filter(Source.id == signal.source_id).first():
            issues.append({
                "severity": "error",
                "entity_type": "signal",
                "entity_id": signal.id,
                "message": "Signal references a missing source.",
            })

    for evidence in db.query(EvidenceLink).all():
        if not db.query(Trend).filter(Trend.id == evidence.trend_id).first():
            issues.append({
                "severity": "error",
                "entity_type": "evidence_link",
                "entity_id": evidence.id,
                "message": "Evidence link references a missing trend.",
            })
        if not db.query(Signal).filter(Signal.id == evidence.signal_id).first():
            issues.append({
                "severity": "error",
                "entity_type": "evidence_link",
                "entity_id": evidence.id,
                "message": "Evidence link references a missing signal.",
            })

    rejected_source_count = db.query(Source).filter(Source.status == "rejected").count()
    if rejected_source_count:
        issues.append({
            "severity": "warning",
            "entity_type": "source",
            "entity_id": None,
            "message": f"{rejected_source_count} rejected source(s) remain in the library.",
        })

    status = "healthy" if not any(issue["severity"] == "error" for issue in issues) else "degraded"
    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    check = HealthCheck(
        component="data_integrity",
        status=status,
        latency_ms=latency_ms,
        details=json.dumps({"issue_count": len(issues), "issues": issues}),
    )
    db.add(check)
    db.commit()
    db.refresh(check)

    latest = db.query(HealthCheck).order_by(HealthCheck.timestamp.desc()).limit(10).all()
    return status, issues, latest
