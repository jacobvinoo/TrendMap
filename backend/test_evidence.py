import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trendmap_django.settings')
os.environ['TEST_E2E'] = '1'
django.setup()

from django.test import Client
from trendmap_api.models import Trend, Signal
import json

trend = Trend.objects.first()
signal = Signal.objects.first()

if not trend or not signal:
    print("No trend or signal found!")
else:
    client = Client()
    data = {
        "trend_id": str(trend.id),
        "signal_id": str(signal.id),
        "confidence_score": 0.9,
        "novelty_score": 0.8
    }
    response = client.post(f'/api/trends/{trend.id}/evidence', data=json.dumps(data), content_type='application/json')
    print("Status:", response.status_code)
    print("Response:", response.content)
