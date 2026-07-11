"""
Tests for Phase 2 persistence: SourceSnapshot, ChangeEvent,
TrendScoreSnapshot, TrendScoreChange, and key endpoints
(POST /api/monitoring/run, GET /api/trends/{id}/score-history).
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    from app.db.base_class import Base
    from app.db.database import engine
    import app.models.core  # ensure all tables including new ones are loaded
    yield


@pytest.fixture(scope="module")
def source_id():
    src = client.post("/api/sources", json={
        "name": "Phase2 Source", "url": "http://phase2.test", "source_type": "news"
    }).json()
    return src["id"]


@pytest.fixture(scope="module")
def trend_id():
    trend = client.post("/api/trends/cluster", json={"name": "Phase2 Trend"}).json()
    return trend["id"]


# ─── Source Snapshots ───────────────────────────────────────────────────────

def test_create_source_snapshot(source_id):
    resp = client.post("/api/source-snapshots", json={
        "source_id": source_id,
        "document_fingerprints": "[]",
        "raw_metadata": "{}"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["source_id"] == source_id
    assert "id" in data
    assert "captured_at" in data


def test_get_source_snapshots_by_source(source_id):
    # At least one snapshot created above
    resp = client.get(f"/api/source-snapshots/{source_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["source_id"] == source_id


def test_list_all_source_snapshots():
    resp = client.get("/api/source-snapshots")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_delete_monitoring_rule(source_id):
    rule = client.post("/api/monitoring-rules", json={
        "source_id": source_id,
        "industry_profile_id": "ind-phase2-delete",
        "frequency": "manual",
        "enabled": "true"
    }).json()

    delete_response = client.delete(f"/api/monitoring-rules/{rule['id']}")
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["success"] is True

    rules = client.get("/api/monitoring-rules").json()
    assert not any(item["id"] == rule["id"] for item in rules)


# ─── Change Events ───────────────────────────────────────────────────────────

def test_create_change_event(source_id):
    # Create a snapshot to reference
    snap = client.post("/api/source-snapshots", json={
        "source_id": source_id, "document_fingerprints": "[]"
    }).json()

    resp = client.post("/api/change-events", json={
        "source_id": source_id,
        "change_type": "new_document",
        "current_snapshot_id": snap["id"],
        "summary": "New document discovered"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["change_type"] == "new_document"
    assert data["current_snapshot_id"] == snap["id"]


def test_list_change_events():
    resp = client.get("/api/change-events")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


# ─── Trend Score History ─────────────────────────────────────────────────────

def test_create_trend_score_snapshot(trend_id):
    resp = client.post(f"/api/trends/{trend_id}/score-snapshots", json={
        "trend_id": trend_id,
        "likelihood_score": 0.6,
        "confidence_score": 0.7,
        "impact_score": 0.5,
        "horizon": "medium",
        "maturity_stage": "emerging",
        "evidence_count": 3.0,
        "signal_count": 5.0,
        "source_diversity": 0.4,
        "reason": "Initial snapshot"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["trend_id"] == trend_id
    assert data["likelihood_score"] == pytest.approx(0.6)


def test_get_score_history_empty_changes(trend_id):
    resp = client.get(f"/api/trends/{trend_id}/score-history")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "snapshots" in data
    assert "changes" in data
    assert isinstance(data["snapshots"], list)
    assert isinstance(data["changes"], list)
    assert len(data["snapshots"]) >= 1


def test_create_trend_score_change(trend_id):
    # Create two snapshots
    snap1 = client.post(f"/api/trends/{trend_id}/score-snapshots", json={
        "trend_id": trend_id,
        "likelihood_score": 0.5,
        "confidence_score": 0.5,
        "impact_score": 0.4,
        "reason": "Baseline"
    }).json()
    snap2 = client.post(f"/api/trends/{trend_id}/score-snapshots", json={
        "trend_id": trend_id,
        "likelihood_score": 0.7,
        "confidence_score": 0.6,
        "impact_score": 0.5,
        "reason": "Updated"
    }).json()

    resp = client.post(f"/api/trends/{trend_id}/score-changes", json={
        "trend_id": trend_id,
        "previous_snapshot_id": snap1["id"],
        "current_snapshot_id": snap2["id"],
        "likelihood_delta": 0.2,
        "confidence_delta": 0.1,
        "impact_delta": 0.1,
        "reason": "New evidence added",
        "horizon_changed": "false",
        "maturity_changed": "false"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["trend_id"] == trend_id
    assert data["likelihood_delta"] == pytest.approx(0.2)


def test_score_history_includes_change(trend_id):
    resp = client.get(f"/api/trends/{trend_id}/score-history")
    data = resp.json()
    assert len(data["changes"]) >= 1
    assert data["changes"][0]["trend_id"] == trend_id


# ─── Monitoring Run ──────────────────────────────────────────────────────────

def test_post_monitoring_run(source_id):
    # Create a monitoring rule first
    rule = client.post("/api/monitoring-rules", json={
        "source_id": source_id,
        "industry_profile_id": "test-profile",
        "frequency": "daily",
        "enabled": "true"
    }).json()

    resp = client.post("/api/monitoring/run", json={
        "rule_id": rule["id"],
        "source_id": source_id,
        "status": "running"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["rule_id"] == rule["id"]
    assert data["status"] == "running"
