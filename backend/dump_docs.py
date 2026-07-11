import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trendmap_django.settings')
os.environ['TEST_E2E'] = '1'
django.setup()

from trendmap_api.models import Document
from trendmap_api.serializers import DocumentSerializer

from rest_framework.renderers import JSONRenderer

docs = Document.objects.all()
serializer = DocumentSerializer(docs, many=True)
print(JSONRenderer().render(serializer.data).decode('utf-8'))
