import json

from rest_framework import serializers

from .models import (
    AuditEvent,
    Document,
    EvidenceLink,
    Industry,
    MonitoringRule,
    MonitoringRun,
    Signal,
    Source,
    StrategicContext,
    Trend,
)


def parse_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        if not value:
            return []
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return [part.strip() for part in value.split(",") if part.strip()]
    return []


class TextListField(serializers.Field):
    def to_representation(self, value):
        return parse_list(value)

    def to_internal_value(self, data):
        return json.dumps(parse_list(data))


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = "__all__"


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = "__all__"


class DocumentSerializer(serializers.ModelSerializer):
    source_id = serializers.CharField(write_only=True, required=False)
    extracted_signal_ids = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = "__all__"

    def get_extracted_signal_ids(self, obj):
        return list(obj.signals.values_list("id", flat=True))


class SignalSerializer(serializers.ModelSerializer):
    document_id = serializers.CharField(write_only=True, required=False)
    source_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Signal
        fields = "__all__"


class TrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trend
        fields = "__all__"


class EvidenceLinkSerializer(serializers.ModelSerializer):
    trend_id = serializers.CharField(write_only=True, required=False)
    signal_id = serializers.CharField(write_only=True, required=False)
    document_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    source_id = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = EvidenceLink
        fields = "__all__"


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = "__all__"


class MonitoringRuleSerializer(serializers.ModelSerializer):
    source_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = MonitoringRule
        fields = "__all__"


class MonitoringRunSerializer(serializers.ModelSerializer):
    rule_id = serializers.CharField(write_only=True, required=False)
    source_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = MonitoringRun
        fields = "__all__"


class StrategicContextSerializer(serializers.ModelSerializer):
    target_customers = TextListField(required=False)
    strategic_goals = TextListField(required=False)
    current_capabilities = TextListField(required=False)
    constraints = TextListField(required=False)
    planning_horizons = TextListField(required=False)

    class Meta:
        model = StrategicContext
        fields = "__all__"
