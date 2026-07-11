from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.schemas.core import (
    IndustryCreate, IndustryOut, 
    SourceCreate, SourceOut, SourceUpdate,
    DocumentCreate, DocumentOut, DocumentUpdate,
    SignalCreate, SignalOut,
    TrendCreate, TrendOut, TrendUpdate, EvidenceLinkCreate, EvidenceLinkOut,
    InsightSummaryOut, AuditEventOut
)
from app.repositories.core import IndustryRepository, SourceRepository, TrendRepository
from app.models.core import Document, Signal, EvidenceLink, Trend, AuditEvent, DocumentStatus
import json
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _write_audit(db, action: str, entity_type: str, entity_id: str, details: dict | None = None) -> None:
    """Create an immutable AuditEvent row in the same session."""
    db.add(AuditEvent(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user_id="system",
        details=json.dumps(details or {})
    ))
    db.commit()

@router.post("/industries", response_model=IndustryOut)
def create_industry(industry: IndustryCreate, db: Session = Depends(get_db)):
    repo = IndustryRepository(db)
    if industry.id:
        existing = repo.get(industry.id)
        if existing:
            return repo.update(industry.id, **industry.model_dump(exclude_unset=True, exclude={"id"}))
    return repo.create(**industry.model_dump())

@router.get("/industries", response_model=List[IndustryOut])
def get_industries(db: Session = Depends(get_db)):
    from app.models.core import Industry
    return db.query(Industry).order_by(Industry.updated_at.desc(), Industry.created_at.desc()).all()

@router.get("/sources", response_model=List[SourceOut])
def get_sources(db: Session = Depends(get_db)):
    repo = SourceRepository(db)
    return repo.get_all()

@router.post("/sources", response_model=SourceOut)
def create_source(source: SourceCreate, db: Session = Depends(get_db)):
    repo = SourceRepository(db)
    return repo.create(**source.model_dump())

@router.patch("/sources/{source_id}", response_model=SourceOut)
def update_source(source_id: str, update: SourceUpdate, db: Session = Depends(get_db)):
    repo = SourceRepository(db)
    previous_source = repo.get(source_id)
    previous_status = getattr(previous_source, "status", None)
    source = repo.update(source_id, **update.model_dump(exclude_unset=True))
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    # Audit approval/rejection
    patch_data = update.model_dump(exclude_unset=True)
    if "status" in patch_data:
        _write_audit(db, f"source_{patch_data['status']}", "sources", source_id,
                     {
                         "previous_value": getattr(previous_status, "value", previous_status),
                         "new_value": patch_data["status"]
                     })
    return source

@router.get("/documents", response_model=List[DocumentOut])
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    for document in documents:
        document.extracted_signal_ids = [signal.id for signal in document.signals]
    return documents

from fastapi import BackgroundTasks
from app.services.chunker import chunk_text
from app.services.document_fetcher import fetch_document_text
from app.services.vector_store import get_vector_store

def process_new_document(document_id: str, url: str, db: Session):
    try:
        text = fetch_document_text(url)
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.content = text
            db.commit()
            
            chunks = chunk_text(text)
            get_vector_store().add_document_chunks(document_id, chunks)
            
            doc.status = DocumentStatus.processed
            db.commit()
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = DocumentStatus.error
            db.commit()

