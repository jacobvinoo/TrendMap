#!/bin/bash
sed -i '' 's/beforeEach(() => { resetMockData(); clearDynamicData(); });/beforeEach(() => { resetMockData(); clearDynamicData(); });/g' src/traceabilityValidation.test.ts
sed -i '' 's/beforeEach(() => resetMockData());/beforeEach(() => { resetMockData(); clearDynamicData(); });/g' src/a11y/a11y.test.tsx
