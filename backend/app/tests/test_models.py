import pytest
from sqlalchemy.exc import IntegrityError
from app.db.database import SessionLocal
from app.models.core import (
    Industry, Source, Document, Signal, Trend, EvidenceLink,
    KGNode, KGEdge, AuditEvent, Embedding, DataExport, HealthCheck
)

@pytest.fixture(scope="module")
def db_session():
    # In a real setup, we'd use a test DB. Here we use the SQLite dev DB
    # and rollback transactions
    from app.db.database import engine
    from app.db.base_class import Base
    import app.models.core
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_create_industry(db_session):
    ind = Industry(name="Test Industry", geography="Global", description="A test")
    db_session.add(ind)
    db_session.commit()
    assert ind.id is not None

def test_source_requires_fields(db_session):
    # Should fail if missing required fields like name
    src = Source(url="http://example.com")
    db_session.add(src)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_create_full_hierarchy(db_session):
    src = Source(name="Test Source", url="http://example.com", status="approved", credibility_score=0.8, relevance_score=0.9, freshness_score=0.9)
    db_session.add(src)
    db_session.commit()
    
    doc = Document(source_id=src.id, title="Test Doc", url="http://example.com/doc", content="Text", status="processed")
    db_session.add(doc)
    db_session.commit()

    sig = Signal(document_id=doc.id, source_id=src.id, title="Signal", summary="Sum", novelty_score=0.5, strength_score=0.5, confidence_score=0.5)
    db_session.add(sig)
    db_session.commit()

    trend = Trend(name="Trend", summary="Sum", status="candidate", horizon="12_months", likelihood_score=0.5, confidence_score=0.5, impact_score=0.5, maturity_stage="emerging")
    db_session.add(trend)
    db_session.commit()

    ev = EvidenceLink(trend_id=trend.id, signal_id=sig.id, document_id=doc.id, source_id=src.id, relationship_type="supports")
    db_session.add(ev)
    db_session.commit()

    assert ev.id is not None
    assert trend.id is not None
    assert sig.document.id == doc.id

def test_phase5_models(db_session):
    # Knowledge Graph
    kn_src = KGNode(label="Entity A", node_type="entity", properties='{"type": "company"}')
    kn_tgt = KGNode(label="Entity B", node_type="entity", properties='{"type": "product"}')
    db_session.add_all([kn_src, kn_tgt])
    db_session.commit()
    
    ke = KGEdge(source_id=kn_src.entity_id, target_id=kn_tgt.entity_id, relationship_type="produces")
    db_session.add(ke)
    
    # Audit Event
    ae = AuditEvent(user_id="user123", action="update", entity_type="trend", entity_id="t123", details='{"changed": "status"}')
    db_session.add(ae)
    
    # Embedding
    emb = Embedding(entity_type="document", entity_id="doc123", model_name="test-model", vector_data="[0.1, 0.2, 0.3]")
    db_session.add(emb)
    
    # Data Export
    de = DataExport(operation_type="export", entity_type="trend", status="pending", file_url="/exports/1.csv")
    db_session.add(de)
    
    # Health Check
    hc = HealthCheck(component="database", status="healthy", latency_ms=15.5, details='{"connections": 10}')
    db_session.add(hc)
    
    db_session.commit()
    
    assert kn_src.entity_id is not None
    assert ke.id is not None
    assert ae.id is not None
    assert emb.id is not None
    assert de.id is not None
    assert hc.id is not None

def test_source_cascade_delete(db_session):
    src = Source(name="Test Cascade Source", url="http://example.com")
    db_session.add(src)
    db_session.commit()
    
    doc = Document(source_id=src.id, title="Test Cascade Doc", content="Content")
    db_session.add(doc)
    db_session.commit()
    
    # Try deleting the source, it should not throw an IntegrityError
    # and should also delete the document.
    db_session.delete(src)
    db_session.commit()
    
    # Verify the document is gone
    doc_after = db_session.query(Document).filter_by(id=doc.id).first()
    assert doc_after is None
