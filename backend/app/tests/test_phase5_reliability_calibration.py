from datetime import datetime

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


def test_source_reliability_uses_scores_and_evidence_coverage():
    source = client.post("/api/import/sources", json={
        "sources": [{
            "name": "Reliable Retail Source",
            "url": "https://example.com/reliable",
            "source_type": "research",
            "credibility_score": 0.7,
            "relevance_score": 0.8,
            "freshness_score": 0.9,
            "status": "approved",
        }]
    }).json()
    source_id = source["entity_ids"][0]
    document = client.post("/api/documents", json={
        "title": "Grocery AI report",
        "content": "Semantic AI search improves discovery.",
        "source_id": source_id,
    }).json()
    signal = client.post("/api/signals/extract", json={
        "document_id": document["id"],
        "source_id": source_id,
        "title": "Semantic search signal",
        "confidence_score": 0.8,
    }).json()
    trend = client.post("/api/trends/cluster", json={"name": "Semantic search"}).json()
    client.post(f"/api/trends/{trend['id']}/evidence", json={
        "trend_id": trend["id"],
        "signal_id": signal["id"],
        "document_id": document["id"],
        "source_id": source_id,
        "relationship_type": "supports",
    })

    response = client.post(f"/api/sources/{source_id}/reliability")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["source_id"] == source_id
    assert data["document_count"] == 1
    assert data["evidence_count"] == 1
    assert data["reliability_score"] > 0.7
    assert data["rationale"]


def test_prediction_calibration_reports_confidence_error():
    trend = client.post("/api/trends/cluster", json={"name": "Calibrated trend"}).json()
    prediction = client.post("/api/agent/predictions", json={
        "trend_id": trend["id"],
        "prediction_statement": "Adoption reaches mainstream.",
        "target_date": datetime.utcnow().isoformat(),
        "confidence_score": 0.9,
        "status": "resolved",
    }).json()
    outcome = client.post(f"/api/agent/predictions/{prediction['id']}/outcomes", json={
        "prediction_id": prediction["id"],
        "resolution": "invalidated",
        "accuracy_score": 0.2,
        "lessons_learned": "Evidence was narrower than expected.",
    })
    assert outcome.status_code == 200, outcome.text

    response = client.post(f"/api/agent/predictions/{prediction['id']}/calibration")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["prediction_id"] == prediction["id"]
    assert data["evaluated_predictions"] == 1
    assert data["average_confidence"] == pytest.approx(0.9)
    assert data["average_accuracy"] == pytest.approx(0.2)
    assert data["calibration_error"] == pytest.approx(0.7)

    aggregate = client.post("/api/agent/predictions/calibration")
    assert aggregate.status_code == 200
    assert aggregate.json()["evaluated_predictions"] == 1
