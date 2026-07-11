import re

with open('trendmap_api/models.py', 'r') as f:
    content = f.read()

# Make models singular
singular_map = {
    'AgentActivities': 'AgentActivity',
    'AgentDebates': 'AgentDebate',
    'Alerts': 'Alert',
    'Assumptions': 'Assumption',
    'AuditEvents': 'AuditEvent',
    'ChangeEvents': 'ChangeEvent',
    'DataExports': 'DataExport',
    'DecisionBriefs': 'DecisionBrief',
    'Documents': 'Document',
    'Embeddings': 'Embedding',
    'EvidenceLinks': 'EvidenceLink',
    'HealthChecks': 'HealthCheck',
    'Industries': 'Industry',
    'KgEdges': 'KgEdge',
    'KgNodes': 'KgNode',
    'LeadingIndicators': 'LeadingIndicator',
    'MonitoringRules': 'MonitoringRule',
    'MonitoringRuns': 'MonitoringRun',
    'PredictionOutcomes': 'PredictionOutcome',
    'PredictionUpdates': 'PredictionUpdate',
    'Predictions': 'Prediction',
    'RoadmapItems': 'RoadmapItem',
    'Scenarios': 'Scenario',
    'Signals': 'Signal',
    'SourceSnapshots': 'SourceSnapshot',
    'Sources': 'Source',
    'StrategicContexts': 'StrategicContext',
    'StrategicImplications': 'StrategicImplication',
    'StrategicOptions': 'StrategicOption',
    'TrendScoreChanges': 'TrendScoreChange',
    'TrendScoreSnapshots': 'TrendScoreSnapshot',
    'Trends': 'Trend',
    'WhatChangedSummaries': 'WhatChangedSummary'
}

for plural, singular in singular_map.items():
    content = re.sub(rf'\b{plural}\b', singular, content)

with open('trendmap_api/models.py', 'w') as f:
    f.write(content)

print("Models singularized.")
