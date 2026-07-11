from trendmap_api.models import Industry
from django.test import RequestFactory
from trendmap_api.views import agent_discovery

ind = Industry.objects.get(name="Retail")
req = RequestFactory().post(f'/api/agents/discovery/{ind.id}')
resp = agent_discovery(req, ind.id)
print(resp.data)
