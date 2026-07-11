import re
import os

with open('trendmap_api/models.py', 'r') as f:
    models_content = f.read()

# Extract all model names
model_names = re.findall(r'^class (\w+)\(models\.Model\):', models_content, re.MULTILINE)

# Remove the ones already done manually
done_models = ['Industry', 'Source', 'Document', 'Signal', 'Trend']
remaining_models = [m for m in model_names if m not in done_models]

# 1. Update serializers.py
with open('trendmap_api/serializers.py', 'r') as f:
    serializers_content = f.read()

for model in remaining_models:
    if f"class {model}Serializer" not in serializers_content:
        serializers_content += f"\nclass {model}Serializer(serializers.ModelSerializer):\n"
        serializers_content += f"    class Meta:\n"
        serializers_content += f"        model = {model}\n"
        serializers_content += f"        fields = '__all__'\n"

# Add imports to serializers
all_models_str = ", ".join(remaining_models)
serializers_content = serializers_content.replace(
    "from .models import Industry, Source, Document, Signal, Trend",
    f"from .models import Industry, Source, Document, Signal, Trend, {all_models_str}"
)

with open('trendmap_api/serializers.py', 'w') as f:
    f.write(serializers_content)

# 2. Update views.py
with open('trendmap_api/views.py', 'r') as f:
    views_content = f.read()

for model in remaining_models:
    if f"class {model}ViewSet" not in views_content:
        views_content += f"\nclass {model}ViewSet(viewsets.ModelViewSet):\n"
        views_content += f"    queryset = {model}.objects.all()\n"
        views_content += f"    serializer_class = {model}Serializer\n"

# Add imports to views
serializers_imports = ", ".join([f"{m}Serializer" for m in remaining_models])
views_content = views_content.replace(
    "from .models import Industry, Source, Document, Signal, Trend",
    f"from .models import Industry, Source, Document, Signal, Trend, {all_models_str}"
)
views_content = views_content.replace(
    "    SignalSerializer, TrendSerializer\n)",
    f"    SignalSerializer, TrendSerializer, {serializers_imports}\n)"
)

with open('trendmap_api/views.py', 'w') as f:
    f.write(views_content)

# 3. Update urls.py
with open('trendmap_api/urls.py', 'r') as f:
    urls_content = f.read()

viewset_imports = ", ".join([f"{m}ViewSet" for m in remaining_models])
urls_content = urls_content.replace(
    "    SignalViewSet, TrendViewSet\n)",
    f"    SignalViewSet, TrendViewSet, {viewset_imports}\n)"
)

register_statements = ""
for model in remaining_models:
    route = model.lower() + "s"
    if f"router.register(r'{route}'" not in urls_content:
        register_statements += f"router.register(r'{route}', {model}ViewSet)\n"

urls_content = urls_content.replace(
    "router.register(r'trends', TrendViewSet)",
    f"router.register(r'trends', TrendViewSet)\n{register_statements}"
)

with open('trendmap_api/urls.py', 'w') as f:
    f.write(urls_content)

# 4. Generate tests
tests_code = "\n"
for model in remaining_models:
    # A generic test that attempts to list the models to ensure the ViewSet is working
    route = model.lower() + "s"
    tests_code += f"""
    def test_list_{model.lower()}(self):
        url = '/api/{route}'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
"""

with open('trendmap_api/tests.py', 'a') as f:
    f.write(tests_code)

print("Generated serializers, views, urls, and tests for remaining models.")
