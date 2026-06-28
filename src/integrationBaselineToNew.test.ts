// @ts-nocheck

import { describe, it, expect, beforeEach } from 'vitest';
import { runMonitoringRule } from './monitoringRun';
import { 
  resetMockData, 
  saveMonitoringRule, 
  getTrends, 
  getAlerts,
  getWhatChangedSummaries,
  getTrendScoreSnapshots
} from './mockRepository';

describe('Integration Path: Baseline to New Activity', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('runs baseline then new_activity and asserts full lifecycle', async () => {
    // 1. Setup
    globalThis.__mockRepoState!.sources.push({ id: 'src-1', name: 'Tech Blog', url: 'https://example.com', status: 'approved', createdAt: '', updatedAt: '', description: '' }); 
    saveMonitoringRule({ id: 'rule-1', sourceId: 'src-1', industryProfileId: 'ind-1', enabled: true, frequency: 'daily', keywords: [], includePatterns: [], excludePatterns: [], createdAt: '', updatedAt: '' });

    // 2. Baseline Run
    const baselineRun = await runMonitoringRule('rule-1', 'baseline');
    expect(baselineRun.status).toBe('completed');
    
    let trends = getTrends();
    // Baseline might create candidate trends depending on the signals in baseline feed
    // monitoringFeed.ts 'baseline' has 1 document "AI assistant launch"
    expect(trends.length).toBeGreaterThan(0);
    const initialTrendId = trends[0].id;
    const initialSnapshots = getTrendScoreSnapshots(initialTrendId);
    expect(initialSnapshots.length).toBeGreaterThan(0);

    // 3. New Activity Run
    const newRun = await runMonitoringRule('rule-1', 'new_activity');
    expect(newRun.status).toBe('completed');
    
    // new_activity feed has an additional document "Vendor publishes semantic search case study"
    // This should extract an Adoption Evidence positive signal and map it to an existing or new trend
    
    trends = getTrends();
    expect(trends.length).toBeGreaterThan(1); // Baseline created 1, new_activity creates another (Adoption Evidence)
    
    // 4. Assert Alerts
    const alerts = getAlerts();
    // new_activity might trigger new candidate alerts or threshold alerts
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.alertType === 'new_candidate' || a.alertType === 'score_threshold_crossed')).toBe(true);
    
    // 5. Assert What Changed Summary
    const summaries = getWhatChangedSummaries();
    expect(summaries.length).toBe(2); // One for baseline, one for new_activity
    
    const newSummary = summaries.find(s => s.monitoringRunId === newRun.id)!;
    expect(newSummary.headline).toContain('new signal');
  });
});
