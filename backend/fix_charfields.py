import re

with open('trendmap_api/models.py', 'r') as f:
    content = f.read()

# Fix CharField max_length
content = re.sub(
    r'models\.CharField\((.*?)\)',
    lambda m: f"models.CharField(max_length=255, {m.group(1)})" if m.group(1) and 'max_length' not in m.group(1) else (f"models.CharField(max_length=255)" if not m.group(1) else m.group(0)),
    content
)

# Also fix the weird comma for empty CharField that might result from above
content = content.replace("models.CharField(max_length=255, )", "models.CharField(max_length=255)")

with open('trendmap_api/models.py', 'w') as f:
    f.write(content)

print("CharFields fixed.")
