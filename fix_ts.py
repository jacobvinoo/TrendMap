import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'resetMockData' in content and 'clearDynamicData' not in content:
        # Don't add clearDynamicData if we don't want to clear data!
        # The failing tests are: 
        # src/DocumentIntake.test.tsx
        # src/SignalsScreen.test.tsx
        # src/integrationBaselineToNew.test.ts
        # src/mockRepository.test.ts
        # src/traceabilityValidation.test.ts
        # src/a11y/a11y.test.tsx
        pass

for file in [
    'src/DocumentIntake.test.tsx',
    'src/SignalsScreen.test.tsx',
    'src/integrationBaselineToNew.test.ts',
    'src/mockRepository.test.ts',
    'src/traceabilityValidation.test.ts',
    'src/a11y/a11y.test.tsx'
]:
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace('resetMockData,', 'resetMockData, clearDynamicData,')
    content = content.replace('{ resetMockData }', '{ resetMockData, clearDynamicData }')
    content = content.replace('resetMockData();', 'resetMockData(); clearDynamicData();')
    
    with open(file, 'w') as f:
        f.write(content)
