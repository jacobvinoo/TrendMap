import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.core import Embedding

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_vector_store(db_session):
    db_session.query(Embedding).delete()
    rows = [
        Embedding(
            entity_type="trend",
            entity_id="trend-ai-grocery-search",
            model_name="test",
            text_content="AI grocery assistant semantic search conversational product discovery",
            vector_data="[]",
            metadata_json='{"title": "AI-assisted grocery discovery"}',
        ),
        Embedding(
            entity_type="trend",
            entity_id="trend-retail-media-risk",
            model_name="test",
            text_content="Sponsored placement risk retail media relevance trust erosion",
            vector_data="[]",
            metadata_json='{"title": "Retail media influence on search outcomes"}',
        ),
        Embedding(
            entity_type="option",
            entity_id="option-transparency-controls",
            model_name="test",
            text_content="Trust in recommendations transparency controls sponsored disclosure",
            vector_data="[]",
            metadata_json='{"title": "Recommendation transparency controls"}',
        ),
        Embedding(
            entity_type="source",
            entity_id="source-ai-vendor",
            model_name="test",
            text_content="AI search vendor publishes grocery semantic search case study",
            vector_data="[]",
            metadata_json='{"title": "AI vendor source", "geography": "global"}',
        ),
    ]
    db_session.add_all(rows)
    db_session.commit()
    yield


def test_semantic_search_returns_related_trend():
    response = client.post("/api/search/semantic", json={
        "query": "AI grocery assistant",
        "entity_types": ["trend"],
    })

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["results"][0]["entity_id"] == "trend-ai-grocery-search"
    assert data["results"][0]["entity_type"] == "trend"
    assert data["results"][0]["relevance_score"] > 0
    assert "AI grocery assistant" in data["results"][0]["evidence_snippet"]


def test_semantic_search_filters_by_entity_type_and_metadata():
    response = client.post("/api/search/semantic", json={
        "query": "AI grocery semantic search",
        "entity_types": ["source"],
        "filters": {"geography": "global"},
    })

    assert response.status_code == 200, response.text
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["entity_id"] == "source-ai-vendor"


def test_semantic_search_known_phase5_queries():
    retail_media = client.post("/api/search/semantic", json={
        "query": "sponsored placement risk",
    }).json()
    assert retail_media["results"][0]["entity_id"] == "trend-retail-media-risk"

    trust = client.post("/api/search/semantic", json={
        "query": "trust in recommendations",
        "entity_types": ["option"],
    }).json()
    assert trust["results"][0]["entity_id"] == "option-transparency-controls"


def test_empty_semantic_search_query_returns_validation_error():
    response = client.post("/api/search/semantic", json={"query": ""})

    assert response.status_code == 422
