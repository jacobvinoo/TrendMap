import json

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


def get_audit(action: str, entity_type: str, entity_id: str):
    from app.db.database import SessionLocal
    from app.models.core import AuditEvent

    db = SessionLocal()
    try:
        return db.query(AuditEvent).filter(
            AuditEvent.action == action,
            AuditEvent.entity_type == entity_type,
            AuditEvent.entity_id == entity_id,
        ).first()
    finally:
        db.close()


def test_source_and_trend_status_changes_create_audit_events():
    source = client.post("/api/sources", json={
        "name": "Audit Source",
        "url": "http://audit-source.test",
        "source_type": "news",
    }).json()

    source_response = client.patch(
        f"/api/sources/{source['id']}",
        json={"status": "approved"},
    )
    assert source_response.status_code == 200

    source_event = get_audit("source_approved", "sources", source["id"])
    assert source_event is not None
    source_details = json.loads(source_event.details)
    assert source_details["previous_value"] == "suggested"
    assert source_details["new_value"] == "approved"

    trend = client.post("/api/trends/cluster", json={"name": "Audit Trend"}).json()
    trend_response = client.patch(
        f"/api/trends/{trend['id']}",
        json={"status": "rejected"},
    )
    assert trend_response.status_code == 200

    trend_event = get_audit("trend_rejected", "trends", trend["id"])
    assert trend_event is not None
    trend_details = json.loads(trend_event.details)
    assert trend_details["previous_value"] == "candidate"
    assert trend_details["new_value"] == "rejected"


def test_monitoring_alert_strategy_prediction_and_kg_actions_create_audit_events():
    source = client.post("/api/sources", json={
        "name": "Audit Workflow Source",
        "url": "http://audit-workflow-source.test",
        "source_type": "news",
    }).json()
    rule = client.post("/api/monitoring-rules", json={
        "source_id": source["id"],
        "industry_profile_id": "audit-profile",
        "frequency": "daily",
        "enabled": "true",
    }).json()

    run = client.post("/api/monitoring/run", json={
        "rule_id": rule["id"],
        "source_id": source["id"],
        "status": "running",
    }).json()
    assert get_audit("monitoring_run_created", "monitoring_runs", run["id"]) is not None

    from app.db.database import SessionLocal
    from app.models.core import Alert

    db = SessionLocal()
    try:
        alert = Alert(
            trend_id=None,
            alert_type="score_change",
            severity="medium",
            title="Audit alert",
            acknowledged="false",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_id = alert.id
    finally:
        db.close()

    alert_response = client.patch(f"/api/alerts/{alert_id}", json={"acknowledged": "true"})
    assert alert_response.status_code == 200
    alert_event = get_audit("alert_acknowledged", "alerts", alert_id)
    assert alert_event is not None
    assert json.loads(alert_event.details)["previous_value"] == "false"

    trend = client.post("/api/trends/cluster", json={"name": "Audit Strategy Trend"}).json()
    assumption = client.post("/api/assumptions", json={
        "trend_id": trend["id"],
        "statement": "Customers will adopt AI recommendations",
        "assumption_type": "customer_behaviour",
        "status": "untested",
    }).json()
    client.patch(f"/api/assumptions/{assumption['id']}", json={"status": "supported"})
    assert get_audit("assumption_supported", "assumptions", assumption["id"]) is not None

    option = client.post("/api/strategic-options", json={
        "title": "Launch pilot",
        "status": "proposed",
    }).json()
    client.patch(f"/api/strategic-options/{option['id']}", json={"status": "accepted"})
    assert get_audit("option_decision_accepted", "strategic_options", option["id"]) is not None

    prediction = client.post("/api/agent/predictions", json={
        "trend_id": trend["id"],
        "prediction_statement": "AI recommendations will increase conversion",
        "confidence_score": 0.6,
        "status": "active",
    }).json()
    outcome = client.post(f"/api/agent/predictions/{prediction['id']}/outcomes", json={
        "prediction_id": prediction["id"],
        "resolution": "occurred",
        "accuracy_score": 0.8,
    }).json()
    outcome_event = get_audit("prediction_outcome_recorded", "prediction_outcomes", outcome["id"])
    assert outcome_event is not None
    assert json.loads(outcome_event.details)["resolution"] == "occurred"

    source_node = client.post("/api/knowledge/nodes", json={
        "label": "Signal",
        "node_type": "signal",
    }).json()
    target_node = client.post("/api/knowledge/nodes", json={
        "label": "Trend",
        "node_type": "trend",
    }).json()
    edge = client.post("/api/knowledge/edges", json={
        "source_id": source_node["entity_id"],
        "target_id": target_node["entity_id"],
        "relationship_type": "supports",
        "confidence_score": 0.9,
    }).json()
    assert get_audit("kg_edge_created", "kg_edges", edge["id"]) is not None
