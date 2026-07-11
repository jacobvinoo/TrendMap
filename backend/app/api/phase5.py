import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.core import AuditEvent, Document, Source, Embedding
from app.schemas.core import (
    DataExportOut,
    DataExportResponse,
    DataHealthSummary,
    DataImportResponse,
    DocumentImportRequest,
    ForecastCalibrationResponse,
    KnowledgeGraphBuildResponse,
    KnowledgeGraphNeighborhood,
    SourceReliabilityResponse,
    SourceImportRequest,
)
from app.services.data_exchange import export_industry, export_trend, record_import
from app.services.data_health import validate_data_health
from app.services.document_fetcher import fetch_document_text
from app.logger import extraction_logger
import time
from app.services.forecast_calibration import calibrate_trend_forecast
from app.services.knowledge_graph import build_knowledge_graph_for_trend, get_graph_neighborhood
from app.services.reliability import calculate_source_reliability
from app.services.chunker import chunk_text
from app.services.vector_store import get_vector_store

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _write_audit(db: Session, action: str, entity_type: str, entity_id: str, details: dict | None = None) -> None:
    db.add(AuditEvent(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user_id="system",
        details=json.dumps(details or {}),
    ))
    db.commit()


@router.get("/export/trend/{trend_id}", response_model=DataExportResponse)
def export_trend_data(trend_id: str, db: Session = Depends(get_db)):
    export_record, payload = export_trend(db, trend_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Trend not found")
    _write_audit(db, "trend_exported", "trends", trend_id, {"export_id": export_record.id})
    return {"export": export_record, "payload": payload}


@router.get("/export/industry/{industry_id}", response_model=DataExportResponse)
def export_industry_data(industry_id: str, db: Session = Depends(get_db)):
    export_record, payload = export_industry(db, industry_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Industry not found")
    _write_audit(db, "industry_exported", "industries", industry_id, {"export_id": export_record.id})
    return {"export": export_record, "payload": payload}


@router.post("/import/sources", response_model=DataImportResponse)
def import_sources(request: SourceImportRequest, db: Session = Depends(get_db)):
    created_ids: List[str] = []
    extraction_logger.info(f"Starting import_sources for {len(request.sources)} sources.")
    for item in request.sources:
        data = item.model_dump(exclude_none=True)
        source = Source(**data)
        db.add(source)
        db.commit()
        db.refresh(source)
        created_ids.append(source.id)
        extraction_logger.info(f"Imported source: {source.name} ({source.id})")

    import_record = record_import(db, "sources", len(created_ids))
    _write_audit(db, "sources_imported", "sources", import_record.id, {"entity_ids": created_ids})
    return {"import_record": import_record, "imported_count": len(created_ids), "entity_ids": created_ids}


@router.post("/import/documents", response_model=DataImportResponse)
def import_documents(request: DocumentImportRequest, db: Session = Depends(get_db)):
    created_ids: List[str] = []
    extraction_logger.info(f"Starting import_documents for {len(request.documents)} documents.")
    for item in request.documents:
        if not db.query(Source).filter(Source.id == item.source_id).first():
            raise HTTPException(status_code=400, detail=f"Source {item.source_id} not found")
        document = Document(**item.model_dump(exclude_none=True))
        db.add(document)
        db.commit()
        db.refresh(document)
        created_ids.append(document.id)
        extraction_logger.info(f"Imported document: {document.title} ({document.id})")

    import_record = record_import(db, "documents", len(created_ids))
    _write_audit(db, "documents_imported", "documents", import_record.id, {"entity_ids": created_ids})
    return {"import_record": import_record, "imported_count": len(created_ids), "entity_ids": created_ids}


@router.post("/documents/extract-from-sources", response_model=DataImportResponse)
def extract_documents_from_sources(db: Session = Depends(get_db)):
    approved_sources = db.query(Source).filter(Source.status == "approved").all()
    created_ids: List[str] = []
    errors: List[str] = []
    extraction_logger.info(f"Starting extract_documents_from_sources. Found {len(approved_sources)} approved sources.")

    for i, source in enumerate(approved_sources, 1):
        extraction_logger.info(f"Processing source {i}/{len(approved_sources)}: {source.name} ({source.url})")
        start_time = time.time()
        
        if not source.url:
            err = f"{source.name}: no source URL stored"
            errors.append(err)
            extraction_logger.error(err)
            continue
        try:
            content = fetch_document_text(source.url)
        except RuntimeError as exc:
            err = str(exc)
            errors.append(err)
            extraction_logger.error(f"Failed to fetch {source.name}: {err}")
            continue

        title = f"{source.name} source capture"
        existing = db.query(Document).filter(Document.source_id == source.id, Document.url == source.url).first()
        if existing:
            existing.title = title
            existing.content = content
            existing.status = "processed"
            document = existing
        else:
            document = Document(
                source_id=source.id,
                title=title,
                url=source.url,
                content=content,
                status="processed",
            )
            db.add(document)
        db.commit()
        db.refresh(document)
        
        # Metadata for vector store and embedding
        metadata = {
            "retrieval_date": datetime.utcnow().isoformat(),
            "source_url": source.url,
            "content_length": len(content)
        }
        
        # Save to Embedding table
        embedding_record = db.query(Embedding).filter(
            Embedding.entity_type == "document",
            Embedding.entity_id == document.id
        ).first()
        
        if embedding_record:
            embedding_record.text_content = content
            embedding_record.metadata_json = json.dumps(metadata)
        else:
            embedding_record = Embedding(
                entity_type="document",
                entity_id=document.id,
                model_name="chromadb",
                text_content=content,
                vector_data="[]",
                metadata_json=json.dumps(metadata)
            )
            db.add(embedding_record)
        db.commit()
        
        # Save to ChromaDB vector store
        chunks = chunk_text(content)
        try:
            get_vector_store().add_document_chunks(document.id, chunks, additional_metadata=metadata)
        except Exception as e:
            err_msg = f"Vector indexing failed for document {document.id}: {e}"
            errors.append(err_msg)
            extraction_logger.error(err_msg)

        created_ids.append(document.id)
        elapsed = time.time() - start_time
        extraction_logger.info(f"Successfully extracted document from {source.name} in {elapsed:.2f}s")

    import_record = record_import(db, "documents", len(created_ids))
    _write_audit(
        db,
        "documents_extracted_from_sources",
        "documents",
        import_record.id,
        {"entity_ids": created_ids, "errors": errors},
    )
    if created_ids:
        message = f"Fetched and stored {len(created_ids)} document record{'s' if len(created_ids) != 1 else ''} from approved source URLs."
    else:
        message = "No documents were fetched. Check that approved sources use reachable article/feed URLs."
    return {
        "import_record": import_record,
        "imported_count": len(created_ids),
        "entity_ids": created_ids,
        "message": message,
        "errors": errors,
    }


@router.get("/data-exports", response_model=List[DataExportOut])
def get_data_exports(db: Session = Depends(get_db)):
    from app.models.core import DataExport

    return db.query(DataExport).order_by(DataExport.created_at.desc()).all()


@router.post("/admin/data-health", response_model=DataHealthSummary)
def run_data_health_check(db: Session = Depends(get_db)):
    status, issues, latest = validate_data_health(db)
    return {
        "status": status,
        "checks_run": 1,
        "issue_count": len(issues),
        "issues": issues,
        "latest_checks": latest,
    }


@router.post("/knowledge/trends/{trend_id}/build", response_model=KnowledgeGraphBuildResponse)
def build_trend_knowledge_graph(trend_id: str, db: Session = Depends(get_db)):
    result = build_knowledge_graph_for_trend(db, trend_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Trend not found")
    _write_audit(db, "knowledge_graph_built", "trends", trend_id, result)
    return result


@router.get("/knowledge/neighborhood/{entity_id}", response_model=KnowledgeGraphNeighborhood)
def get_knowledge_neighborhood(entity_id: str, depth: int = 1, db: Session = Depends(get_db)):
    result = get_graph_neighborhood(db, entity_id, depth)
    if result is None:
        raise HTTPException(status_code=404, detail="Knowledge graph node not found")
    return result


@router.post("/sources/{source_id}/reliability", response_model=SourceReliabilityResponse)
def recalculate_source_reliability(source_id: str, db: Session = Depends(get_db)):
    result = calculate_source_reliability(db, source_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Source not found")
    _write_audit(db, "source_reliability_calculated", "sources", source_id, result)
    return result


@router.post("/agent/predictions/calibration", response_model=ForecastCalibrationResponse)
def calibrate_all_predictions(db: Session = Depends(get_db)):
    return calibrate_trend_forecast(db)


@router.post("/agent/predictions/{prediction_id}/calibration", response_model=ForecastCalibrationResponse)
def calibrate_prediction(prediction_id: str, db: Session = Depends(get_db)):
    result = calibrate_trend_forecast(db, prediction_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Resolved prediction outcome not found")
    _write_audit(db, "prediction_calibrated", "predictions", prediction_id, result)
    return result

from fastapi.responses import StreamingResponse
import time

@router.get("/logs/extraction/stream")
def stream_extraction_logs():
    from pathlib import Path
    import time
    
    # Path to backend/extraction.log
    log_path = Path(__file__).parent.parent.parent / "extraction.log"

    def log_generator():
        # Wait for file to be created if it doesn't exist yet
        while not log_path.exists():
            yield "data: Waiting for logs...\n\n"
            time.sleep(1)
            
        with open(log_path, "r", encoding="utf-8") as f:
            # Tailing logic
            lines = f.readlines()
            for line in lines[-50:]:
                if line.strip():
                    yield f"data: {line.strip()}\n\n"
            
            # Now stream new lines
            while True:
                line = f.readline()
                if not line:
                    time.sleep(0.5)
                    f.seek(f.tell()) # Clear EOF flag to see new lines
                    continue
                if line.strip():
                    yield f"data: {line.strip()}\n\n"

    return StreamingResponse(log_generator(), media_type="text/event-stream")
