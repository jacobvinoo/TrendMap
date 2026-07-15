from rest_framework import serializers
from .models import Industry, Source, Document, Signal, Trend, TrendTheme, ExtractionRun, NewsScanRun, NewsSnippet, AgentActivity, AgentDebate, Alert, Assumption, AuditEvent, ChangeEvent, DataExport, DecisionBrief, Embedding, EvidenceLink, HealthCheck, KgEdge, KgNode, LeadingIndicator, MonitoringRule, MonitoringRun, PredictionOutcome, PredictionUpdate, Prediction, RoadmapItem, Scenario, SourceSnapshot, StrategicContext, StrategicImplication, StrategicOption, TrendScoreChange, TrendScoreSnapshot, WhatChangedSummary, Workspace, WorkspaceMembership, Finding
import json

class JsonArrayMixin:
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in getattr(self, 'json_fields', []):
            if field in data and data[field]:
                try:
                    data[field] = json.loads(data[field])
                except (ValueError, TypeError):
                    data[field] = []
            elif field in data:
                data[field] = []
        return data

class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = '__all__'

class WorkspaceSerializer(serializers.ModelSerializer):
    currentUserRole = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = '__all__'

    def get_currentUserRole(self, obj):
        request = self.context.get('request')
        user_id = request.headers.get('X-TrendMap-User') if request else None
        user_id = user_id or 'user-default'
        membership = WorkspaceMembership.objects.filter(workspace=obj, user_id=user_id).first()
        if membership:
            return membership.role
        if not WorkspaceMembership.objects.filter(workspace=obj).exists():
            return 'owner'
        return None

class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    workspaceId = serializers.CharField(source='workspace_id', read_only=True)
    userId = serializers.CharField(source='user_id')

    class Meta:
        model = WorkspaceMembership
        fields = ['id', 'workspaceId', 'userId', 'role', 'created_at', 'updated_at']

class FindingSerializer(serializers.ModelSerializer):
    workspaceId = serializers.CharField(source='workspace_id', read_only=True)
    sourceId = serializers.CharField(source='source_id', read_only=True)
    documentId = serializers.CharField(source='document_id', read_only=True)
    signalId = serializers.CharField(source='signal_id', read_only=True)
    trendId = serializers.CharField(source='trend_id', read_only=True)
    metadata = serializers.JSONField(source='metadata_json', required=False)

    class Meta:
        model = Finding
        fields = '__all__'

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = '__all__'

class NewsScanRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsScanRun
        fields = '__all__'

class NewsSnippetSerializer(serializers.ModelSerializer):
    sourceId = serializers.CharField(source='source_id', read_only=True)
    runId = serializers.CharField(source='run_id', read_only=True)

    class Meta:
        model = NewsSnippet
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    extracted_signal_ids = serializers.SerializerMethodField()
    ingestion_status = serializers.CharField(source='status', required=False, allow_null=True)
    published_date = serializers.DateTimeField(source='published_at', required=False, allow_null=True)
    sourceId = serializers.CharField(source='source_id', read_only=True)
    extractionRunId = serializers.CharField(source='extraction_run_id', read_only=True)
    source = serializers.PrimaryKeyRelatedField(queryset=Source.objects.all(), required=False, write_only=True)
    source_id = serializers.PrimaryKeyRelatedField(source='source', queryset=Source.objects.all(), required=False, write_only=True)

    class Meta:
        model = Document
        fields = ['id', 'source', 'source_id', 'sourceId', 'extractionRunId', 'title', 'content', 'url', 'ingestion_status', 'published_date', 'extracted_signal_ids', 'created_at']

    def validate(self, attrs):
        if not attrs.get('source') and not getattr(self.instance, 'source_id', None):
            raise serializers.ValidationError({'source': 'A source is required.'})
        return attrs

    def get_extracted_signal_ids(self, obj):
        # The old view returned extracted_signal_ids as a list of IDs.
        return list(obj.signal_set.values_list('id', flat=True))

