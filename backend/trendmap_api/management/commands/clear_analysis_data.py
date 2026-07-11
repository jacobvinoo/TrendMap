from django.core.management.base import BaseCommand
from django.db import transaction

from trendmap_api.models import (
    AgentDebate,
    Alert,
    Assumption,
    Document,
    EvidenceLink,
    ExtractionRun,
    Prediction,
    PredictionOutcome,
    PredictionUpdate,
    Signal,
    StrategicImplication,
    Trend,
    TrendScoreChange,
    TrendScoreSnapshot,
    WhatChangedSummary,
)


class Command(BaseCommand):
    help = "Clear generated documents, signals, trends, evidence, and insight-like analysis data while keeping industries and sources."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Show counts without deleting data.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        targets = [
            ("prediction_outcomes", PredictionOutcome),
            ("prediction_updates", PredictionUpdate),
            ("predictions", Prediction),
            ("agent_debates", AgentDebate),
            ("alerts", Alert),
            ("assumptions", Assumption),
            ("strategic_implications", StrategicImplication),
            ("trend_score_changes", TrendScoreChange),
            ("trend_score_snapshots", TrendScoreSnapshot),
            ("what_changed_summaries", WhatChangedSummary),
            ("evidence_links", EvidenceLink),
            ("signals", Signal),
            ("documents", Document),
            ("trends", Trend),
            ("extraction_runs", ExtractionRun),
        ]

        counts = [(label, model.objects.count()) for label, model in targets]
        for label, count in counts:
            self.stdout.write(f"{label}: {count}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run only. No rows deleted."))
            return

        with transaction.atomic():
            for _label, model in targets:
                model.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Cleared generated analysis data. Industries and sources were preserved."))
