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


def _seed_evidenced_trend():
    source = client.post("/api/sources", json={
        "name": "Retail Research",
        "url": "https://example.com/research",
        "source_type": "research",
    }).json()
    document = client.post("/api/documents", json={
        "title": "AI search report",
        "content": "AI search improves grocery product discovery.",
        "source_id": source["id"],
    }).json()
    signal = client.post("/api/signals/extract", json={
        "document_id": document["id"],
        "source_id": source["id"],
        "title": "AI grocery search signal",
        "summary": "Semantic grocery search adoption is rising.",
        "confidence_score": 0.8,
    }).json()
    trend = client.post("/api/trends/cluster", json={
        "name": "AI grocery search",
        "status": "approved",
        "confidence_score": 0.75,
    }).json()
    client.post(f"/api/trends/{trend['id']}/evidence", json={
        "trend_id": trend["id"],
        "signal_id": signal["id"],
        "document_id": document["id"],
        "source_id": source["id"],
        "relationship_type": "supports",
    })
    return trend


def test_build_knowledge_graph_for_trend_and_get_neighborhood():
    trend = _seed_evidenced_trend()

    build_response = client.post(f"/api/knowledge/trends/{trend['id']}/build")
    assert build_response.status_code == 200, build_response.text
    build = build_response.json()
    assert build["nodes_created"] == 4
    assert build["edges_created"] == 3

    nodes = client.get("/api/knowledge/nodes").json()
    trend_node_id = next(node["entity_id"] for node in nodes if node["node_type"] == "trend")
    neighborhood_response = client.get(f"/api/knowledge/neighborhood/{trend_node_id}?depth=2")
    assert neighborhood_response.status_code == 200, neighborhood_response.text
    neighborhood = neighborhood_response.json()
    assert len(neighborhood["nodes"]) >= 2
    assert any(node["node_type"] == "trend" for node in neighborhood["nodes"])
    assert any(edge["relationship_type"] == "supports" for edge in neighborhood["edges"])

    second_build = client.post(f"/api/knowledge/trends/{trend['id']}/build").json()
    assert second_build["nodes_created"] == 0
    assert second_build["edges_created"] == 0
