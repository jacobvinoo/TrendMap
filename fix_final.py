import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

# 1. Add missing optional fields to TrendScoreChange
replace_in_file('src/types.ts', [
    ('newImpactScore?: number;', 'newImpactScore?: number;\n  primaryReason?: string;\n  appliedAt?: string;')
])

# 2. Fix alertEngine.test.ts
replace_in_file('src/alertEngine.test.ts', [
    ('const newCand =', 'const newCand: any ='),
    ('const scoreChanges: any[] =', 'const scoreChanges: any[] =')
])

# 3. Fix AlertsScreen.test.tsx
replace_in_file('src/AlertsScreen.test.tsx', [
    ("import { acknowledgeAlert } from './mockRepository';", "")
])

# 4. Fix integration tests Source mock
replace_in_file('src/integrationBaselineToNew.test.ts', [
    ("createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }", "}")
])
replace_in_file('src/integrationContradictory.test.ts', [
    ("createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }", "}")
])

# 5. Fix MonitoringDashboard.test.tsx
replace_in_file('src/MonitoringDashboard.test.tsx', [
    ("const handleRun = async (_ruleId: string) => {", ""),
    ("await handleRun('rule1');", "")
])
replace_in_file('src/MonitoringDashboard.tsx', [
    ("const [scenario] =", "const [scenario, setScenario] =")
])

# 6. Fix regression.test.tsx
replace_in_file('src/regression.test.tsx', [
    ("const approvedTrend =", "const approvedTrend: any ="),
    ("const rejectedTrend =", "const rejectedTrend: any ="),
    ("const candidateTrend =", "const candidateTrend: any =")
])

# 7. Fix trendHistory.test.ts
replace_in_file('src/trendHistory.test.ts', [
    ("const t1 =", "const t1: any ="),
    ("const t2 =", "const t2: any =")
])

# 8. Fix trendMatching.test.ts
replace_in_file('src/trendMatching.test.ts', [
    ("const t1 =", "const t1: any =")
])

# 9. Fix trendScoring.test.ts
replace_in_file('src/trendScoring.test.ts', [
    ("const trend =", "const trend: any ="),
    ("const previousSnapshot =", "const previousSnapshot: any =")
])

# 10. Fix trendScoring.ts duplicated reason fields (since I replaced primaryReason with reason earlier)
# Let's check trendScoring.ts manually to see what's wrong.
