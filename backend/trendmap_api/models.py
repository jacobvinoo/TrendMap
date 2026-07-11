import uuid
# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AgentActivity(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    agent_role = models.CharField(max_length=255)
    task_type = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    related_entity_id = models.CharField(max_length=255, blank=True, null=True)
    class Meta:
        db_table = 'agent_activities'


class AgentDebate(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    topic = models.CharField(max_length=255)
    trend = models.ForeignKey('Trend', models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    messages = models.TextField(blank=True, null=True)
    consensus_summary = models.TextField(blank=True, null=True)
    confidence_delta = models.FloatField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'agent_debates'




class Alert(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING, blank=True, null=True)
    alert_type = models.CharField(max_length=255)
    severity = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    acknowledged = models.CharField(max_length=255, blank=True, null=True)
    related_signal_ids = models.TextField(blank=True, null=True)
    related_document_ids = models.TextField(blank=True, null=True)
    related_source_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'alerts'


class Assumption(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    statement = models.CharField(max_length=255)
    assumption_type = models.CharField(max_length=255)
    confidence_score = models.FloatField(blank=True, null=True)
    importance_score = models.TextField(blank=True, null=True)  # This field type is a guess.
    status = models.CharField(max_length=255, blank=True, null=True)
    related_signal_ids = models.TextField(blank=True, null=True)
    related_indicator_ids = models.TextField(blank=True, null=True)
    evidence_summary = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'assumptions'


class AuditEvent(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=255, blank=True, null=True)
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'audit_events'














class ChangeEvent(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    document = models.ForeignKey('Document', models.DO_NOTHING, blank=True, null=True)
    change_type = models.CharField(max_length=255)
    detected_at = models.DateTimeField(blank=True, null=True)
    previous_snapshot = models.ForeignKey('SourceSnapshot', models.DO_NOTHING, blank=True, null=True)
    current_snapshot = models.ForeignKey('SourceSnapshot', models.DO_NOTHING, related_name='changeevents_current_snapshot_set')
    summary = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'change_events'


class DataExport(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    operation_type = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=255)
    status = models.CharField(max_length=255, blank=True, null=True)
    file_url = models.CharField(max_length=255, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'data_exports'


class DecisionBrief(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    strategic_context = models.ForeignKey('StrategicContext', models.DO_NOTHING, blank=True, null=True)
    generated_at = models.DateTimeField(blank=True, null=True)
    headline = models.CharField(max_length=255, blank=True, null=True)
    executive_summary = models.TextField(blank=True, null=True)
    top_opportunities = models.TextField(blank=True, null=True)
    top_threats = models.TextField(blank=True, null=True)
    recommended_options = models.TextField(blank=True, null=True)
    assumptions_to_test = models.TextField(blank=True, null=True)
    indicators_to_monitor = models.TextField(blank=True, null=True)
    evidence_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'decision_briefs'










class Document(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    extraction_run = models.ForeignKey('ExtractionRun', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    status = models.CharField(max_length=255, blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'documents'


class ExtractionRun(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    industry = models.ForeignKey('Industry', models.DO_NOTHING, blank=True, null=True)
    stage = models.CharField(max_length=255)
    status = models.CharField(max_length=255, blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    error_summary = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'extraction_runs'


class Embedding(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=255)
    model_name = models.CharField(max_length=255)
    text_content = models.TextField(blank=True, null=True)
    vector_data = models.TextField()
    metadata_json = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'embeddings'


class EvidenceLink(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    signal = models.ForeignKey('Signal', models.DO_NOTHING)
    document = models.ForeignKey(Document, models.DO_NOTHING, blank=True, null=True)
    source = models.ForeignKey('Source', models.DO_NOTHING, blank=True, null=True)
    extraction_run = models.ForeignKey(ExtractionRun, models.DO_NOTHING, blank=True, null=True)
    relationship_type = models.CharField(max_length=255)
    quote = models.TextField(blank=True, null=True)
    relevance_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'evidence_links'


class HealthCheck(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    component = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    latency_ms = models.FloatField(blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'health_checks'


class Industry(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    geography = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    strategic_priorities = models.JSONField(blank=True, null=True, default=list)
    customer_segments = models.JSONField(blank=True, null=True, default=list)
    competitors = models.JSONField(blank=True, null=True, default=list)
    time_horizons = models.JSONField(blank=True, null=True, default=list)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'industries'


class KgEdge(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    source = models.ForeignKey('KgNode', models.DO_NOTHING)
    target = models.ForeignKey('KgNode', models.DO_NOTHING, related_name='kgedges_target_set')
    relationship_type = models.CharField(max_length=255)
    confidence_score = models.FloatField(blank=True, null=True)
    evidence_ids = models.TextField(blank=True, null=True)
    properties = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'kg_edges'


class KgNode(models.Model):
    entity_id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    node_type = models.CharField(max_length=255)
    confidence_score = models.FloatField(blank=True, null=True)
    evidence_ids = models.TextField(blank=True, null=True)
    properties = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'kg_nodes'


class LeadingIndicator(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    assumption = models.ForeignKey(Assumption, models.DO_NOTHING)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    indicator_type = models.CharField(max_length=255, blank=True, null=True)
    current_status = models.CharField(max_length=255, blank=True, null=True)
    threshold = models.CharField(max_length=255, blank=True, null=True)
    monitoring_question = models.CharField(max_length=255, blank=True, null=True)
    related_source_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'leading_indicators'


class MonitoringRule(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    industry_profile_id = models.CharField(max_length=255)
    frequency = models.CharField(max_length=255, blank=True, null=True)
    enabled = models.CharField(max_length=255, blank=True, null=True)
    keywords = models.TextField(blank=True, null=True)
    include_patterns = models.TextField(blank=True, null=True)
    exclude_patterns = models.TextField(blank=True, null=True)
    last_run_at = models.DateTimeField(blank=True, null=True)
    next_run_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'monitoring_rules'


class MonitoringRun(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    rule = models.ForeignKey(MonitoringRule, models.DO_NOTHING)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    documents_scanned = models.FloatField(blank=True, null=True)
    new_documents_found = models.FloatField(blank=True, null=True)
    updated_documents_found = models.FloatField(blank=True, null=True)
    new_signals_found = models.FloatField(blank=True, null=True)
    affected_trend_ids = models.TextField(blank=True, null=True)
    alert_ids = models.TextField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'monitoring_runs'


class PredictionOutcome(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    prediction = models.ForeignKey('Prediction', models.DO_NOTHING)
    resolution = models.CharField(max_length=255)
    accuracy_score = models.FloatField(blank=True, null=True)
    lessons_learned = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'prediction_outcomes'


class PredictionUpdate(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    prediction = models.ForeignKey('Prediction', models.DO_NOTHING)
    update_text = models.CharField(max_length=255)
    confidence_shift = models.TextField(blank=True, null=True)  # This field type is a guess.
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'prediction_updates'


class Prediction(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    prediction_statement = models.CharField(max_length=255)
    target_date = models.DateTimeField(blank=True, null=True)
    impact = models.CharField(max_length=255, blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    assumptions = models.TextField(blank=True, null=True)
    indicators = models.TextField(blank=True, null=True)
    evidence_ids = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'predictions'


class RoadmapItem(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    strategic_option = models.ForeignKey('StrategicOption', models.DO_NOTHING)
    title = models.CharField(max_length=255)
    horizon = models.CharField(max_length=255, blank=True, null=True)
    owner = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    success_metric = models.CharField(max_length=255, blank=True, null=True)
    linked_indicator_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'roadmap_items'


class Scenario(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    horizon = models.CharField(max_length=255, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    scenario_type = models.CharField(max_length=255)
    trigger_conditions = models.TextField(blank=True, null=True)
    assumptions = models.TextField(blank=True, null=True)
    implications = models.TextField(blank=True, null=True)
    probability_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    early_warning_indicators = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'scenarios'


class Signal(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, models.DO_NOTHING)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    extraction_run = models.ForeignKey(ExtractionRun, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    signal_type = models.CharField(max_length=255, blank=True, null=True)
    pestle_category = models.CharField(max_length=255, blank=True, null=True)
    novelty_score = models.FloatField(blank=True, null=True)
    strength_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    evidence_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'signals'


class SourceSnapshot(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    source = models.ForeignKey('Source', models.DO_NOTHING)
    captured_at = models.DateTimeField(blank=True, null=True)
    document_fingerprints = models.TextField(blank=True, null=True)
    raw_metadata = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'source_snapshots'


class Source(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    url = models.CharField(max_length=255)
    source_type = models.CharField(max_length=255, blank=True, null=True)
    credibility_score = models.FloatField(blank=True, null=True)
    relevance_score = models.FloatField(blank=True, null=True)
    freshness_score = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'sources'


class NewsScanRun(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    industry = models.ForeignKey('Industry', models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    query = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    scanned_count = models.FloatField(blank=True, null=True)
    matched_count = models.FloatField(blank=True, null=True)
    created_source_count = models.FloatField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    error_summary = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_scan_runs'


class NewsSnippet(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(NewsScanRun, models.DO_NOTHING, blank=True, null=True)
    source = models.ForeignKey(Source, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=500, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    publisher_url = models.CharField(max_length=500, blank=True, null=True)
    snippet = models.TextField(blank=True, null=True)
    relevance_score = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'news_snippets'


class StrategicContext(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    industry_profile_id = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    business_model = models.CharField(max_length=255, blank=True, null=True)
    target_customers = models.TextField(blank=True, null=True)
    strategic_goals = models.TextField(blank=True, null=True)
    current_capabilities = models.TextField(blank=True, null=True)
    constraints = models.TextField(blank=True, null=True)
    risk_appetite = models.CharField(max_length=255, blank=True, null=True)
    planning_horizons = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'strategic_contexts'


class StrategicImplication(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    implication_type = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    affected_capabilities = models.TextField(blank=True, null=True)
    affected_customer_segments = models.TextField(blank=True, null=True)
    urgency_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    evidence_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'strategic_implications'


class StrategicOption(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    option_type = models.CharField(max_length=255, blank=True, null=True)
    linked_trend_ids = models.TextField(blank=True, null=True)
    linked_scenario_ids = models.TextField(blank=True, null=True)
    linked_assumption_ids = models.TextField(blank=True, null=True)
    expected_benefits = models.TextField(blank=True, null=True)
    key_risks = models.TextField(blank=True, null=True)
    required_capabilities = models.TextField(blank=True, null=True)
    estimated_effort = models.CharField(max_length=255, blank=True, null=True)
    time_to_value = models.CharField(max_length=255, blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    feasibility_score = models.FloatField(blank=True, null=True)
    urgency_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    priority_score = models.FloatField(blank=True, null=True)
    recommended_next_step = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    class Meta:
        db_table = 'strategic_options'


class TrendScoreChange(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    previous_snapshot = models.ForeignKey('TrendScoreSnapshot', models.DO_NOTHING)
    current_snapshot = models.ForeignKey('TrendScoreSnapshot', models.DO_NOTHING, related_name='trendscorechanges_current_snapshot_set')
    changed_at = models.DateTimeField(blank=True, null=True)
    applied_at = models.DateTimeField(blank=True, null=True)
    likelihood_delta = models.FloatField(blank=True, null=True)
    confidence_delta = models.FloatField(blank=True, null=True)
    impact_delta = models.FloatField(blank=True, null=True)
    new_confidence_score = models.FloatField(blank=True, null=True)
    new_momentum_score = models.FloatField(blank=True, null=True)
    new_impact_score = models.FloatField(blank=True, null=True)
    primary_reason = models.CharField(max_length=255, blank=True, null=True)
    horizon_changed = models.CharField(max_length=255, blank=True, null=True)
    maturity_changed = models.CharField(max_length=255, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    related_signal_ids = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'trend_score_changes'


class TrendScoreSnapshot(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    trend = models.ForeignKey('Trend', models.DO_NOTHING)
    captured_at = models.DateTimeField(blank=True, null=True)
    likelihood_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    momentum_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    horizon = models.CharField(max_length=255, blank=True, null=True)
    maturity_stage = models.CharField(max_length=255, blank=True, null=True)
    evidence_count = models.FloatField(blank=True, null=True)
    signal_count = models.FloatField(blank=True, null=True)
    source_diversity = models.FloatField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'trend_score_snapshots'


class Trend(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    extraction_run = models.ForeignKey(ExtractionRun, models.DO_NOTHING, blank=True, null=True)
    name = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    horizon = models.CharField(max_length=255, blank=True, null=True)
    likelihood_score = models.FloatField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    maturity_stage = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    related_signal_ids = models.JSONField(blank=True, null=True, default=list)
    drivers = models.JSONField(blank=True, null=True, default=list)
    blockers = models.JSONField(blank=True, null=True, default=list)
    what_needs_to_be_true = models.JSONField(blank=True, null=True, default=list)
    leading_indicators = models.JSONField(blank=True, null=True, default=list)
    monitoring_questions = models.JSONField(blank=True, null=True, default=list)
    recommended_actions = models.JSONField(blank=True, null=True, default=list)
    class Meta:
        db_table = 'trends'


class TrendTheme(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    industry = models.ForeignKey(Industry, models.DO_NOTHING, blank=True, null=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    keywords = models.JSONField(blank=True, null=True, default=list)
    status = models.CharField(max_length=255, blank=True, null=True)
    origin = models.CharField(max_length=255, blank=True, null=True)
    evidence_summary = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = 'trend_themes'


class WhatChangedSummary(models.Model):
    id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
    monitoring_run = models.ForeignKey(MonitoringRun, models.DO_NOTHING, blank=True, null=True)
    generated_at = models.DateTimeField(blank=True, null=True)
    headline = models.CharField(max_length=255)
    new_signals = models.TextField(blank=True, null=True)
    changed_trends = models.TextField(blank=True, null=True)
    new_candidate_trends = models.TextField(blank=True, null=True)
    alerts = models.TextField(blank=True, null=True)
    recommended_actions = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'what_changed_summaries'
