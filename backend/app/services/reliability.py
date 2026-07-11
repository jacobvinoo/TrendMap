from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.core import Document, EvidenceLink, Source


def calculate_source_reliability(db: Session, source_id: str) -> dict | None:
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        return None

    document_count = db.query(Document).filter(Document.source_id == source_id).count()
    evidence_count = db.query(EvidenceLink).filter(EvidenceLink.source_id == source_id).count()
    rationale: list[str] = []

    base_score = (
        (source.credibility_score or 0.0) * 0.45
        + (source.relevance_score or 0.0) * 0.35
        + (source.freshness_score or 0.0) * 0.20
    )
    rationale.append("Weighted credibility, relevance, and freshness scores.")

    coverage_bonus = min(0.10, document_count * 0.02 + evidence_count * 0.03)
    if coverage_bonus:
        rationale.append("Added coverage bonus for documents and evidence links.")

    status_penalty = 0.0
    status = source.status.value if hasattr(source.status, "value") else source.status
    if status == "rejected":
        status_penalty = 0.25
        rationale.append("Applied rejected-source penalty.")
    elif status == "suggested":
        status_penalty = 0.05
        rationale.append("Applied suggested-source review penalty.")

    reliability_score = max(0.0, min(1.0, round(base_score + coverage_bonus - status_penalty, 3)))
    source.credibility_score = reliability_score
    db.commit()
    db.refresh(source)

    return {
        "source_id": source_id,
        "reliability_score": reliability_score,
        "credibility_score": source.credibility_score or 0.0,
        "relevance_score": source.relevance_score or 0.0,
        "freshness_score": source.freshness_score or 0.0,
        "evidence_count": evidence_count,
        "document_count": document_count,
        "rationale": rationale,
    }
