import re

def camel_to_kebab(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

with open('trendmap_api/tests.py', 'r') as f:
    content = f.read()

# Replace url = '/api/modelnames' with hyphenated ones
def replacement(match):
    model_lower = match.group(1)
    # To find the real camelCase model name, we might just have to do it roughly
    # Actually, it's easier to just read the model names from models.py
    return match.group(0)

# Better yet, since we have singular_map or remaining_models from generate_all,
# we know what the model names were.
remaining_models = [
    'AgentActivity', 'AgentDebate', 'Alert', 'Assumption', 'AuditEvent',
    'ChangeEvent', 'DataExport', 'DecisionBrief', 'Embedding', 'EvidenceLink',
    'HealthCheck', 'KgEdge', 'KgNode', 'LeadingIndicator', 'MonitoringRule',
    'MonitoringRun', 'PredictionOutcome', 'PredictionUpdate', 'Prediction',
    'RoadmapItem', 'Scenario', 'SourceSnapshot', 'StrategicContext',
    'StrategicImplication', 'StrategicOption', 'TrendScoreChange',
    'TrendScoreSnapshot', 'WhatChangedSummary'
]

for model in remaining_models:
    lower_name = model.lower() + "s"
    kebab_name = camel_to_kebab(model) + "s"
    
    content = content.replace(f"url = '/api/{lower_name}'", f"url = '/api/{kebab_name}'")

with open('trendmap_api/tests.py', 'w') as f:
    f.write(content)

print("Tests fixed.")
