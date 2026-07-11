from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.database import SessionLocal
from app.models.core import (
    MonitoringRule, MonitoringRun, Alert, WhatChangedSummary,
    SourceSnapshot, ChangeEvent, TrendScoreSnapshot, TrendScoreChange,
    StrategicContext, Assumption, LeadingIndicator, StrategicImplication,
    Scenario, StrategicOption, DecisionBrief, RoadmapItem,
    AgentActivity, Prediction, PredictionUpdate, PredictionOutcome, AgentDebate,
    AuditEvent, KGNode, KGEdge
)
from app.schemas.core import (
    MonitoringRuleOut, MonitoringRuleCreate, MonitoringRuleUpdate,
    MonitoringRunOut, MonitoringRunBase, AlertOut, AlertUpdate, WhatChangedSummaryOut,
    SourceSnapshotOut, SourceSnapshotCreate,
    ChangeEventOut, ChangeEventCreate,
    TrendScoreSnapshotOut, TrendScoreSnapshotCreate,
    TrendScoreChangeOut, TrendScoreChangeCreate, ScoreHistoryOut,
    StrategicContextOut, StrategicContextCreate,
    AssumptionOut, AssumptionCreate, AssumptionUpdate,
    LeadingIndicatorOut, LeadingIndicatorUpdate,
    StrategicImplicationOut, StrategicImplicationCreate,
    ScenarioOut, ScenarioCreate,
    StrategicOptionOut, StrategicOptionCreate, StrategicOptionUpdate,
    DecisionBriefOut, DecisionBriefCreate,
    RoadmapItemOut, RoadmapItemCreate, RoadmapItemUpdate,
    AgentActivityOut, AgentActivityCreate,
    PredictionOut, PredictionCreate, PredictionUpdate as PredictionUpdateSchema,
    PredictionUpdateOut, PredictionUpdateCreate,
    PredictionOutcomeOut, PredictionOutcomeCreate,
    AgentDebateOut, AgentDebateCreate,
    KGNodeOut, KGNodeCreate, KGNodeUpdate,
    KGEdgeOut, KGEdgeCreate, KGEdgeUpdate
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Generic factory for basic GET endpoints
def get_all(model, db: Session):
    return db.query(model).all()

def create_item(model, schema_in, db: Session):
    db_item = model(**schema_in.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(model, item_id: str, patch, db: Session):
    db_item = db.query(model).filter(model.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = patch.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def write_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict | None = None,
    actor: str = "system"
) -> None:
    """Persist an immutable AuditEvent row. Call within the same transaction as the mutation."""
    import json
    audit = AuditEvent(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user_id=actor,
        details=json.dumps(details or {})
    )
    db.add(audit)
    db.commit()

# Monitoring
@router.get("/monitoring-rules", response_model=List[MonitoringRuleOut])
def get_monitoring_rules(db: Session = Depends(get_db)):
    return get_all(MonitoringRule, db)

@router.post("/monitoring-rules", response_model=MonitoringRuleOut)
def create_monitoring_rule(rule: MonitoringRuleCreate, db: Session = Depends(get_db)):
    return create_item(MonitoringRule, rule, db)

@router.get("/monitoring-runs", response_model=List[MonitoringRunOut])
def get_monitoring_runs(db: Session = Depends(get_db)):
    return get_all(MonitoringRun, db)

@router.get("/what-changed-summaries", response_model=List[WhatChangedSummaryOut])
def get_what_changed(db: Session = Depends(get_db)):
    return get_all(WhatChangedSummary, db)

@router.get("/alerts", response_model=List[AlertOut])
def get_alerts(db: Session = Depends(get_db)):
    return get_all(Alert, db)

@router.patch("/monitoring-rules/{rule_id}", response_model=MonitoringRuleOut)
def update_monitoring_rule(rule_id: str, patch: MonitoringRuleUpdate, db: Session = Depends(get_db)):
    return update_item(MonitoringRule, rule_id, patch, db)

@router.delete("/monitoring-rules/{rule_id}")
def delete_monitoring_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(MonitoringRule).filter(MonitoringRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="MonitoringRule not found")
    db.delete(rule)
    db.commit()
    write_audit(db, "monitoring_rule_deleted", "monitoring_rules", rule_id)
    return {"success": True}

@router.post("/monitoring-rules/{rule_id}/run", response_model=MonitoringRunOut)
def trigger_monitoring_run(rule_id: str, db: Session = Depends(get_db)):
    """Create a MonitoringRun record for the given rule (simulates triggering a run)."""
    rule = db.query(MonitoringRule).filter(MonitoringRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="MonitoringRule not found")
    run_data = MonitoringRunBase(rule_id=rule_id, source_id=rule.source_id, status="running")
    run = create_item(MonitoringRun, run_data, db)
    write_audit(db, "monitoring_run_triggered", "monitoring_runs", run.id, {"rule_id": rule_id})
    return run

@router.post("/monitoring/run", response_model=MonitoringRunOut)
def create_monitoring_run(run: MonitoringRunBase, db: Session = Depends(get_db)):
    """Directly create a MonitoringRun record (Phase 2 persistence endpoint)."""
    result = create_item(MonitoringRun, run, db)
    write_audit(db, "monitoring_run_created", "monitoring_runs", result.id,
                {"rule_id": run.rule_id, "source_id": run.source_id})
    return result

# Source Snapshots & Change Events
@router.get("/source-snapshots", response_model=List[SourceSnapshotOut])
def get_source_snapshots(db: Session = Depends(get_db)):
    return get_all(SourceSnapshot, db)

@router.get("/source-snapshots/{source_id}", response_model=List[SourceSnapshotOut])
def get_source_snapshots_by_source(source_id: str, db: Session = Depends(get_db)):
    return db.query(SourceSnapshot).filter(SourceSnapshot.source_id == source_id).all()

@router.post("/source-snapshots", response_model=SourceSnapshotOut)
def create_source_snapshot(snap: SourceSnapshotCreate, db: Session = Depends(get_db)):
    return create_item(SourceSnapshot, snap, db)

@router.get("/change-events", response_model=List[ChangeEventOut])
def get_change_events(db: Session = Depends(get_db)):
    return get_all(ChangeEvent, db)

@router.post("/change-events", response_model=ChangeEventOut)
def create_change_event(evt: ChangeEventCreate, db: Session = Depends(get_db)):
    return create_item(ChangeEvent, evt, db)

# Trend Score History
@router.get("/trends/{trend_id}/score-history", response_model=ScoreHistoryOut)
def get_trend_score_history(trend_id: str, db: Session = Depends(get_db)):
    snapshots = db.query(TrendScoreSnapshot).filter(
        TrendScoreSnapshot.trend_id == trend_id
    ).order_by(TrendScoreSnapshot.captured_at).all()
    changes = db.query(TrendScoreChange).filter(
        TrendScoreChange.trend_id == trend_id
    ).order_by(TrendScoreChange.changed_at).all()
    return ScoreHistoryOut(snapshots=snapshots, changes=changes)

@router.post("/trends/{trend_id}/score-snapshots", response_model=TrendScoreSnapshotOut)
def create_trend_score_snapshot(trend_id: str, snap: TrendScoreSnapshotCreate, db: Session = Depends(get_db)):
    data = snap.model_dump()
    data["trend_id"] = trend_id
    return create_item(TrendScoreSnapshot, TrendScoreSnapshotCreate(**data), db)

@router.post("/trends/{trend_id}/score-changes", response_model=TrendScoreChangeOut)
def create_trend_score_change(trend_id: str, chg: TrendScoreChangeCreate, db: Session = Depends(get_db)):
    data = chg.model_dump()
    data["trend_id"] = trend_id
    return create_item(TrendScoreChange, TrendScoreChangeCreate(**data), db)

@router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: str, patch: AlertUpdate, db: Session = Depends(get_db)):
    existing = db.query(Alert).filter(Alert.id == alert_id).first()
    previous_acknowledged = existing.acknowledged if existing else None
    result = update_item(Alert, alert_id, patch, db)
    if patch.acknowledged == "true":
        write_audit(
            db,
            "alert_acknowledged",
            "alerts",
            alert_id,
            {"previous_value": previous_acknowledged, "new_value": patch.acknowledged}
        )
    return result

# Strategy
@router.get("/strategic-contexts", response_model=List[StrategicContextOut])
def get_strategic_contexts(db: Session = Depends(get_db)):
    return get_all(StrategicContext, db)

@router.post("/strategic-contexts", response_model=StrategicContextOut)
def create_strategic_context(ctx: StrategicContextCreate, db: Session = Depends(get_db)):
    data = ctx.model_dump(exclude_unset=True, exclude={"id"})
    for key in [
        "target_customers",
        "strategic_goals",
        "current_capabilities",
        "constraints",
        "planning_horizons",
    ]:
        if key in data:
            data[key] = json.dumps(data[key] or [])

    existing = db.query(StrategicContext).filter(StrategicContext.id == ctx.id).first() if ctx.id else None
    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    if ctx.id:
        data["id"] = ctx.id
    item = StrategicContext(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/assumptions", response_model=List[AssumptionOut])
def get_assumptions(db: Session = Depends(get_db)):
    return get_all(Assumption, db)

@router.post("/assumptions", response_model=AssumptionOut)
def create_assumption(assumption: AssumptionCreate, db: Session = Depends(get_db)):
    return create_item(Assumption, assumption, db)

@router.patch("/assumptions/{assumption_id}", response_model=AssumptionOut)
def update_assumption(assumption_id: str, patch: AssumptionUpdate, db: Session = Depends(get_db)):
    existing = db.query(Assumption).filter(Assumption.id == assumption_id).first()
    previous_status = existing.status if existing else None
    result = update_item(Assumption, assumption_id, patch, db)
    if patch.status is not None:
        write_audit(
            db,
            f"assumption_{patch.status}",
            "assumptions",
            assumption_id,
            {"previous_value": previous_status, "new_value": patch.status}
        )
    return result

@router.get("/leading-indicators", response_model=List[LeadingIndicatorOut])
def get_leading_indicators(db: Session = Depends(get_db)):
    return get_all(LeadingIndicator, db)

@router.patch("/leading-indicators/{indicator_id}", response_model=LeadingIndicatorOut)
def update_leading_indicator(indicator_id: str, patch: LeadingIndicatorUpdate, db: Session = Depends(get_db)):
    return update_item(LeadingIndicator, indicator_id, patch, db)

@router.get("/strategic-implications", response_model=List[StrategicImplicationOut])
def get_strategic_implications(db: Session = Depends(get_db)):
    return get_all(StrategicImplication, db)

@router.post("/strategic-implications", response_model=StrategicImplicationOut)
def create_strategic_implication(imp: StrategicImplicationCreate, db: Session = Depends(get_db)):
    return create_item(StrategicImplication, imp, db)

@router.get("/scenarios", response_model=List[ScenarioOut])
def get_scenarios(db: Session = Depends(get_db)):
    return get_all(Scenario, db)

@router.post("/scenarios", response_model=ScenarioOut)
def create_scenario(sc: ScenarioCreate, db: Session = Depends(get_db)):
    return create_item(Scenario, sc, db)

@router.get("/strategic-options", response_model=List[StrategicOptionOut])
def get_strategic_options(db: Session = Depends(get_db)):
    return get_all(StrategicOption, db)

@router.post("/strategic-options", response_model=StrategicOptionOut)
def create_strategic_option(opt: StrategicOptionCreate, db: Session = Depends(get_db)):
    return create_item(StrategicOption, opt, db)

@router.patch("/strategic-options/{option_id}", response_model=StrategicOptionOut)
def update_strategic_option(option_id: str, patch: StrategicOptionUpdate, db: Session = Depends(get_db)):
    existing = db.query(StrategicOption).filter(StrategicOption.id == option_id).first()
    previous_status = existing.status if existing else None
    result = update_item(StrategicOption, option_id, patch, db)
    if patch.status is not None:
        write_audit(
            db,
            f"option_decision_{patch.status}",
            "strategic_options",
            option_id,
            {"previous_value": previous_status, "new_value": patch.status}
        )
    return result

@router.get("/decision-briefs", response_model=List[DecisionBriefOut])
def get_decision_briefs(db: Session = Depends(get_db)):
    return get_all(DecisionBrief, db)

@router.post("/decision-briefs", response_model=DecisionBriefOut)
def create_decision_brief(brief: DecisionBriefCreate, db: Session = Depends(get_db)):
    return create_item(DecisionBrief, brief, db)

@router.get("/roadmap-items", response_model=List[RoadmapItemOut])
def get_roadmap_items(db: Session = Depends(get_db)):
    return get_all(RoadmapItem, db)

@router.post("/roadmap-items", response_model=RoadmapItemOut)
def create_roadmap_item(item: RoadmapItemCreate, db: Session = Depends(get_db)):
    return create_item(RoadmapItem, item, db)

@router.patch("/roadmap-items/{item_id}", response_model=RoadmapItemOut)
def update_roadmap_item(item_id: str, patch: RoadmapItemUpdate, db: Session = Depends(get_db)):
    return update_item(RoadmapItem, item_id, patch, db)

# Multi-Agent
@router.get("/agent/activities", response_model=List[AgentActivityOut])
def get_agent_activities(db: Session = Depends(get_db)):
    return get_all(AgentActivity, db)

@router.post("/agent/activities", response_model=AgentActivityOut)
def create_agent_activity(activity: AgentActivityCreate, db: Session = Depends(get_db)):
    return create_item(AgentActivity, activity, db)

@router.get("/agent/predictions", response_model=List[PredictionOut])
def get_predictions(db: Session = Depends(get_db)):
    return get_all(Prediction, db)

@router.post("/agent/predictions", response_model=PredictionOut)
def create_prediction(pred: PredictionCreate, db: Session = Depends(get_db)):
    return create_item(Prediction, pred, db)

@router.patch("/agent/predictions/{id}", response_model=PredictionOut)
def update_prediction(id: str, patch: PredictionUpdateSchema, db: Session = Depends(get_db)):
    existing = db.query(Prediction).filter(Prediction.id == id).first()
    previous_status = existing.status if existing else None
    previous_confidence = existing.confidence_score if existing else None
    result = update_item(Prediction, id, patch, db)
    patch_data = patch.model_dump(exclude_unset=True)
    write_audit(
        db,
        "prediction_updated",
        "predictions",
        id,
        {
            "previous_value": {
                "status": previous_status,
                "confidence_score": previous_confidence,
            },
            "new_value": patch_data,
        }
    )
    return result

@router.get("/agent/predictions/{id}/updates", response_model=List[PredictionUpdateOut])
def get_prediction_updates(id: str, db: Session = Depends(get_db)):
    return db.query(PredictionUpdate).filter(PredictionUpdate.prediction_id == id).all()

@router.post("/agent/predictions/{id}/updates", response_model=PredictionUpdateOut)
def create_prediction_update(id: str, update: PredictionUpdateCreate, db: Session = Depends(get_db)):
    # Override prediction_id just in case
    update_data = update.model_dump()
    update_data["prediction_id"] = id
    return create_item(PredictionUpdate, PredictionUpdateCreate(**update_data), db)

@router.get("/agent/predictions/{id}/outcomes", response_model=List[PredictionOutcomeOut])
def get_prediction_outcomes(id: str, db: Session = Depends(get_db)):
    return db.query(PredictionOutcome).filter(PredictionOutcome.prediction_id == id).all()

@router.post("/agent/predictions/{id}/outcomes", response_model=PredictionOutcomeOut)
def create_prediction_outcome(id: str, outcome: PredictionOutcomeCreate, db: Session = Depends(get_db)):
    outcome_data = outcome.model_dump()
    outcome_data["prediction_id"] = id
    result = create_item(PredictionOutcome, PredictionOutcomeCreate(**outcome_data), db)
    write_audit(db, "prediction_outcome_recorded", "prediction_outcomes", result.id,
                {"prediction_id": id, "resolution": outcome.resolution, "accuracy_score": outcome.accuracy_score})
    return result

@router.get("/agent/debates", response_model=List[AgentDebateOut])
def get_agent_debates(db: Session = Depends(get_db)):
    return get_all(AgentDebate, db)

@router.post("/agent/debates", response_model=AgentDebateOut)
def create_agent_debate(debate: AgentDebateCreate, db: Session = Depends(get_db)):
    return create_item(AgentDebate, debate, db)


@router.get("/knowledge/nodes", response_model=List[KGNodeOut])
def get_knowledge_nodes(db: Session = Depends(get_db)):
    return get_all(KGNode, db)

@router.post("/knowledge/nodes", response_model=KGNodeOut)
def create_knowledge_node(node: KGNodeCreate, db: Session = Depends(get_db)):
    return create_item(KGNode, node, db)

@router.patch("/knowledge/nodes/{entity_id}", response_model=KGNodeOut)
def update_knowledge_node(entity_id: str, patch: KGNodeUpdate, db: Session = Depends(get_db)):
    # Our update_item expects 'id' field by default, we need a custom update for KGNode which uses entity_id
    db_item = db.query(KGNode).filter(KGNode.entity_id == entity_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = patch.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/knowledge/edges", response_model=List[KGEdgeOut])
def get_knowledge_edges(db: Session = Depends(get_db)):
    return get_all(KGEdge, db)

@router.post("/knowledge/edges", response_model=KGEdgeOut)
def create_knowledge_edge(edge: KGEdgeCreate, db: Session = Depends(get_db)):
    result = create_item(KGEdge, edge, db)
    write_audit(db, "kg_edge_created", "kg_edges", result.id,
                {"source_id": edge.source_id, "target_id": edge.target_id,
                 "relationship": edge.relationship_type})
    return result

@router.patch("/knowledge/edges/{id}", response_model=KGEdgeOut)
def update_knowledge_edge(id: str, patch: KGEdgeUpdate, db: Session = Depends(get_db)):
    return update_item(KGEdge, id, patch, db)
