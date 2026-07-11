from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.repositories.core import IndustryRepository, SourceRepository, TrendRepository
from app.models.core import Document, Signal, Source, Trend, SourceStatus, DocumentStatus, AuditEvent
from app.schemas.core import SourceOut, SignalOut, TrendOut
from app.services import llm_service
from app.services.document_fetcher import fetch_document_text
import json
from app.logger import extraction_logger
import time

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/agents/discovery/{industry_id}", response_model=List[SourceOut])
def run_discovery_agent(industry_id: str, db: Session = Depends(get_db)):
    """
    Given an industry profile, uses the LLM to generate relevant sources.
    """
    repo = IndustryRepository(db)
    industry = repo.get(industry_id)
    if not industry:
        raise HTTPException(status_code=404, detail="Industry profile not found")
    
    # 1. Use LLM to discover sources
    extraction_logger.info(f"Starting discovery agent for industry {industry.name} ({industry_id})")
    start_time = time.time()
    new_sources = llm_service.discover_sources(industry)
    elapsed = time.time() - start_time
    extraction_logger.info(f"LLM discovered {len(new_sources)} sources in {elapsed:.2f}s")
    
    source_repo = SourceRepository(db)
    created_sources = []
    
    # 2. Save them to DB
    for src in new_sources:
        created = source_repo.create(**src.model_dump())
        created_sources.append(created)
        
    return created_sources

@router.post("/agents/extract/{document_id}", response_model=List[SignalOut])
def run_extraction_agent(document_id: str, db: Session = Depends(get_db)):
    """
    Given a document, fetches text (if needed) and extracts Signals using LLM.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status not in [DocumentStatus.processed, DocumentStatus.extracted]:
        raise HTTPException(status_code=400, detail="Document has not been processed and indexed into vector DB yet.")
    
    text = doc.content
    if not text:
        raise HTTPException(status_code=400, detail="Document has no content.")
            
    # LLM extraction
    extraction_logger.info(f"Starting signal extraction for document: {doc.title} ({document_id})")
    start_time = time.time()
    try:
        signals = llm_service.extract_signals(text, doc.id, doc.source_id)
    except Exception as e:
        doc.status = DocumentStatus.error
        db.commit()
        extraction_logger.error(f"LLM extraction failed for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {e}")
        
    elapsed = time.time() - start_time
    extraction_logger.info(f"Successfully extracted {len(signals)} signals from document {document_id} in {elapsed:.2f}s")
    created_signals = []
    
    # We will use title as the global key for deduplication across all documents
    existing_signals = db.query(Signal).all()
    existing_by_title = {s.title.lower(): s for s in existing_signals}
    
    for sig in signals:
        title_key = sig.title.lower()
        if title_key in existing_by_title:
            # Overwrite existing
            signal_db = existing_by_title[title_key]
            # Store old values for audit
            old_summary = signal_db.summary
            old_scores = {
                "novelty": signal_db.novelty_score,
                "strength": signal_db.strength_score,
                "confidence": signal_db.confidence_score
            }
            
            # Update fields
            update_data = sig.model_dump()
            for k, v in update_data.items():
                if hasattr(signal_db, k):
                    setattr(signal_db, k, v)
            
            # Log the change
            db.add(AuditEvent(
                action="signal_updated",
                entity_type="signals",
                entity_id=signal_db.id,
                user_id="system",
                details=json.dumps({
                    "previous_summary": old_summary,
                    "new_summary": signal_db.summary,
                    "previous_scores": old_scores,
                    "new_scores": {
                        "novelty": signal_db.novelty_score,
                        "strength": signal_db.strength_score,
                        "confidence": signal_db.confidence_score
                    }
                })
            ))
            
            created_signals.append(signal_db)
        else:
            # Create new
            signal_db = Signal(**sig.model_dump())
            db.add(signal_db)
            db.commit() # commit to generate ID
            db.refresh(signal_db)
            
            # Log creation
            db.add(AuditEvent(
                action="signal_created",
                entity_type="signals",
                entity_id=signal_db.id,
                user_id="system",
                details=json.dumps({"title": signal_db.title})
            ))
            created_signals.append(signal_db)
            existing_by_title[title_key] = signal_db
            
    doc.status = DocumentStatus.extracted
    db.commit()
    
    for s in created_signals:
        db.refresh(s)
    # The document model doesn't have extracted_signal_ids as a db column,
    # it's just a property added dynamically for the API sometimes, but here we can just ignore it or set it.
    doc.extracted_signal_ids = [s.id for s in created_signals]
    db.commit()
        
    return created_signals

@router.post("/agents/analyze", response_model=List[TrendOut])
def run_analysis_agent(db: Session = Depends(get_db)):
    """
    Reads recent signals and clusters them into Trends.
    """
    # Just grab latest 20 signals for context
    recent_signals = db.query(Signal).order_by(Signal.created_at.desc()).limit(20).all()
    if not recent_signals:
        raise HTTPException(status_code=400, detail="No signals available to analyze.")
        
    signal_dicts = [
        {"title": s.title, "summary": s.summary} for s in recent_signals
    ]
    
    new_trends = llm_service.generate_trends(signal_dicts)
    
    repo = TrendRepository(db)
    created_trends = []
    
    # Grab all existing trends to check for duplicates by name
    existing_trends = db.query(Trend).all()
    existing_by_name = {t.name.lower(): t for t in existing_trends}

    for trend in new_trends:
        trend_name = trend.name.lower()
        if trend_name in existing_by_name:
            # Update existing trend
            existing = existing_by_name[trend_name]
            
            # Merge related_signal_ids if applicable
            if hasattr(trend, 'related_signal_ids') and trend.related_signal_ids:
                existing_ids = set(json.loads(existing.related_signal_ids) if existing.related_signal_ids else [])
                new_ids = set(trend.related_signal_ids)
                merged_ids = list(existing_ids | new_ids)
                existing.related_signal_ids = json.dumps(merged_ids)
                db.commit()
            
            created_trends.append(existing)
        else:
            created = repo.create(**trend.model_dump())
            db.add(AuditEvent(
                action="trend_created",
                entity_type="trends",
                entity_id=created.id,
                user_id="system",
                details=json.dumps({"name": created.name})
            ))
            db.commit()
            created_trends.append(created)
            existing_by_name[trend_name] = created
            
    return created_trends
