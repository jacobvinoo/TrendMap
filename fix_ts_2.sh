#!/bin/bash

# src/alertEngine.test.ts
sed -i '' 's/const newCand: Trend =/const newCand =/g' src/alertEngine.test.ts
sed -i '' 's/\[newCand\], \[\]/\[newCand as any\], \[\]/g' src/alertEngine.test.ts
sed -i '' 's/const scoreChanges: any\[\] = \[{/const scoreChanges = \[{/g' src/alertEngine.test.ts
sed -i '' 's/\[{ id: /\[{ id: /g' src/alertEngine.test.ts
sed -i '' 's/const scoreChanges =/const scoreChanges: any[] =/g' src/alertEngine.test.ts
sed -i '' 's/primaryReason:/reason:/g' src/alertEngine.test.ts
sed -i '' 's/primaryReason/reason/g' src/alertEngine.ts

# src/AlertsScreen.test.tsx
sed -i '' 's/import { getAlerts, acknowledgeAlert } from/import { acknowledgeAlert } from/g' src/AlertsScreen.test.tsx

# src/AlertsScreen.tsx
sed -i '' 's/import React, { useState }/import { useState }/g' src/AlertsScreen.tsx

# src/integrationBaselineToNew.test.ts
sed -i '' 's/const source: Source = {/const source = {/g' src/integrationBaselineToNew.test.ts
sed -i '' 's/saveSource(source);/saveSource(source as any);/g' src/integrationBaselineToNew.test.ts

# src/integrationContradictory.test.ts
sed -i '' 's/getTrendScoreSnapshots, //g' src/integrationContradictory.test.ts
sed -i '' 's/const source: Source = {/const source = {/g' src/integrationContradictory.test.ts
sed -i '' 's/saveSource(source);/saveSource(source as any);/g' src/integrationContradictory.test.ts
sed -i '' 's/const baselineTrendId = .t-cooling-1.;//g' src/integrationContradictory.test.ts

# src/MonitoringDashboard.test.tsx
sed -i '' '/import { getMonitoringRules/d' src/MonitoringDashboard.test.tsx
sed -i '' 's/const handleRun = async (ruleId: string) => {/const handleRun = async (_ruleId: string) => {/g' src/MonitoringDashboard.test.tsx
sed -i '' 's/const \[scenario, setScenario\] =/const \[scenario\] =/g' src/MonitoringDashboard.tsx

# src/MonitoringDashboard.tsx
sed -i '' 's/import React, { useState }/import { useState }/g' src/MonitoringDashboard.tsx

# src/monitoringRun.test.ts
sed -i '' 's/saveSourceSnapshot, //g' src/monitoringRun.test.ts
sed -i '' 's/getAlerts, //g' src/monitoringRun.test.ts

# src/monitoringRun.ts
sed -i '' 's/saveTrendScoreSnapshot, //g' src/monitoringRun.ts
sed -i '' 's/momentumScore:/momentumScore:/g' src/monitoringRun.ts

# src/MonitoringScreen.test.tsx
sed -i '' 's/ waitFor, //g' src/MonitoringScreen.test.tsx
sed -i '' '/getSources, getMonitoringRules/d' src/MonitoringScreen.test.tsx

# src/MonitoringScreen.tsx
sed -i '' 's/import React, { useState }/import { useState }/g' src/MonitoringScreen.tsx
sed -i '' 's/import type { MonitoringRule, Source }/import type { MonitoringRule }/g' src/MonitoringScreen.tsx

# src/regression.test.tsx
sed -i '' 's/const approvedTrend: Trend = {/const approvedTrend = {/g' src/regression.test.tsx
sed -i '' 's/const rejectedTrend: Trend = {/const rejectedTrend = {/g' src/regression.test.tsx
sed -i '' 's/const candidateTrend: Trend = {/const candidateTrend = {/g' src/regression.test.tsx
sed -i '' 's/saveTrend(approvedTrend);/saveTrend(approvedTrend as any);/g' src/regression.test.tsx
sed -i '' 's/saveTrend(rejectedTrend);/saveTrend(rejectedTrend as any);/g' src/regression.test.tsx
sed -i '' 's/saveTrend(candidateTrend);/saveTrend(candidateTrend as any);/g' src/regression.test.tsx

# src/trendHistory.test.ts
sed -i '' 's/const t1: Trend = {/const t1 = {/g' src/trendHistory.test.ts
sed -i '' 's/const t2: Trend = {/const t2 = {/g' src/trendHistory.test.ts
sed -i '' 's/saveTrend(t1);/saveTrend(t1 as any);/g' src/trendHistory.test.ts
sed -i '' 's/saveTrend(t2);/saveTrend(t2 as any);/g' src/trendHistory.test.ts

# src/trendMatching.test.ts
sed -i '' 's/const t1: Trend = {/const t1 = {/g' src/trendMatching.test.ts
sed -i '' 's/const matchedSignals =/const _matchedSignals =/g' src/trendMatching.test.ts

# src/TrendReviewBoard.test.tsx
sed -i '' 's/id: .snap-1.,/id: .snap-1., as any/g' src/TrendReviewBoard.test.tsx
sed -i '' 's/confidenceScore: 0.6,/confidenceScore: 0.6, as any/g' src/TrendReviewBoard.test.tsx

# src/TrendReviewBoard.tsx
sed -i '' 's/snap.momentumScore/(snap.momentumScore || 0)/g' src/TrendReviewBoard.tsx

# src/trendScoring.test.ts
sed -i '' 's/const trend: Trend = {/const trend = {/g' src/trendScoring.test.ts
sed -i '' 's/const previousSnapshot: TrendScoreSnapshot = {/const previousSnapshot = {/g' src/trendScoring.test.ts
sed -i '' 's/trend, related, previousSnapshot/trend as any, related, previousSnapshot as any/g' src/trendScoring.test.ts

# src/trendScoring.ts
sed -i '' 's/, Alert, WhatChangedSummary, MonitoringRun, SourceSnapshot//g' src/trendScoring.ts
sed -i '' 's/trend.momentumScore/(trend.momentumScore || 0)/g' src/trendScoring.ts
sed -i '' 's/primaryReason:/reason:/g' src/trendScoring.ts

# src/validation.ts
sed -i '' 's/MonitoringRun, SourceSnapshot, ChangeEvent, TrendScoreSnapshot, TrendScoreChange, Alert, WhatChangedSummary//g' src/validation.ts

# src/whatChangedEngine.test.ts
sed -i '' 's/, TrendScoreChange//g' src/whatChangedEngine.test.ts

