from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.core import (
    DataExport,
    Document,
    EvidenceLink,
    Industry,
    Signal,
    Source,
    Trend,
)


def _record_operation(
    db: Session,
    operation_type: str,
    entity_type: str,
    status: str = "completed",
    error_message: str | None = None,
) -> DataExport:
    record = DataExport(
        operation_type=operation_type,
        entity_type=entity_type,
        status=status,
        file_url=f"memory://{operation_type}/{entity_type}",
        error_message=error_message,
        completed_at=datetime.utcnow() if status == "completed" else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def export_trend(db: Session, trend_id: str) -> tuple[DataExport, dict[str, Any] | None]:
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        return _record_operation(db, "export", "trend", status="failed", error_message="Trend not found"), None

    evidence = db.query(EvidenceLink).filter(EvidenceLink.trend_id == trend_id).all()
    signals = db.query(Signal).filter(Signal.id.in_([item.signal_id for item in evidence])).all() if evidence else []
    documents = db.query(Document).filter(Document.id.in_([item.document_id for item in evidence if item.document_id])).all() if evidence else []
    sources = db.query(Source).filter(Source.id.in_([item.source_id for item in evidence if item.source_id])).all() if evidence else []

    payload = {
        "trend": _model_dict(trend),
        "evidence_links": [_model_dict(item) for item in evidence],
        "signals": [_model_dict(item) for item in signals],
        "documents": [_model_dict(item) for item in documents],
        "sources": [_model_dict(item) for item in sources],
    }
    return _record_operation(db, "export", "trend"), payload


def export_industry(db: Session, industry_id: str) -> tuple[DataExport, dict[str, Any] | None]:
    industry = db.query(Industry).filter(Industry.id == industry_id).first()
    if not industry:
        return _record_operation(db, "export", "industry", status="failed", error_message="Industry not found"), None

    payload = {
        "industry": _model_dict(industry),
        "sources": [_model_dict(source) for source in db.query(Source).all()],
        "trends": [_model_dict(trend) for trend in db.query(Trend).all()],
    }
    return _record_operation(db, "export", "industry"), payload


def record_import(db: Session, entity_type: str, imported_count: int) -> DataExport:
    status = "completed" if imported_count >= 0 else "failed"
    return _record_operation(db, "import", entity_type, status=status)


def _model_dict(model: Any) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for column in model.__table__.columns:
        value = getattr(model, column.name)
        if isinstance(value, datetime):
            value = value.isoformat()
        elif hasattr(value, "value"):
            value = value.value
        data[column.name] = value
    return data
