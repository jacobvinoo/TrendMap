
import { describe, it, expect, beforeEach } from 'vitest';
import { runMonitoringRule } from './monitoringRun';
import { 
  getMonitoringRuns, 
  saveMonitoringRule,
  getSourceSnapshots,
  getChangeEvents,
  
  
  getWhatChangedSummaries,
  saveIndustryProfile
} from './mockRepository';

describe('Monitoring Run Orchestrator', () => {
  beforeEach(() => {
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
    saveIndustryProfile({ id: 'ind-1', name: 'Mock Ind' } as any);
  });

  it('fails if rule not found', async () => {
    const run = await runMonitoringRule('invalid-rule', 'baseline');
    expect(run.status).toBe('failed');
    expect(run.errorMessage).toBeDefined();
  });

  it('runs successfully for a valid rule', async () => {
    saveMonitoringRule({
      id: 'r1',
      sourceId: 'src-1',
      industryProfileId: 'ind-1',
      frequency: 'weekly',
      enabled: true,
      keywords: [],
      includePatterns: [],
      excludePatterns: [],
      createdAt: '',
      updatedAt: ''
    });

    // Run baseline
    const run1 = await runMonitoringRule('r1', 'baseline');
    expect(run1.status).toBe('completed');
    expect(run1.ruleId).toBe('r1');
    expect(getMonitoringRuns().length).toBe(1);
    expect(getSourceSnapshots('src-1').length).toBe(1);

    // Run new activity
    const run2 = await runMonitoringRule('r1', 'new_activity');
    if (run2.status === 'failed') console.error("Run2 failed with error:", run2.errorMessage);
    expect(run2.status).toBe('completed');
    expect(getSourceSnapshots('src-1').length).toBe(2);
    
    // Should have change events between baseline and new_activity
    const changes = getChangeEvents();
    expect(changes.length).toBeGreaterThan(0);
    expect(run2.newDocumentsFound).toBeGreaterThan(0);

    // Should generate what changed summary
    const summaries = getWhatChangedSummaries();
    expect(summaries.length).toBeGreaterThan(0);
  });
});
