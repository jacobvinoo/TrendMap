import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    from app.db.base_class import Base
    from app.db.database import engine
    import app.models.core

    yield


def test_import_sources_and_documents_then_export_trend():
    industry = client.post("/api/industries", json={
        "name": "Online Grocery",
        "geography": "Global",
        "description": "Digital grocery retail",
    }).json()

    source_response = client.post("/api/import/sources", json={
        "sources": [{
            "name": "Retail Signals",
            "url": "https://example.com/retail",
            "source_type": "news",
            "credibility_score": 0.8,
            "relevance_score": 0.9,
            "freshness_score": 0.7,
            "status": "approved",
        }]
    })
    assert source_response.status_code == 200, source_response.text
    source_id = source_response.json()["entity_ids"][0]

    document_response = client.post("/api/import/documents", json={
        "documents": [{
            "title": "Semantic grocery search expands",
            "content": "AI search is improving grocery discovery.",
            "source_id": source_id,
            "status": "processed",
        }]
    })
    assert document_response.status_code == 200, document_response.text
    document_id = document_response.json()["entity_ids"][0]

    signal = client.post("/api/signals/extract", json={
        "document_id": document_id,
        "source_id": source_id,
        "title": "AI search adoption",
        "summary": "Retailers are investing in semantic search.",
        "confidence_score": 0.8,
    }).json()
    trend = client.post("/api/trends/cluster", json={
        "name": "AI grocery search",
        "status": "approved",
    }).json()
    client.post(f"/api/trends/{trend['id']}/evidence", json={
        "trend_id": trend["id"],
        "signal_id": signal["id"],
        "document_id": document_id,
        "source_id": source_id,
        "relationship_type": "supports",
    })

    trend_export = client.get(f"/api/export/trend/{trend['id']}")
    assert trend_export.status_code == 200, trend_export.text
    payload = trend_export.json()["payload"]
    assert payload["trend"]["name"] == "AI grocery search"
    assert len(payload["evidence_links"]) == 1
    assert payload["sources"][0]["id"] == source_id

    industry_export = client.get(f"/api/export/industry/{industry['id']}")
    assert industry_export.status_code == 200, industry_export.text
    assert industry_export.json()["payload"]["industry"]["name"] == "Online Grocery"

    export_history = client.get("/api/data-exports")
    assert export_history.status_code == 200
    operation_types = [item["operation_type"] for item in export_history.json()]
    assert "import" in operation_types
    assert "export" in operation_types


def test_data_health_reports_approved_trend_without_evidence():
    trend = client.post("/api/trends/cluster", json={
        "name": "Unsupported approved trend",
        "status": "approved",
    }).json()

    response = client.post("/api/admin/data-health")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "degraded"
    assert data["issue_count"] >= 1
    assert any(issue["entity_id"] == trend["id"] for issue in data["issues"])
    assert data["latest_checks"][0]["component"] == "data_integrity"
