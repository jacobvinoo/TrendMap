from django.core.management.base import BaseCommand
from trendmap_api.models import Industry, Source, Document, Signal, Trend
from django.utils import timezone
import uuid

class Command(BaseCommand):
    help = 'Seeds the database with test data for E2E tests'

    def handle(self, *args, **kwargs):
        import os
        if os.environ.get("E2E_TEST") != "1":
            self.stderr.write(self.style.ERROR("ERROR: This command can only be run with E2E_TEST=1 (so it uses the test database). Aborting to protect dev data."))
            return
            
        self.stdout.write("Flushing core models...")
        from trendmap_api.models import EvidenceLink, TrendScoreSnapshot, TrendScoreChange, MonitoringRun, MonitoringRule, SourceSnapshot, ChangeEvent, StrategicContext, StrategicImplication, StrategicOption, DecisionBrief, Assumption, LeadingIndicator, Alert, Embedding, WhatChangedSummary, Signal
        Alert.objects.all().delete()
        Embedding.objects.all().delete()
        DecisionBrief.objects.all().delete()
        StrategicOption.objects.all().delete()
        StrategicImplication.objects.all().delete()
        StrategicContext.objects.all().delete()
        Assumption.objects.all().delete()
        LeadingIndicator.objects.all().delete()
        EvidenceLink.objects.all().delete()
        TrendScoreSnapshot.objects.all().delete()
        TrendScoreChange.objects.all().delete()
        WhatChangedSummary.objects.all().delete()
        MonitoringRun.objects.all().delete()
        MonitoringRule.objects.all().delete()
        ChangeEvent.objects.all().delete()
        SourceSnapshot.objects.all().delete()
        Signal.objects.all().delete()
        Trend.objects.all().delete()
        Document.objects.all().delete()
        Source.objects.all().delete()
        Industry.objects.all().delete()

        self.stdout.write("Seeding data...")
        
        industry = Industry.objects.create(
            name="Retail",
            geography="Global",
            description="Retail and FMCG"
        )
        
        source = Source.objects.create(
            name="TechCrunch",
            url="https://techcrunch.com",
            source_type="news",
            status="approved"
        )
        
        doc = Document.objects.create(
            source=source,
            title="Mock Signal for AI-assisted search relevance",
            url="https://techcrunch.com/ai-grocery",
            content="AI is completely revolutionizing the modern grocery shopping experience for consumers worldwide.",
            published_at=timezone.now() - timezone.timedelta(days=1),
            status="processed"
        )
        
        doc_to_extract = Document.objects.create(
            source=source,
            title="New Mock Signal for E2E Extraction",
            url="https://techcrunch.com/ai-grocery-new",
            content="AI is completely revolutionizing the modern grocery shopping experience for consumers worldwide.",
            published_at=timezone.now(),
            status="processed"
        )
        
        trend1 = Trend.objects.create(
            name="AI Grocery Shopping",
            summary="AI changes grocery shopping behavior.",
            status="active",
            horizon="Near-Term (1-3 yrs)",
            likelihood_score=0.8,
            confidence_score=0.9,
            impact_score=0.7,
            maturity_stage="Emerging"
        )
        
        from trendmap_api.models import Alert
        Alert.objects.all().delete()
        
        # Create a Signal to link to EvidenceLink
        from trendmap_api.models import Signal
        sig = Signal.objects.create(
            document=doc,
            source=source,
            title="AI Adoption Signal",
            signal_type="weak",
            confidence_score=0.8
        )
        
        EvidenceLink.objects.create(
            relationship_type="supports",
            document=doc,
            signal=sig,
            trend=trend1,
            relevance_reason="Directly supports AI adoption."
        )
        
        Alert.objects.create(
            trend=trend1,
            alert_type="anomaly",
            severity="warning",
            title="Anomaly Detected: Momentum Drop",
            message="Contradictory evidence found.",
            summary="Contradictory evidence resulted in dropped momentum."
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database.'))
