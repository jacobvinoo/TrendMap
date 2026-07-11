import json
import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.core import Document, Embedding, Signal, Source, Trend
from app.schemas.core import (
    SemanticSearchRequest,
    SemanticSearchResponse,
    SemanticSearchResult,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/search/semantic", response_model=SemanticSearchResponse)
def semantic_search(request: SemanticSearchRequest, db: Session = Depends(get_db)):
    matches = _search_persisted_entities(db, request.query, request.entity_types, request.filters)
    return SemanticSearchResponse(
        results=[
            SemanticSearchResult(
                entity_type=match["entity_type"],
                entity_id=match["entity_id"],
                relevance_score=round(match["score"], 4),
                evidence_snippet=match["text"] or "",
                metadata=match["metadata"],
            )
            for match in matches[:request.limit]
        ]
    )


def _search_persisted_entities(db: Session, query: str, entity_types: list[str] | None, filters: dict | None) -> list[dict]:
    requested_types = set(entity_types or [])
    rows: list[dict] = []

    for embedding in db.query(Embedding).all():
        rows.append({
            "entity_type": embedding.entity_type,
            "entity_id": embedding.entity_id,
            "text": embedding.text_content or "",
            "metadata": _metadata(embedding.metadata_json),
        })

    if not requested_types or "document" in requested_types:
        for document in db.query(Document).all():
            rows.append({
                "entity_type": "document",
                "entity_id": document.id,
                "text": f"{document.title} {document.content or ''}",
                "metadata": {"title": document.title, "source_id": document.source_id, "url": document.url},
            })

    if not requested_types or "signal" in requested_types:
        for signal in db.query(Signal).all():
            rows.append({
                "entity_type": "signal",
                "entity_id": signal.id,
                "text": f"{signal.title} {signal.summary or ''}",
                "metadata": {"title": signal.title, "source_id": signal.source_id, "document_id": signal.document_id},
            })

    if not requested_types or "trend" in requested_types:
        for trend in db.query(Trend).all():
            rows.append({
                "entity_type": "trend",
                "entity_id": trend.id,
                "text": f"{trend.name} {trend.summary or ''}",
                "metadata": {"title": trend.name, "status": getattr(trend.status, "value", trend.status)},
            })

    if not requested_types or "source" in requested_types:
        for source in db.query(Source).all():
            rows.append({
                "entity_type": "source",
                "entity_id": source.id,
                "text": f"{source.name} {source.source_type or ''} {source.notes or ''}",
                "metadata": {
                    "title": source.name,
                    "geography": getattr(source, "geography", None),
                    "status": getattr(source.status, "value", source.status),
                },
            })

    deduped: dict[tuple[str, str], dict] = {}
    for row in rows:
        if requested_types and row["entity_type"] not in requested_types:
            continue
        if filters and not _matches_filters(row["metadata"], filters):
            continue
        score = _score(query, row["text"])
        if score <= 0:
            continue
        key = (row["entity_type"], row["entity_id"])
        existing = deduped.get(key)
        candidate = {**row, "score": score}
        if not existing or candidate["score"] > existing["score"]:
            deduped[key] = candidate

    return sorted(deduped.values(), key=lambda item: item["score"], reverse=True)


def _matches_filters(metadata: dict, filters: dict) -> bool:
    return all(metadata.get(key) == value for key, value in filters.items())


def _score(query: str, text: str) -> float:
    query_terms = {term for term in re.findall(r"[a-z0-9]+", query.lower()) if len(term) > 1}
    if not query_terms:
        return 0.0
    text_lower = text.lower()
    text_terms = set(re.findall(r"[a-z0-9]+", text_lower))
    exact_bonus = 0.25 if query.lower() in text_lower else 0.0
    overlap = len(query_terms & text_terms) / len(query_terms)
    return min(1.0, overlap + exact_bonus)


def _metadata(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}
