from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Any, Optional, List
from datetime import datetime
from app.models.core import SourceStatus, DocumentStatus, TrendStatus, RelationshipType
import json

class IndustryBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    geography: Optional[str] = None
    description: Optional[str] = None
    strategic_priorities: Optional[List[str]] = Field(default_factory=list, alias="strategicPriorities")
    customer_segments: Optional[List[str]] = Field(default_factory=list, alias="customerSegments")
    competitors: Optional[List[str]] = Field(default_factory=list, alias="competitors")
    time_horizons: Optional[List[str]] = Field(default_factory=list, alias="timeHorizons")

    @field_validator("strategic_priorities", "customer_segments", "competitors", "time_horizons", mode="before")
    @classmethod
    def parse_list_field(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [part.strip() for part in value.split(",") if part.strip()]
        return value

class IndustryCreate(IndustryBase):
    id: Optional[str] = None

class IndustryOut(IndustryBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SourceBase(BaseModel):
    name: str
    url: str
    source_type: Optional[str] = None

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class SourceOut(SourceBase):
    id: str
    credibility_score: float = Field(..., ge=0.0, le=1.0)
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    freshness_score: float = Field(..., ge=0.0, le=1.0)
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    url: Optional[str] = None
    content: str
    status: DocumentStatus = DocumentStatus.raw
    source_id: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    extracted_signals: Optional[List[str]] = None

class DocumentOut(DocumentBase):
    id: str
    published_at: Optional[datetime] = None
    extracted_signal_ids: List[str] = Field(default_factory=list, alias="extractedSignalIds")
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class SignalBase(BaseModel):
    document_id: str
    source_id: str
    title: str
    summary: Optional[str] = None
    signal_type: Optional[str] = None
    pestle_category: Optional[str] = None
    novelty_score: float = Field(0.0, ge=0.0, le=1.0)
    strength_score: float = Field(0.0, ge=0.0, le=1.0)
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)

class SignalCreate(SignalBase):
    pass

class SignalOut(SignalBase):
    id: str
    evidence_date: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class TrendBase(BaseModel):
    name: str
    summary: Optional[str] = None
    status: TrendStatus = TrendStatus.candidate
    horizon: Optional[str] = None
    likelihood_score: float = Field(0.0, ge=0.0, le=1.0, alias="likelihoodScore")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, alias="confidenceScore")
    impact_score: float = Field(0.0, ge=0.0, le=1.0, alias="impactScore")
    maturity_stage: Optional[str] = Field(None, alias="maturityStage")
    related_signal_ids: Optional[List[str]] = Field(default_factory=list, alias="relatedSignalIds")
    drivers: Optional[List[str]] = Field(default_factory=list)
    blockers: Optional[List[str]] = Field(default_factory=list)
    what_needs_to_be_true: Optional[List[str]] = Field(default_factory=list, alias="whatNeedsToBeTrue")
    leading_indicators: Optional[List[str]] = Field(default_factory=list, alias="leadingIndicators")
    monitoring_questions: Optional[List[str]] = Field(default_factory=list, alias="monitoringQuestions")
    recommended_actions: Optional[List[str]] = Field(default_factory=list, alias="recommendedActions")

    model_config = ConfigDict(populate_by_name=True)

class TrendCreate(TrendBase):
    id: Optional[str] = None

class TrendUpdate(BaseModel):
    name: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    likelihood_score: Optional[float] = Field(None, ge=0.0, le=1.0, alias="likelihoodScore")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, alias="confidenceScore")
    impact_score: Optional[float] = Field(None, ge=0.0, le=1.0, alias="impactScore")

