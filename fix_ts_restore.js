const fs = require('fs');
['src/a11y/a11y.test.tsx', 'src/traceabilityValidation.test.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('resetMockData') && !content.includes('clearDynamicData')) {
    content = content.replace('resetMockData,', 'resetMockData, clearDynamicData,');
    content = content.replace('{ resetMockData }', '{ resetMockData, clearDynamicData }');
  }
  fs.writeFileSync(file, content);
});
