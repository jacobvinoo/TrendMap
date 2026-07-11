from trendmap_api.models import Document, Source, Signal
from django.utils import timezone
import uuid

doc = Document.objects.get(title='Mock Signal for AI-assisted search relevance')
try:
    signal = Signal.objects.create(
        id=str(uuid.uuid4()),
        document=doc,
        source=doc.source,
        extraction_run=doc.extraction_run,
        title="Test Title",
        summary="Test Summary",
        signal_type="test_type",
        pestle_category="Technology",
        novelty_score=0.72,
        strength_score=0.78,
        confidence_score=0.74,
        evidence_date=doc.published_at,
        created_at=timezone.now()
    )
    print("Signal created successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
