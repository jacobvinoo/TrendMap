import re

with open('trendmap_api/urls.py', 'r') as f:
    content = f.read()

def camel_to_kebab(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

def replacement(match):
    model_name = match.group(2)
    kebab = camel_to_kebab(model_name) + 's'
    return f"router.register(r'{kebab}', {model_name}ViewSet)"

content = re.sub(r"router\.register\(r'([a-z]+)', (\w+)ViewSet\)", replacement, content)

with open('trendmap_api/urls.py', 'w') as f:
    f.write(content)

print("URLs hyphenated.")
