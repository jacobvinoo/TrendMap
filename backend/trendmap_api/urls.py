from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    health, version, csrf_token, extraction_logs, extraction_log_stream,
    clear_analysis_data, data_health, scan_news, insights_summary,
    upload_document, agent_extract, agent_discovery, agent_analyze, cluster_trend,
    WorkspaceViewSet, FindingViewSet, IndustryViewSet, SourceViewSet, DocumentViewSet,
    SignalViewSet, TrendViewSet, TrendThemeViewSet, NewsScanRunViewSet,
    NewsSnippetViewSet, AgentActivityViewSet, AgentDebateViewSet, AlertViewSet,
    AssumptionViewSet, AuditEventViewSet, ChangeEventViewSet, DataExportViewSet,
    DecisionBriefViewSet, EmbeddingViewSet, EvidenceLinkViewSet, HealthCheckViewSet,
    KgEdgeViewSet, KgNodeViewSet, LeadingIndicatorViewSet, MonitoringRuleViewSet,
    MonitoringRunViewSet, PredictionOutcomeViewSet, PredictionUpdateViewSet,
    PredictionViewSet, RoadmapItemViewSet, ScenarioViewSet, SourceSnapshotViewSet,
    StrategicContextViewSet, StrategicImplicationViewSet, StrategicOptionViewSet,
    TrendScoreChangeViewSet, TrendScoreSnapshotViewSet, WhatChangedSummaryViewSet
)

router = DefaultRouter(trailing_slash=False)
router.register(r'workspaces', WorkspaceViewSet)
router.register(r'findings', FindingViewSet)
router.register(r'industries', IndustryViewSet)
router.register(r'sources', SourceViewSet)
router.register(r'news/scans', NewsScanRunViewSet)
router.register(r'news/snippets', NewsSnippetViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'signals', SignalViewSet)
router.register(r'trends', TrendViewSet)
router.register(r'themes', TrendThemeViewSet)
router.register(r'agent/activities', AgentActivityViewSet, basename='agentactivity')
router.register(r'agent/debates', AgentDebateViewSet, basename='agentdebate')
router.register(r'alerts', AlertViewSet)
router.register(r'assumptions', AssumptionViewSet)
router.register(r'audit-events', AuditEventViewSet)
router.register(r'change-events', ChangeEventViewSet)
router.register(r'data-exports', DataExportViewSet)
router.register(r'decision-briefs', DecisionBriefViewSet)
router.register(r'embeddings', EmbeddingViewSet)
router.register(r'evidence-links', EvidenceLinkViewSet)
router.register(r'health-checks', HealthCheckViewSet)
router.register(r'knowledge/edges', KgEdgeViewSet, basename='kgedge')
router.register(r'knowledge/nodes', KgNodeViewSet, basename='kgnode')
router.register(r'leading-indicators', LeadingIndicatorViewSet)
router.register(r'monitoring-rules', MonitoringRuleViewSet)
router.register(r'monitoring-runs', MonitoringRunViewSet)
router.register(r'prediction-outcomes', PredictionOutcomeViewSet)
router.register(r'prediction-updates', PredictionUpdateViewSet)
router.register(r'predictions', PredictionViewSet)
router.register(r'roadmap-items', RoadmapItemViewSet)
router.register(r'scenarios', ScenarioViewSet)
router.register(r'source-snapshots', SourceSnapshotViewSet)
router.register(r'strategic-contexts', StrategicContextViewSet)
router.register(r'strategic-implications', StrategicImplicationViewSet)
router.register(r'strategic-options', StrategicOptionViewSet)
router.register(r'trend-score-changes', TrendScoreChangeViewSet)
router.register(r'trend-score-snapshots', TrendScoreSnapshotViewSet)
router.register(r'what-changed-summaries', WhatChangedSummaryViewSet)


urlpatterns = [
    path('health', health),
    path('api/version', version),
    path('api/csrf', csrf_token),
    path('api/logs/extraction', extraction_logs),
    path('api/logs/extraction/stream', extraction_log_stream),
    path('api/admin/clear-analysis-data', clear_analysis_data),
    path('api/admin/data-health', data_health),
    path('api/news/scan', scan_news),
    path('api/insights/summary', insights_summary),
    path('api/documents/upload', upload_document),
    path('api/agents/extract/<str:document_id>', agent_extract),
    path('api/agents/discovery/<str:industry_id>', agent_discovery),
    path('api/agents/analyze', agent_analyze),
    path('api/trends/cluster', cluster_trend),
    path('api/', include(router.urls)),
]
