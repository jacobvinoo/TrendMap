import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trendmap_django.settings')
os.environ['TEST_E2E'] = '1'
django.setup()

from trendmap_api.models import Document
from trendmap_api.serializers import DocumentSerializer

doc = Document.objects.first()
print("Before:", doc.status)

serializer = DocumentSerializer(doc, data={'ingestion_status': 'extracted'}, partial=True)
if serializer.is_valid():
    serializer.save()
    print("After:", doc.status)
else:
    print("Errors:", serializer.errors)
