import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.core import Industry
from app.db.database import SessionLocal
from unittest.mock import patch
from app.schemas.core import SourceCreate

client = TestClient(app)


@pytest.fixture
def mock_industry(db_session):
    # Setup a mock industry
    ind = db_session.query(Industry).filter_by(id="ind-test-2").first()
    if not ind:
        ind = Industry(id="ind-test-2", name="AI Tech")
        db_session.add(ind)
        db_session.commit()
    return ind

def test_run_discovery_agent(mock_industry):
    # We will mock the llm_service.discover_sources to not actually hit OpenAI
    with patch("app.api.api_agents.llm_service.discover_sources") as mock_discover:
        mock_discover.return_value = [
            SourceCreate(
                name="AI Magazine",
                url="https://ai.mag.com",
                source_type="report",
                credibility_score=0.9
            )
        ]
        
        response = client.post(f"/api/agents/discovery/{mock_industry.id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
        
        sources = response.json()
        assert len(sources) > 0
        assert sources[-1]["name"] == "AI Magazine"
        assert sources[-1]["url"] == "https://ai.mag.com"
        assert sources[-1]["source_type"] == "report"

from app.models.core import Document, Source, DocumentStatus
from app.schemas.core import SignalCreate

@pytest.fixture
def mock_document(db_session):
    src = Source(id="src-test", name="Test Src", url="http://test.com", status="approved")
    doc = Document(id="doc-test-1", source_id="src-test", title="Title", content="Content", status=DocumentStatus.processed)
    db_session.add(src)
    db_session.add(doc)
    db_session.commit()
    return doc

def test_run_extraction_agent_success(mock_document, db_session):
    with patch("app.api.api_agents.llm_service.extract_signals") as mock_extract:
        mock_extract.return_value = [
            SignalCreate(
                title="Test Signal",
                summary="Summary",
                signal_type="technology",
                pestle_category="technological",
                novelty_score=0.8,
                strength_score=0.8,
                confidence_score=0.9,
                document_id=mock_document.id,
                source_id=mock_document.source_id
            )
        ]
        
        response = client.post(f"/api/agents/extract/{mock_document.id}")
        assert response.status_code == 200, response.text
        
        signals = response.json()
        assert len(signals) == 1
        assert signals[0]["title"] == "Test Signal"
        
        # Verify status is updated to extracted
        db_session.refresh(mock_document)
        assert mock_document.status == DocumentStatus.extracted

        documents = client.get("/api/documents").json()
        extracted = next(document for document in documents if document["id"] == mock_document.id)
        assert extracted["extractedSignalIds"] == [signals[0]["id"]]

def test_run_extraction_agent_rejects_raw(db_session):
    src = Source(id="src-test-raw", name="Test Src", url="http://test.com", status="approved")
    doc = Document(id="doc-test-raw", source_id="src-test-raw", title="Title", content="Content", status=DocumentStatus.raw)
    db_session.add(src)
    db_session.add(doc)
    db_session.commit()
    
    response = client.post(f"/api/agents/extract/{doc.id}")
    assert response.status_code == 400
    assert "has not been processed" in response.json()["detail"]
