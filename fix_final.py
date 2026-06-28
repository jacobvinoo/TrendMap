import os
for file in ['src/a11y/a11y.test.tsx', 'src/traceabilityValidation.test.ts']:
    with open(file, 'r') as f:
        content = f.read()
    if 'resetMockData' in content and 'clearDynamicData' not in content:
        content = content.replace('resetMockData,', 'resetMockData, clearDynamicData,')
        content = content.replace('{ resetMockData }', '{ resetMockData, clearDynamicData }')
    with open(file, 'w') as f:
        f.write(content)
