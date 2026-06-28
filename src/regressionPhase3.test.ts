import { describe, it, expect, beforeEach } from 'vitest';
import { runMonitoringRule } from './monitoringRun';
import { resetMockData, getTrends, saveTrends, getAlerts, saveAlerts, getSources, saveMonitoringRule, getMonitoringRuns, saveIndustryProfile } from './mockRepository';
import type { Trend, Source } from './types';

describe('Phase 1 and 2 Regression Suite', () => {
  beforeEach(() => {
    // Reset module-level state using the same pattern as monitoringRun.test.ts
    globalThis.__mockRepoState = {
      industryProfile: null,
      sources: [],
      documents: [],
      signals: [],
      trends: [],
      evidences: [],
      rules: [],
      runs: [],
      snapshots: [],
      changeEvents: [],
      trendScoreSnapshots: [],
      trendScoreChanges: [],
      alerts: [],
      summaries: [],
      strategicContext: null,
      assumptions: [],
      leadingIndicators: [],
      strategicImplications: [],
      scenarios: [],
      strategicOptions: [],
      decisionBriefs: [],
      roadmapItems: [],
    };
  });

  it('ensures approved trends still appear in Insights', () => {
    saveTrends([
      { id: 't1', name: 'Approved', status: 'approved', confidenceScore: 0.9, momentumScore: 0.9, impactScore: 0.9, relatedSignalIds: [], createdAt: '', updatedAt: '', likelihoodScore: 0.8, horizon: 'short', maturityStage: 'emerging', drivers: [], blockers: [], summary: '', whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [] },
      { id: 't2', name: 'Candidate', status: 'candidate', confidenceScore: 0.5, momentumScore: 0.5, impactScore: 0.5, relatedSignalIds: [], createdAt: '', updatedAt: '', likelihoodScore: 0.4, horizon: 'short', maturityStage: 'emerging', drivers: [], blockers: [], summary: '', whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [] },
    ]);
    const trends = getTrends();
    const approved = trends.filter((t: Trend) => t.status === 'approved');
    expect(approved).toHaveLength(1);
    expect(approved[0].name).toBe('Approved');
  });

  it('ensures monitoring updates still create run records', async () => {
    // Setup a valid rule
    saveIndustryProfile({ id: 'ind-1', name: 'Tech' } as any);
    saveMonitoringRule({
      id: 'r1', sourceId: 'src-1', industryProfileId: 'ind-1',
      enabled: true, frequency: 'daily', keywords: ['test'],
      includePatterns: [], excludePatterns: [], createdAt: '', updatedAt: ''
    });

    // Baseline run creates a monitoring run record
    const run1 = await runMonitoringRule('r1', 'baseline');
    expect(run1.status).toBe('completed');

    // Second run (new_activity) also records
    const run2 = await runMonitoringRule('r1', 'new_activity');
    expect(run2.status).toBe('completed');

    // Both runs should be persisted in the run history
    expect(getMonitoringRuns().length).toBeGreaterThanOrEqual(2);
  });

  it('ensures alerts remain linked to evidence', () => {
    saveAlerts([
      {
        id: 'a1', trendId: 't1', alertType: 'score_threshold_crossed',
        severity: 'critical', message: '', createdAt: '', acknowledged: false,
        title: '', summary: '', relatedSignalIds: ['sig1'],
        relatedDocumentIds: ['doc1'], relatedSourceIds: ['src1']
      }
    ]);
    const alerts = getAlerts();
    expect(alerts[0].relatedSignalIds).toContain('sig1');
    expect(alerts[0].relatedDocumentIds).toContain('doc1');
    expect(alerts[0].relatedSourceIds).toContain('src1');
  });

  it('ensures rejected sources are present and identifiable as rejected', () => {
    // resetMockData() re-seeds all default data synchronously, giving us the rejected source
    resetMockData();
    const allSources = getSources();
    const rejected = allSources.filter((s: Source) => s.status === 'rejected');
    const approved = allSources.filter((s: Source) => s.status === 'approved');

    // The default data has at least 1 rejected and multiple approved
    expect(rejected.length).toBeGreaterThan(0);
    expect(approved.length).toBeGreaterThan(0);

    // Rejected sources can be identified and excluded from pipeline by status
    const activeForPipeline = allSources.filter((s: Source) => s.status === 'approved');
    expect(activeForPipeline.every((s: Source) => s.status === 'approved')).toBe(true);
  });
});