class SignalSerializer(serializers.ModelSerializer):
    document_id = serializers.PrimaryKeyRelatedField(source='document', read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(source='source', read_only=True)
    extractionRunId = serializers.CharField(source='extraction_run_id', read_only=True)

    class Meta:
        model = Signal
        fields = '__all__'

class TrendSerializer(serializers.ModelSerializer):
    extractionRunId = serializers.CharField(source='extraction_run_id', read_only=True)

    class Meta:
        model = Trend
        fields = '__all__'

class TrendThemeSerializer(serializers.ModelSerializer):
    industryId = serializers.CharField(source='industry_id', read_only=True)
    industry_id = serializers.PrimaryKeyRelatedField(source='industry', queryset=Industry.objects.all(), required=False, allow_null=True, write_only=True)

    class Meta:
        model = TrendTheme
        fields = ['id', 'industry', 'industry_id', 'industryId', 'name', 'description', 'keywords', 'aliases', 'status', 'origin', 'evidence_summary', 'created_at', 'updated_at']
        extra_kwargs = {'industry': {'write_only': True, 'required': False, 'allow_null': True}}

class ExtractionRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractionRun
        fields = '__all__'

class AgentActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentActivity
        fields = '__all__'

class AgentDebateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentDebate
        fields = '__all__'

class AlertSerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['related_signal_ids', 'related_document_ids', 'related_source_ids']
    class Meta:
        model = Alert
        fields = '__all__'

class AssumptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assumption
        fields = '__all__'

class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = '__all__'

class ChangeEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeEvent
        fields = '__all__'

class DataExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataExport
        fields = '__all__'

class DecisionBriefSerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['top_opportunities', 'top_threats', 'recommended_options', 'assumptions_to_test', 'indicators_to_monitor', 'evidence_ids']
    class Meta:
        model = DecisionBrief
        fields = '__all__'

class EmbeddingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Embedding
        fields = '__all__'

class EvidenceLinkSerializer(serializers.ModelSerializer):
    extractionRunId = serializers.CharField(source='extraction_run_id', read_only=True)

    class Meta:
        model = EvidenceLink
        fields = '__all__'

class HealthCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthCheck
        fields = '__all__'

class KgEdgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = KgEdge
        fields = '__all__'

class KgNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = KgNode
        fields = '__all__'

class LeadingIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadingIndicator
        fields = '__all__'

class MonitoringRuleSerializer(JsonArrayMixin, serializers.ModelSerializer):
    sourceId = serializers.PrimaryKeyRelatedField(source='source', read_only=True)
    json_fields = ['keywords', 'include_patterns', 'exclude_patterns']
    class Meta:
        model = MonitoringRule
        fields = '__all__'

class MonitoringRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoringRun
        fields = '__all__'

class PredictionOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionOutcome
        fields = '__all__'

class PredictionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionUpdate
        fields = '__all__'

class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = '__all__'

class RoadmapItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapItem
        fields = '__all__'

class ScenarioSerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['trigger_conditions', 'assumptions', 'implications', 'early_warning_indicators']
    class Meta:
        model = Scenario
        fields = '__all__'

class SourceSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourceSnapshot
        fields = '__all__'

class StrategicContextSerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['target_customers', 'strategic_goals', 'current_capabilities', 'constraints', 'planning_horizons']
    class Meta:
        model = StrategicContext
        fields = '__all__'

class StrategicImplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StrategicImplication
        fields = '__all__'

class StrategicOptionSerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['linked_trend_ids', 'linked_scenario_ids', 'linked_assumption_ids', 'expected_benefits', 'key_risks', 'required_capabilities']
    class Meta:
        model = StrategicOption
        fields = '__all__'

class TrendScoreChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendScoreChange
        fields = '__all__'

class TrendScoreSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendScoreSnapshot
        fields = '__all__'

class WhatChangedSummarySerializer(JsonArrayMixin, serializers.ModelSerializer):
    json_fields = ['new_signals', 'changed_trends', 'new_candidate_trends', 'alerts', 'recommended_actions']
    class Meta:
        model = WhatChangedSummary
        fields = '__all__'
