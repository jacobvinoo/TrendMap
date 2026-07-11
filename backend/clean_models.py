import re

with open('trendmap_api/models.py', 'r') as f:
    content = f.read()

# Remove managed = False
content = re.sub(r'^\s*managed = False\n', '', content, flags=re.MULTILINE)
# Also remove empty Meta classes
content = re.sub(r'^\s*class Meta:\n\s*db_table = ([^\n]+)\n', r'    class Meta:\n        db_table = \1\n', content, flags=re.MULTILINE)

# Replace ID fields with proper UUIDs if they are char fields
# id = models.CharField(primary_key=True) -> id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)
content = re.sub(
    r'id = models\.CharField\(primary_key=True\)',
    r'id = models.CharField(primary_key=True, max_length=36, default=uuid.uuid4, editable=False)',
    content
)

# Convert specific JSON guessed fields
json_fields = [
    'strategic_priorities', 'customer_segments', 'competitors', 'time_horizons',
    'related_signal_ids', 'drivers', 'blockers', 'what_needs_to_be_true',
    'leading_indicators', 'monitoring_questions', 'recommended_actions',
    'assumptions', 'indicators', 'evidence_ids'
]

for jf in json_fields:
    content = re.sub(
        rf'{jf} = models\.TextField\(blank=True, null=True\).*?guess\.',
        f'{jf} = models.JSONField(blank=True, null=True, default=list)',
        content
    )

float_fields = [
    'likelihood_score', 'confidence_score', 'momentum_score', 'impact_score',
    'novelty_score', 'strength_score', 'credibility_score', 'relevance_score',
    'freshness_score', 'probability_score', 'feasibility_score', 'urgency_score',
    'priority_score', 'confidence_delta', 'impact_delta', 'likelihood_delta',
    'new_confidence_score', 'new_momentum_score', 'new_impact_score',
    'accuracy_score', 'evidence_count', 'signal_count', 'source_diversity',
    'documents_scanned', 'new_documents_found', 'updated_documents_found',
    'new_signals_found', 'latency_ms'
]

for ff in float_fields:
    content = re.sub(
        rf'{ff} = models\.TextField\(blank=True, null=True\).*?guess\.',
        f'{ff} = models.FloatField(blank=True, null=True)',
        content
    )

content = "import uuid\n" + content

with open('trendmap_api/models.py', 'w') as f:
    f.write(content)

print("Models cleaned up.")
