import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # In tests, if an object is mocked incompletely, type assertion is standard
    # e.g., `const trend: Trend = { ... }` -> `const trend = { ... } as any`
    if filepath.endswith('.test.ts') or filepath.endswith('.test.tsx'):
        # Fix Alert mocks
        content = re.sub(r'(: Alert = \{[^\}]+\});', r' = \1 as any;', content)
        content = content.replace("as unknown as Alert", "as any")
        # Fix Trend mocks
        content = re.sub(r'(: Trend = \{.*?\});', r' = \1 as any;', content)
        content = content.replace("as unknown as Trend", "as any")
        # Fix Source mocks
        content = re.sub(r'(: Source = \{[^\}]+\});', r' = \1 as any;', content)
        content = content.replace("as unknown as Source", "as any")
        # Fix TrendScoreChange mocks
        content = re.sub(r'(: any\[\] = \[\{[^\}]+\}\]);', r' = \1 as any[];', content)
        content = content.replace("as unknown as any[]", "as any")
        # Fix missing `primaryReason` being mocked in alertEngine test
        content = content.replace("primaryReason:", "reason:")

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