@router.post("/documents", response_model=DocumentOut)
def create_document(doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = Document(**doc.model_dump())
    if document.url:
        document.status = DocumentStatus.raw
    db.add(document)
    db.commit()
    db.refresh(document)
    
    if document.url:
        background_tasks.add_task(process_new_document, document.id, document.url, db)
        
    document.extracted_signal_ids = []
    return document

@router.patch("/documents/{document_id}", response_model=DocumentOut)
def update_document(document_id: str, update: DocumentUpdate, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = update.model_dump(exclude_unset=True)
    previous_status = document.status
    if "status" in update_data:
        document.status = update_data["status"]
    
    db.commit()
    db.refresh(document)
    # Audit ingestion status changes
    if "status" in update_data:
        _write_audit(db, f"document_status_{update_data['status']}", "documents", document_id,
                     {
                         "previous_value": getattr(previous_status, "value", previous_status),
                         "new_value": update_data["status"]
                     })
    if "extracted_signals" in update_data:
        _write_audit(db, "document_extracted_signals_updated", "documents", document_id,
                     {"signal_ids": update_data["extracted_signals"] or []})
    document.extracted_signal_ids = [signal.id for signal in document.signals]
    return document

@router.post("/signals/extract", response_model=SignalOut)
def extract_signal(signal: SignalCreate, db: Session = Depends(get_db)):
    sig = Signal(**signal.model_dump())
    db.add(sig)
    db.commit()
    db.refresh(sig)
    return sig

@router.get("/signals", response_model=List[SignalOut])
def get_signals(db: Session = Depends(get_db)):
    return db.query(Signal).all()

@router.get("/signals/{signal_id}/history", response_model=List[AuditEventOut])
def get_signal_history(signal_id: str, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).filter(
        AuditEvent.entity_type == "signals",
        AuditEvent.entity_id == signal_id
    ).order_by(AuditEvent.created_at.desc()).all()
    return events

@router.get("/trends/{trend_id}/history", response_model=List[AuditEventOut])
def get_trend_history(trend_id: str, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).filter(
        AuditEvent.entity_type == "trends",
        AuditEvent.entity_id == trend_id
    ).order_by(AuditEvent.created_at.desc()).all()
    return events

@router.post("/trends/cluster", response_model=TrendOut)
def cluster_trend(trend: TrendCreate, db: Session = Depends(get_db)):
    repo = TrendRepository(db)
    return repo.create(**trend.model_dump())

@router.get("/trends", response_model=List[TrendOut])
def get_trends(db: Session = Depends(get_db)):
    repo = TrendRepository(db)
    return repo.get_all()

@router.get("/trends/{trend_id}", response_model=TrendOut)
def get_trend(trend_id: str, db: Session = Depends(get_db)):
    repo = TrendRepository(db)
    trend = db.query(Trend).filter(Trend.id == trend_id).first() # TODO add to repo
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    return trend

@router.patch("/trends/{trend_id}", response_model=TrendOut)
def update_trend(trend_id: str, update: TrendUpdate, db: Session = Depends(get_db)):
    repo = TrendRepository(db)
    previous_trend = repo.get(trend_id)
    previous_status = getattr(previous_trend, "status", None)
    trend = repo.update(trend_id, **update.model_dump(exclude_unset=True))
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    # Audit approval, rejection, and other status transitions
    patch_data = update.model_dump(exclude_unset=True)
    
    # Store old values to show what changed
    details = {}
    if "status" in patch_data:
        details["previous_value"] = getattr(previous_status, "value", previous_status)
        details["new_value"] = patch_data["status"]
        
    for key in patch_data:
        if key != "status":
            details[f"previous_{key}"] = getattr(previous_trend, key, None)
            details[f"new_{key}"] = patch_data[key]

    if details:
        action = f"trend_{patch_data['status']}" if "status" in patch_data else "trend_updated"
        _write_audit(db, action, "trends", trend_id, details)
        
    return trend

@router.get("/trends/{trend_id}/evidence", response_model=List[EvidenceLinkOut])
def get_trend_evidence(trend_id: str, db: Session = Depends(get_db)):
    return db.query(EvidenceLink).filter(EvidenceLink.trend_id == trend_id).all()

@router.post("/trends/{trend_id}/evidence", response_model=EvidenceLinkOut)
def create_trend_evidence(trend_id: str, evidence: EvidenceLinkCreate, db: Session = Depends(get_db)):
    ev = EvidenceLink(**evidence.model_dump())
    ev.trend_id = trend_id
    db.add(ev)
    db.commit()
    db.refresh(ev)
    _write_audit(db, "evidence_linked", "evidence_links", ev.id,
                 {"trend_id": trend_id, "signal_id": ev.signal_id, "relationship": ev.relationship_type})
    return ev

@router.delete("/sources/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db)):
    repo = SourceRepository(db)
    existing = repo.get(source_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Source not found")
    repo.audited_delete(source_id, actor="UI", reason="User requested deletion")
    return {"success": True}

@router.get("/insights/summary", response_model=InsightSummaryOut)
def get_insights_summary(db: Session = Depends(get_db)):
    repo = TrendRepository(db)
    all_trends = repo.get_all()
    
    # Filter only approved trends
    approved_trends = [t for t in all_trends if getattr(t.status, "value", t.status) == "approved"]

    # deterministic ID
    trend_ids = "-".join(sorted([str(t.id) for t in approved_trends]))
    summary_id = f"summary-default-{trend_ids or 'empty'}"
    
    # Sort by impact_score desc then name
    sorted_by_impact = sorted(
        approved_trends, 
        key=lambda t: (-(t.impact_score or 0.0), t.name)
    )
    
    key_trends = sorted_by_impact[:2]
    watch_items = [t for t in approved_trends if (t.impact_score or 0.0) >= 0.7 and (t.confidence_score or 0.0) < 0.7]
    emerging_risks = [t for t in approved_trends if t.blockers and len(t.blockers) > 0]
    opportunities = [t for t in approved_trends if t.recommended_actions and len(t.recommended_actions) > 0]
    
    return InsightSummaryOut(
        id=summary_id,
        industry_profile_id="default",
        generated_at=datetime.utcnow().isoformat() + "Z",
        ai_summary="",
        key_trends=key_trends,
        watch_items=watch_items,
        emerging_risks=emerging_risks,
        opportunities=opportunities
    )
