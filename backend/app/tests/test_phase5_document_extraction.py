import pytest
from fastapi.testclient import TestClient

import app.api.phase5 as phase5_api
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    from app.db.base_class import Base
    from app.db.database import engine
    import app.models.core

    yield


def test_extract_documents_from_sources_fetches_real_content(monkeypatch):
    source = client.post("/api/import/sources", json={
        "sources": [{
            "name": "Approved Feed",
            "url": "https://example.com/article",
            "source_type": "news",
            "status": "approved",
        }]
    }).json()

    def fake_fetch(url):
        assert url == "https://example.com/article"
        return " ".join(["Fetched source article content about AI grocery search and retail media trust."] * 8)

    monkeypatch.setattr(phase5_api, "fetch_document_text", fake_fetch)

    response = client.post("/api/documents/extract-from-sources")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["imported_count"] == 1
    assert data["entity_ids"]
    assert data["errors"] == []

    documents = client.get("/api/documents").json()
    assert len(documents) == 1
    assert documents[0]["source_id"] == source["entity_ids"][0]
    assert "Fetched source article content" in documents[0]["content"]


def test_extract_documents_from_sources_reports_fetch_failures(monkeypatch):
    client.post("/api/import/sources", json={
        "sources": [{
            "name": "Broken Feed",
            "url": "https://example.com/broken",
            "source_type": "news",
            "status": "approved",
        }]
    })

    def fake_fetch(url):
        raise RuntimeError(f"Unable to fetch {url}: network unavailable")

    monkeypatch.setattr(phase5_api, "fetch_document_text", fake_fetch)

    response = client.post("/api/documents/extract-from-sources")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["imported_count"] == 0
    assert data["entity_ids"] == []
    assert data["errors"]
    assert "No documents were fetched" in data["message"]
