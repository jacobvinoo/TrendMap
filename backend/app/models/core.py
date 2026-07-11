import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

import enum
from sqlalchemy import CheckConstraint, Enum

class SourceStatus(str, enum.Enum):
    suggested = "suggested"
    approved = "approved"
    rejected = "rejected"

class DocumentStatus(str, enum.Enum):
    raw = "raw"
    processed = "processed"
    extracted = "extracted"
    error = "error"

class TrendStatus(str, enum.Enum):
    candidate = "candidate"
    approved = "approved"
    rejected = "rejected"
    needs_review = "needs_review"

class RelationshipType(str, enum.Enum):
    supports = "supports"
    contradicts = "contradicts"
    neutral = "neutral"


def generate_uuid():
    return str(uuid.uuid4())

class Industry(Base):
    __tablename__ = "industries"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    geography = Column(String)
    description = Column(Text)
    strategic_priorities = Column(JSON) # JSON array
    customer_segments = Column(JSON) # JSON array
    competitors = Column(JSON) # JSON array
    time_horizons = Column(JSON) # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Source(Base):
    __tablename__ = "sources"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    source_type = Column(String)
    credibility_score = Column(Float, CheckConstraint("credibility_score >= 0.0 AND credibility_score <= 1.0"), default=0.0)
    relevance_score = Column(Float, CheckConstraint("relevance_score >= 0.0 AND relevance_score <= 1.0"), default=0.0)
    freshness_score = Column(Float, CheckConstraint("freshness_score >= 0.0 AND freshness_score <= 1.0"), default=0.0)
    status = Column(Enum(SourceStatus), default=SourceStatus.suggested)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    documents = relationship("Document", back_populates="source", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    title = Column(String, nullable=False)
    url = Column(String)
    content = Column(Text, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.raw)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    source = relationship("Source", back_populates="documents")
    signals = relationship("Signal", back_populates="document", cascade="all, delete-orphan")

class Signal(Base):
    __tablename__ = "signals"
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text)
    signal_type = Column(String)
    pestle_category = Column(String)
    novelty_score = Column(Float, CheckConstraint("novelty_score >= 0.0 AND novelty_score <= 1.0"), default=0.0)
    strength_score = Column(Float, CheckConstraint("strength_score >= 0.0 AND strength_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    evidence_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="signals")

class Trend(Base):
    __tablename__ = "trends"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    summary = Column(Text)
    status = Column(Enum(TrendStatus), default=TrendStatus.candidate)
    horizon = Column(String)
    likelihood_score = Column(Float, CheckConstraint("likelihood_score >= 0.0 AND likelihood_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    impact_score = Column(Float, CheckConstraint("impact_score >= 0.0 AND impact_score <= 1.0"), default=0.0)
    maturity_stage = Column(String)
    related_signal_ids = Column(JSON) # JSON array
    drivers = Column(JSON) # JSON array
    blockers = Column(JSON) # JSON array
    what_needs_to_be_true = Column(JSON) # JSON array
    leading_indicators = Column(JSON) # JSON array
    monitoring_questions = Column(JSON) # JSON array
    recommended_actions = Column(JSON) # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    evidence_links = relationship("EvidenceLink", back_populates="trend", cascade="all, delete-orphan")

class EvidenceLink(Base):
    __tablename__ = "evidence_links"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    signal_id = Column(String, ForeignKey("signals.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"))
    source_id = Column(String, ForeignKey("sources.id"))
    relationship_type = Column(Enum(RelationshipType), nullable=False)
    quote = Column(Text)
    relevance_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trend = relationship("Trend", back_populates="evidence_links")
    signal = relationship("Signal")

# ==========================================
# Phase 2: Monitoring Models
# ==========================================

class MonitoringRule(Base):
    __tablename__ = "monitoring_rules"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    industry_profile_id = Column(String, nullable=False)
    frequency = Column(String, default="daily") # daily, weekly, monthly, manual
    enabled = Column(String, default="true") # boolean stored as string or boolean
    keywords = Column(Text) # JSON string array
    include_patterns = Column(Text) # JSON string array
    exclude_patterns = Column(Text) # JSON string array
    last_run_at = Column(DateTime)
    next_run_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MonitoringRun(Base):
    __tablename__ = "monitoring_runs"
    id = Column(String, primary_key=True, default=generate_uuid)
    rule_id = Column(String, ForeignKey("monitoring_rules.id"), nullable=False)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    status = Column(String, default="pending")
    documents_scanned = Column(Float, default=0.0) # Using float to match standard sqlite types if needed, or Integer
    new_documents_found = Column(Float, default=0.0)
    updated_documents_found = Column(Float, default=0.0)
    new_signals_found = Column(Float, default=0.0)
    affected_trend_ids = Column(Text) # JSON array
    alert_ids = Column(Text) # JSON array
    error_message = Column(Text)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"))
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(String, default="false")
    related_signal_ids = Column(Text) # JSON array
    related_document_ids = Column(Text) # JSON array
    related_source_ids = Column(Text) # JSON array

class WhatChangedSummary(Base):
    __tablename__ = "what_changed_summaries"
    id = Column(String, primary_key=True, default=generate_uuid)
    monitoring_run_id = Column(String, ForeignKey("monitoring_runs.id"))
    generated_at = Column(DateTime, default=datetime.utcnow)
    headline = Column(String, nullable=False)
    new_signals = Column(Text) # JSON array
    changed_trends = Column(Text) # JSON array
    new_candidate_trends = Column(Text) # JSON array
    alerts = Column(Text) # JSON array
    recommended_actions = Column(Text) # JSON array

# ==========================================
# Phase 2: Snapshot & Score History Models
# ==========================================

class SourceSnapshot(Base):
    __tablename__ = "source_snapshots"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    document_fingerprints = Column(Text)  # JSON array of DocumentFingerprint objects
    raw_metadata = Column(Text)  # JSON blob

class ChangeEvent(Base):
    __tablename__ = "change_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"))
    change_type = Column(String, nullable=False)  # new_document | updated_document | removed_document | metadata_change
    detected_at = Column(DateTime, default=datetime.utcnow)
    previous_snapshot_id = Column(String, ForeignKey("source_snapshots.id"))
    current_snapshot_id = Column(String, ForeignKey("source_snapshots.id"), nullable=False)
    summary = Column(Text)

class TrendScoreSnapshot(Base):
    __tablename__ = "trend_score_snapshots"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    likelihood_score = Column(Float, CheckConstraint("likelihood_score >= 0.0 AND likelihood_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    momentum_score = Column(Float)
    impact_score = Column(Float, CheckConstraint("impact_score >= 0.0 AND impact_score <= 1.0"), default=0.0)
    horizon = Column(String)
    maturity_stage = Column(String)
    evidence_count = Column(Float, default=0.0)
    signal_count = Column(Float, default=0.0)
    source_diversity = Column(Float, default=0.0)
    reason = Column(Text)

class TrendScoreChange(Base):
    __tablename__ = "trend_score_changes"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    previous_snapshot_id = Column(String, ForeignKey("trend_score_snapshots.id"), nullable=False)
    current_snapshot_id = Column(String, ForeignKey("trend_score_snapshots.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    applied_at = Column(DateTime)
    likelihood_delta = Column(Float, default=0.0)
    confidence_delta = Column(Float, default=0.0)
    impact_delta = Column(Float, default=0.0)
    new_confidence_score = Column(Float)
    new_momentum_score = Column(Float)
    new_impact_score = Column(Float)
    primary_reason = Column(String)
    horizon_changed = Column(String, default="false")
    maturity_changed = Column(String, default="false")
    reason = Column(Text)
    related_signal_ids = Column(Text)  # JSON array

# ==========================================
# Phase 3: Strategy Models
# ==========================================

class StrategicContext(Base):
    __tablename__ = "strategic_contexts"
    id = Column(String, primary_key=True, default=generate_uuid)
    industry_profile_id = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    business_model = Column(String)
    target_customers = Column(Text)
    strategic_goals = Column(Text)
    current_capabilities = Column(Text)
    constraints = Column(Text)
    risk_appetite = Column(String)
    planning_horizons = Column(Text)

class Assumption(Base):
    __tablename__ = "assumptions"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    statement = Column(String, nullable=False)
    assumption_type = Column(String, nullable=False)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    importance_score = Column(Float, CheckConstraint("importance_score >= 0.0 AND importance_score <= 1.0"), default=0.0)
    status = Column(String, default="untested")
    related_signal_ids = Column(Text)
    related_indicator_ids = Column(Text)
    evidence_summary = Column(Text)

class LeadingIndicator(Base):
    __tablename__ = "leading_indicators"
    id = Column(String, primary_key=True, default=generate_uuid)
    assumption_id = Column(String, ForeignKey("assumptions.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    indicator_type = Column(String)
    current_status = Column(String)
    threshold = Column(String)
    monitoring_question = Column(String)
    related_source_ids = Column(Text)

class StrategicImplication(Base):
    __tablename__ = "strategic_implications"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    implication_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text)
    affected_capabilities = Column(Text)
    affected_customer_segments = Column(Text)
    urgency_score = Column(Float, CheckConstraint("urgency_score >= 0.0 AND urgency_score <= 1.0"), default=0.0)
    impact_score = Column(Float, CheckConstraint("impact_score >= 0.0 AND impact_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    evidence_ids = Column(Text)

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    horizon = Column(String)
    summary = Column(Text)
    scenario_type = Column(String, nullable=False)
    trigger_conditions = Column(Text)
    assumptions = Column(Text)
    implications = Column(Text)
    probability_score = Column(Float, CheckConstraint("probability_score >= 0.0 AND probability_score <= 1.0"), default=0.0)
    impact_score = Column(Float, CheckConstraint("impact_score >= 0.0 AND impact_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    early_warning_indicators = Column(Text)

class StrategicOption(Base):
    __tablename__ = "strategic_options"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    option_type = Column(String)
    linked_trend_ids = Column(Text)
    linked_scenario_ids = Column(Text)
    linked_assumption_ids = Column(Text)
    expected_benefits = Column(Text)
    key_risks = Column(Text)
    required_capabilities = Column(Text)
    estimated_effort = Column(String)
    time_to_value = Column(String)
    impact_score = Column(Float, CheckConstraint("impact_score >= 0.0 AND impact_score <= 1.0"), default=0.0)
    feasibility_score = Column(Float, CheckConstraint("feasibility_score >= 0.0 AND feasibility_score <= 1.0"), default=0.0)
    urgency_score = Column(Float, CheckConstraint("urgency_score >= 0.0 AND urgency_score <= 1.0"), default=0.0)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    priority_score = Column(Float, CheckConstraint("priority_score >= 0.0 AND priority_score <= 1.0"), default=0.0)
    recommended_next_step = Column(String)
    status = Column(String, default="proposed")

class DecisionBrief(Base):
    __tablename__ = "decision_briefs"
    id = Column(String, primary_key=True, default=generate_uuid)
    strategic_context_id = Column(String, ForeignKey("strategic_contexts.id"))
    generated_at = Column(DateTime, default=datetime.utcnow)
    headline = Column(String)
    executive_summary = Column(Text)
    top_opportunities = Column(Text)
    top_threats = Column(Text)
    recommended_options = Column(Text)
    assumptions_to_test = Column(Text)
    indicators_to_monitor = Column(Text)
    evidence_ids = Column(Text)

class RoadmapItem(Base):
    __tablename__ = "roadmap_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    strategic_option_id = Column(String, ForeignKey("strategic_options.id"), nullable=False)
    title = Column(String, nullable=False)
    horizon = Column(String)
    owner = Column(String)
    status = Column(String, default="proposed")
    success_metric = Column(String)
    linked_indicator_ids = Column(Text)

# ==========================================
# Phase 4: Multi-Agent Models
# ==========================================

class AgentActivity(Base):
    __tablename__ = "agent_activities"
    id = Column(String, primary_key=True, default=generate_uuid)
    agent_role = Column(String, nullable=False)
    task_type = Column(String)
    status = Column(String, default="running")
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    related_entity_id = Column(String)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(String, primary_key=True, default=generate_uuid)
    trend_id = Column(String, ForeignKey("trends.id"), nullable=False)
    prediction_statement = Column(String, nullable=False)
    target_date = Column(DateTime)
    impact = Column(String)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=0.0)
    assumptions = Column(Text)
    indicators = Column(Text)
    evidence_ids = Column(Text)
    status = Column(String, default="active")
    timestamp = Column(DateTime, default=datetime.utcnow)

class PredictionUpdate(Base):
    __tablename__ = "prediction_updates"
    id = Column(String, primary_key=True, default=generate_uuid)
    prediction_id = Column(String, ForeignKey("predictions.id"), nullable=False)
    update_text = Column(String, nullable=False)
    confidence_shift = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class PredictionOutcome(Base):
    __tablename__ = "prediction_outcomes"
    id = Column(String, primary_key=True, default=generate_uuid)
    prediction_id = Column(String, ForeignKey("predictions.id"), nullable=False)
    resolution = Column(String, nullable=False) # e.g. "realized", "invalidated"
    accuracy_score = Column(Float)
    lessons_learned = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AgentDebate(Base):
    __tablename__ = "agent_debates"
    id = Column(String, primary_key=True, default=generate_uuid)
    topic = Column(String, nullable=False)
    trend_id = Column(String, ForeignKey("trends.id"))
    status = Column(String, default="active")
    messages = Column(Text) # JSON array of DebateMessage objects
    consensus_summary = Column(Text)
    confidence_delta = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ==========================================
# Phase 5: Production & Graph Models
# ==========================================

class KGNode(Base):
    __tablename__ = "kg_nodes"
    entity_id = Column(String, primary_key=True, default=generate_uuid)
    label = Column(String, nullable=False)
    summary = Column(Text)
    node_type = Column(String, nullable=False)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=1.0)
    evidence_ids = Column(Text) # JSON array of ids
    properties = Column(Text) # Additional JSON properties
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class KGEdge(Base):
    __tablename__ = "kg_edges"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("kg_nodes.entity_id"), nullable=False)
    target_id = Column(String, ForeignKey("kg_nodes.entity_id"), nullable=False)
    relationship_type = Column(String, nullable=False)
    confidence_score = Column(Float, CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0"), default=1.0)
    evidence_ids = Column(Text) # JSON array of ids
    properties = Column(Text) # Additional JSON properties
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text) # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(String, primary_key=True, default=generate_uuid)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    text_content = Column(Text)
    vector_data = Column(Text, nullable=False) # JSON array of floats
    metadata_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataExport(Base):
    __tablename__ = "data_exports"
    id = Column(String, primary_key=True, default=generate_uuid)
    operation_type = Column(String, nullable=False) # export, import
    entity_type = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, processing, completed, failed
    file_url = Column(String)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

class HealthCheck(Base):
    __tablename__ = "health_checks"
    id = Column(String, primary_key=True, default=generate_uuid)
    component = Column(String, nullable=False)
    status = Column(String, nullable=False)
    latency_ms = Column(Float)
    details = Column(Text) # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)
