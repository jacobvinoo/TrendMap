import pytest
from app.repositories.core import IndustryRepository, SourceRepository, TrendRepository
from app.db.database import SessionLocal
from app.models.core import AuditEvent, Industry, Source, Trend
from app.schemas.core import SourceUpdate

@pytest.fixture(scope="module")
def db():
    # Setup test DB (using SQLite for now)
    from app.db.database import engine
    from app.db.base_class import Base
    import app.models.core
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_industry_repository(db):
    repo = IndustryRepository(db)
    
    # Create
    ind = repo.create(name="Tech", geography="US", description="Tech Industry")
    assert ind.id is not None
    assert ind.name == "Tech"
    
    # Get all
    all_inds = repo.get_all()
    assert len(all_inds) > 0
    
    # Get one
    found = repo.get(ind.id)
    assert found.name == "Tech"

def test_source_repository(db):
    repo = SourceRepository(db)
    
    # Create
    src = repo.create(name="TechNews", url="http://technews.com", source_type="news")
    assert src.status == "suggested"
    
    # Update status
    updated = repo.update(src.id, status="approved")
    assert updated.status.value == "approved"
    
    # Get approved only
    approved_sources = repo.get_by_status("approved")
    assert any(s.id == src.id for s in approved_sources)

def test_trend_repository(db):
    repo = TrendRepository(db)
    
    trend = repo.create(name="AI Search", summary="AI is changing search", status="candidate")
    assert trend.id is not None
    
    updated = repo.update(trend.id, likelihood_score=0.9, confidence_score=0.8)
    assert updated.likelihood_score == 0.9
    assert updated.confidence_score == 0.8

def test_crud_base_instantiation(db):
    from app.repositories.core import DocumentRepository, AssumptionRepository, AgentActivityRepository
    
    doc_repo = DocumentRepository(db)
    assert doc_repo.model.__name__ == "Document"
    
    ass_repo = AssumptionRepository(db)
    assert ass_repo.model.__name__ == "Assumption"
    
    act_repo = AgentActivityRepository(db)
    assert act_repo.model.__name__ == "AgentActivity"


def test_delete_requires_audit_safe_path(db):
    repo = SourceRepository(db)
    src = repo.create(name="Delete Guard", url="http://delete-guard.test", source_type="news")

    with pytest.raises(NotImplementedError):
        repo.delete(src.id)

    assert repo.get(src.id) is not None


def test_audited_delete_records_audit_event(db):
    repo = SourceRepository(db)
    src = repo.create(name="Audited Delete", url="http://audited-delete.test", source_type="news")

    deleted = repo.audited_delete(src.id, actor="test-user", reason="cleanup")

    assert deleted is True
    assert repo.get(src.id) is None
    event = db.query(AuditEvent).filter(
        AuditEvent.action == "delete",
        AuditEvent.entity_type == "sources",
        AuditEvent.entity_id == src.id,
    ).first()
    assert event is not None
    assert event.user_id == "test-user"