class TrendOut(TrendBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class EvidenceLinkBase(BaseModel):
    trend_id: str
    signal_id: str
    document_id: Optional[str] = None
    source_id: Optional[str] = None
    relationship_type: RelationshipType
    quote: Optional[str] = None
    relevance_reason: Optional[str] = None

class EvidenceLinkCreate(EvidenceLinkBase):
    pass

class EvidenceLinkOut(EvidenceLinkBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True
# Phase 2 Models

class MonitoringRuleBase(BaseModel):
    source_id: str
    industry_profile_id: str
    frequency: Optional[str] = "daily"
    enabled: Optional[str] = "true"
    keywords: Optional[str] = None
    include_patterns: Optional[str] = None
    exclude_patterns: Optional[str] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None

class MonitoringRuleOut(MonitoringRuleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class MonitoringRuleCreate(MonitoringRuleBase):
    pass

class MonitoringRuleUpdate(BaseModel):
    industry_profile_id: Optional[str] = None
    source_id: Optional[str] = None
    enabled: Optional[bool] = None
    frequency: Optional[str] = None
    keywords: Optional[str] = None
    include_patterns: Optional[str] = None
    exclude_patterns: Optional[str] = None

class MonitoringRunBase(BaseModel):
    rule_id: str
    source_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: Optional[str] = "pending"
    documents_scanned: Optional[float] = 0.0
    new_documents_found: Optional[float] = 0.0
    updated_documents_found: Optional[float] = 0.0
    new_signals_found: Optional[float] = 0.0
    affected_trend_ids: Optional[str] = None
    alert_ids: Optional[str] = None
    error_message: Optional[str] = None

class MonitoringRunOut(MonitoringRunBase):
    id: str
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    trend_id: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    message: Optional[str] = None
    summary: Optional[str] = None
    acknowledged: Optional[str] = "false"
    related_signal_ids: Optional[str] = None
    related_document_ids: Optional[str] = None
    related_source_ids: Optional[str] = None

class AlertOut(AlertBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    acknowledged: Optional[str] = None
    trend_id: Optional[str] = None
    alert_type: Optional[str] = None
    severity: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None

class WhatChangedSummaryBase(BaseModel):
    monitoring_run_id: Optional[str] = None
    headline: str
    new_signals: Optional[str] = None
    changed_trends: Optional[str] = None
    new_candidate_trends: Optional[str] = None
    alerts: Optional[str] = None
    recommended_actions: Optional[str] = None

class WhatChangedSummaryOut(WhatChangedSummaryBase):
    id: str
    generated_at: datetime
    class Config:
        from_attributes = True

class WhatChangedSummaryCreate(WhatChangedSummaryBase):
    pass

# Phase 2: Snapshot & Score History Schemas

class SourceSnapshotBase(BaseModel):
    source_id: str
    document_fingerprints: Optional[str] = None  # JSON string
    raw_metadata: Optional[str] = None  # JSON string

class SourceSnapshotCreate(SourceSnapshotBase):
    pass

class SourceSnapshotOut(SourceSnapshotBase):
    id: str
    captured_at: datetime
    class Config:
        from_attributes = True

class ChangeEventBase(BaseModel):
    source_id: str
    document_id: Optional[str] = None
    change_type: str
    previous_snapshot_id: Optional[str] = None
    current_snapshot_id: str
    summary: Optional[str] = None

class ChangeEventCreate(ChangeEventBase):
    pass

class ChangeEventOut(ChangeEventBase):
    id: str
    detected_at: datetime
    class Config:
        from_attributes = True

class TrendScoreSnapshotBase(BaseModel):
    trend_id: str
    likelihood_score: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    confidence_score: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    momentum_score: Optional[float] = None
    impact_score: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    horizon: Optional[str] = None
    maturity_stage: Optional[str] = None
    evidence_count: Optional[float] = 0.0
    signal_count: Optional[float] = 0.0
    source_diversity: Optional[float] = 0.0
    reason: Optional[str] = None

class TrendScoreSnapshotCreate(TrendScoreSnapshotBase):
    pass

class TrendScoreSnapshotOut(TrendScoreSnapshotBase):
    id: str
    captured_at: datetime
    class Config:
        from_attributes = True

class TrendScoreChangeBase(BaseModel):
    trend_id: str
    previous_snapshot_id: str
    current_snapshot_id: str
    likelihood_delta: Optional[float] = 0.0
    confidence_delta: Optional[float] = 0.0
    impact_delta: Optional[float] = 0.0
    new_confidence_score: Optional[float] = None
    new_momentum_score: Optional[float] = None
    new_impact_score: Optional[float] = None
    primary_reason: Optional[str] = None
    applied_at: Optional[datetime] = None
    horizon_changed: Optional[str] = "false"
    maturity_changed: Optional[str] = "false"
    reason: Optional[str] = None
    related_signal_ids: Optional[str] = None

class TrendScoreChangeCreate(TrendScoreChangeBase):
    pass

class TrendScoreChangeOut(TrendScoreChangeBase):
    id: str
    changed_at: datetime
    class Config:
        from_attributes = True

class ScoreHistoryOut(BaseModel):
    snapshots: List[TrendScoreSnapshotOut]
    changes: List[TrendScoreChangeOut]

# Phase 3 Models

class StrategicContextBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    industry_profile_id: str = Field(alias="industryProfileId")
    company_name: str = Field(alias="companyName")
    business_model: Optional[str] = Field(None, alias="businessModel")
    target_customers: List[str] = Field(default_factory=list, alias="targetCustomers")
    strategic_goals: List[str] = Field(default_factory=list, alias="strategicGoals")
    current_capabilities: List[str] = Field(default_factory=list, alias="currentCapabilities")
    constraints: List[str] = Field(default_factory=list)
    risk_appetite: Optional[str] = Field("medium", alias="riskAppetite")
    planning_horizons: List[str] = Field(default_factory=list, alias="planningHorizons")

    @field_validator("target_customers", "strategic_goals", "current_capabilities", "constraints", "planning_horizons", mode="before")
    @classmethod
    def parse_list_field(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            import json
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

class StrategicContextOut(StrategicContextBase):
    id: str
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StrategicContextCreate(StrategicContextBase):
    id: Optional[str] = None

class AssumptionBase(BaseModel):
    trend_id: str
    statement: str
    assumption_type: str
    confidence_score: Optional[float] = 0.0
    importance_score: Optional[float] = 0.0
    status: Optional[str] = "untested"
    related_signal_ids: Optional[str] = None
    related_indicator_ids: Optional[str] = None
    evidence_summary: Optional[str] = None

class AssumptionOut(AssumptionBase):
    id: str
    class Config:
        from_attributes = True


class AssumptionCreate(AssumptionBase):
    pass

class AssumptionUpdate(BaseModel):
    statement: Optional[str] = None
    assumption_type: Optional[str] = None
    confidence_score: Optional[float] = None
    importance_score: Optional[float] = None
    status: Optional[str] = None
    evidence_summary: Optional[str] = None

class LeadingIndicatorBase(BaseModel):
    assumption_id: str
    name: str
    description: Optional[str] = None
    indicator_type: Optional[str] = None
    current_status: Optional[str] = None
    threshold: Optional[str] = None
    monitoring_question: Optional[str] = None
    related_source_ids: Optional[str] = None

class LeadingIndicatorOut(LeadingIndicatorBase):
    id: str
    class Config:
        from_attributes = True


class LeadingIndicatorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    indicator_type: Optional[str] = None
    current_status: Optional[str] = None
    threshold: Optional[str] = None
    monitoring_question: Optional[str] = None

class StrategicImplicationBase(BaseModel):
    trend_id: str
    implication_type: str
    title: str
    summary: Optional[str] = None
    affected_capabilities: Optional[str] = None
    affected_customer_segments: Optional[str] = None
    urgency_score: Optional[float] = 0.0
    impact_score: Optional[float] = 0.0
    confidence_score: Optional[float] = 0.0
    evidence_ids: Optional[str] = None

class StrategicImplicationOut(StrategicImplicationBase):
    id: str
    class Config:
        from_attributes = True


class StrategicImplicationCreate(StrategicImplicationBase):
    pass

class ScenarioBase(BaseModel):
    name: str
    horizon: Optional[str] = None
    summary: Optional[str] = None
    scenario_type: str
    trigger_conditions: Optional[str] = None
    assumptions: Optional[str] = None
    implications: Optional[str] = None
    probability_score: Optional[float] = 0.0
    impact_score: Optional[float] = 0.0
    confidence_score: Optional[float] = 0.0
    early_warning_indicators: Optional[str] = None

class ScenarioOut(ScenarioBase):
    id: str
    class Config:
        from_attributes = True


class ScenarioCreate(ScenarioBase):
    pass

class StrategicOptionBase(BaseModel):
    title: str
    description: Optional[str] = None
    option_type: Optional[str] = None
    linked_trend_ids: Optional[str] = None
    linked_scenario_ids: Optional[str] = None
    linked_assumption_ids: Optional[str] = None
    expected_benefits: Optional[str] = None
    key_risks: Optional[str] = None
    required_capabilities: Optional[str] = None
    estimated_effort: Optional[str] = None
    time_to_value: Optional[str] = None
    impact_score: Optional[float] = 0.0
    feasibility_score: Optional[float] = 0.0
    urgency_score: Optional[float] = 0.0
    confidence_score: Optional[float] = 0.0
    priority_score: Optional[float] = 0.0
    recommended_next_step: Optional[str] = None
    status: Optional[str] = "proposed"

class StrategicOptionOut(StrategicOptionBase):
    id: str
    class Config:
        from_attributes = True


class StrategicOptionCreate(StrategicOptionBase):
    pass

class StrategicOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    roi_estimate: Optional[str] = None
    time_to_impact: Optional[str] = None
    risk_level: Optional[str] = None
    resource_requirements: Optional[str] = None

class DecisionBriefBase(BaseModel):
    strategic_context_id: Optional[str] = None
    headline: Optional[str] = None
    executive_summary: Optional[str] = None
    top_opportunities: Optional[str] = None
    top_threats: Optional[str] = None
    recommended_options: Optional[str] = None
    assumptions_to_test: Optional[str] = None
    indicators_to_monitor: Optional[str] = None
    evidence_ids: Optional[str] = None

class DecisionBriefOut(DecisionBriefBase):
    id: str
    generated_at: datetime
    class Config:
        from_attributes = True

class DecisionBriefCreate(DecisionBriefBase):
    pass

class RoadmapItemBase(BaseModel):
    strategic_option_id: str
    title: str
    horizon: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = "proposed"
    success_metric: Optional[str] = None
    linked_indicator_ids: Optional[str] = None

class RoadmapItemOut(RoadmapItemBase):
    id: str
    class Config:
        from_attributes = True


class RoadmapItemCreate(RoadmapItemBase):
    pass

class RoadmapItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    milestones: Optional[str] = None

# Phase 4 Models

class AgentActivityBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent_role: str = Field(alias="agentRole")
    task_type: Optional[str] = Field(default=None, alias="taskType")
    status: Optional[str] = "running"
    message: Optional[str] = None
    related_entity_id: Optional[str] = Field(default=None, alias="relatedEntityId")

class AgentActivityOut(AgentActivityBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class AgentActivityCreate(AgentActivityBase):
    pass

class PredictionBase(BaseModel):
    trend_id: str
    prediction_statement: str
    target_date: Optional[datetime] = None
    impact: Optional[str] = None
    confidence_score: Optional[float] = 0.0
    assumptions: Optional[str] = None
    indicators: Optional[str] = None
    evidence_ids: Optional[str] = None
    status: Optional[str] = "active"

class PredictionCreate(PredictionBase):
    pass

class PredictionUpdate(BaseModel):
    prediction_statement: Optional[str] = None
    target_date: Optional[datetime] = None
    impact: Optional[str] = None
    confidence_score: Optional[float] = None
    assumptions: Optional[str] = None
    indicators: Optional[str] = None
    evidence_ids: Optional[str] = None
    status: Optional[str] = None

class PredictionOut(PredictionBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class PredictionUpdateBase(BaseModel):
    prediction_id: str
    update_text: str
    confidence_shift: Optional[float] = None

class PredictionUpdateCreate(PredictionUpdateBase):
    pass

class PredictionUpdateOut(PredictionUpdateBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class PredictionOutcomeBase(BaseModel):
    prediction_id: str
    resolution: str
    accuracy_score: Optional[float] = None
    lessons_learned: Optional[str] = None

class PredictionOutcomeCreate(PredictionOutcomeBase):
    pass

class PredictionOutcomeOut(PredictionOutcomeBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class AgentDebateBase(BaseModel):
    topic: str
    trend_id: Optional[str] = None
    status: Optional[str] = "active"
    messages: Optional[str] = None
    consensus_summary: Optional[str] = None
    confidence_delta: Optional[float] = None

class AgentDebateOut(AgentDebateBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class AgentDebateCreate(AgentDebateBase):
    pass

# ==========================================
# Phase 5: Production & Graph Schemas
# ==========================================

class KGNodeBase(BaseModel):
    label: str
    node_type: str
    summary: Optional[str] = None
    confidence_score: Optional[float] = 1.0
    evidence_ids: Optional[str] = None
    properties: Optional[str] = None

class KGNodeCreate(KGNodeBase):
    pass

class KGNodeUpdate(BaseModel):
    label: Optional[str] = None
    summary: Optional[str] = None
    confidence_score: Optional[float] = None
    evidence_ids: Optional[str] = None
    properties: Optional[str] = None

class KGNodeOut(KGNodeBase):
    entity_id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class KGEdgeBase(BaseModel):
    source_id: str
    target_id: str
    relationship_type: str
    confidence_score: Optional[float] = 1.0
    evidence_ids: Optional[str] = None
    properties: Optional[str] = None

class KGEdgeCreate(KGEdgeBase):
    pass

class KGEdgeUpdate(BaseModel):
    relationship_type: Optional[str] = None
    confidence_score: Optional[float] = None
    evidence_ids: Optional[str] = None
    properties: Optional[str] = None

class KGEdgeOut(KGEdgeBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True


class KnowledgeGraphBuildResponse(BaseModel):
    trend_id: str
    nodes_created: int
    edges_created: int
    node_ids: List[str]
    edge_ids: List[str]


class KnowledgeGraphNeighborhood(BaseModel):
    center_entity_id: str
    depth: int
    nodes: List[KGNodeOut]
    edges: List[KGEdgeOut]

class AuditEventBase(BaseModel):
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None

class AuditEventCreate(AuditEventBase):
    pass

class AuditEventOut(AuditEventBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class EmbeddingBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    entity_type: str
    entity_id: str
    model_name: str
    text_content: Optional[str] = None
    vector_data: str
    metadata_json: Optional[str] = None

class EmbeddingCreate(EmbeddingBase):
    pass

class EmbeddingOut(EmbeddingBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    entity_types: Optional[List[str]] = None
    filters: Optional[dict] = None
    limit: int = Field(10, ge=1, le=50)


class SemanticSearchResult(BaseModel):
    entity_type: str
    entity_id: str
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    evidence_snippet: str
    metadata: dict = Field(default_factory=dict)


class SemanticSearchResponse(BaseModel):
    results: List[SemanticSearchResult]

class DataExportBase(BaseModel):
    operation_type: str
    entity_type: str
    status: Optional[str] = "pending"
    file_url: Optional[str] = None
    error_message: Optional[str] = None

class DataExportCreate(DataExportBase):
    pass

class DataExportOut(DataExportBase):
    id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class DataExportResponse(BaseModel):
    export: DataExportOut
    payload: dict[str, Any]


class SourceImportItem(SourceBase):
    credibility_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    freshness_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    status: Optional[str] = None
    notes: Optional[str] = None


class SourceImportRequest(BaseModel):
    sources: List[SourceImportItem]


class DocumentImportItem(DocumentBase):
    published_at: Optional[datetime] = None


class DocumentImportRequest(BaseModel):
    documents: List[DocumentImportItem]


class DataImportResponse(BaseModel):
    import_record: DataExportOut
    imported_count: int
    entity_ids: List[str]
    message: Optional[str] = None
    errors: List[str] = Field(default_factory=list)

class HealthCheckBase(BaseModel):
    component: str
    status: str
    latency_ms: Optional[float] = None
    details: Optional[str] = None

class HealthCheckCreate(HealthCheckBase):
    pass

class HealthCheckOut(HealthCheckBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True


class DataHealthIssue(BaseModel):
    severity: str
    entity_type: str
    entity_id: Optional[str] = None
    message: str


class DataHealthSummary(BaseModel):
    status: str
    checks_run: int
    issue_count: int
    issues: List[DataHealthIssue]
    latest_checks: List[HealthCheckOut]


class SourceReliabilityResponse(BaseModel):
    source_id: str
    reliability_score: float = Field(..., ge=0.0, le=1.0)
    credibility_score: float = Field(..., ge=0.0, le=1.0)
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    freshness_score: float = Field(..., ge=0.0, le=1.0)
    evidence_count: int
    document_count: int
    rationale: List[str]


class ForecastCalibrationResponse(BaseModel):
    prediction_id: Optional[str] = None
    evaluated_predictions: int
    average_confidence: float = Field(..., ge=0.0, le=1.0)
    average_accuracy: float = Field(..., ge=0.0, le=1.0)
    calibration_error: float = Field(..., ge=0.0, le=1.0)
    recommendation: str

class InsightSummaryOut(BaseModel):
    id: str
    industry_profile_id: str
    generated_at: str
    ai_summary: str
    key_trends: List[TrendOut]
    watch_items: List[TrendOut]
    emerging_risks: List[TrendOut]
    opportunities: List[TrendOut]
