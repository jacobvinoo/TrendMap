
import { describe, it, expect } from 'vitest';
import { generateWhatChangedSummary } from './whatChangedEngine';
import type { MonitoringRun, Signal, Trend, Alert, TrendScoreChange } from './types'; 

describe('What Changed Summary Engine', () => {
  const baseRun: MonitoringRun = {
    id: 'run1', ruleId: 'r1', sourceId: 's1', startedAt: '', status: 'running',
    documentsScanned: 10, newDocumentsFound: 2, updatedDocumentsFound: 0,
    newSignalsFound: 1, affectedTrendIds: [], alertIds: []
  };

  it('generates a descriptive headline', () => {
    const signals: Signal[] = [{ id: 's1', polarity: 'positive', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0, strengthScore: 0, confidenceScore: 0, evidenceDate: '', tags: [], documentId: '', sourceId: '' }]; 
    const scoreChanges: TrendScoreChange[] = [{ 
      id: 'sc1', trendId: 't1', previousSnapshotId: 'snap1', currentSnapshotId: 'snap2', changedAt: '',
      likelihoodDelta: 0.1, confidenceDelta: 0.1, impactDelta: 0.1, horizonChanged: false, maturityChanged: false, reason: 'test',
      newConfidenceScore: 0.8, newMomentumScore: 0.8, newImpactScore: 0.8,
      relatedSignalIds: []
    }];
    
    const summary = generateWhatChangedSummary(baseRun, signals, [], scoreChanges, []);
    
    expect(summary.headline).toContain('1 new signal');
    expect(summary.headline).toContain('1 trend');
  });

  it('recommends reviewing candidate trends if new candidates exist', () => {
    const newCand: Trend = { 
      id: 'c1', name: 'Candidate Trend', status: 'candidate', confidenceScore: 0, momentumScore: 0, impactScore: 0,
      summary: '', relatedSignalIds: [], createdAt: '', updatedAt: '', likelihoodScore: 0, horizon: 'short', maturityStage: 'emerging', 
      drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: []
    }; 
    const summary = generateWhatChangedSummary(baseRun, [], [newCand], [], []);
    
    expect(summary.recommendedActions.some(a => a.toLowerCase().includes('review candidate trend'))).toBe(true); 
    expect(summary.newCandidateTrends).toHaveLength(1);
  });

  it('recommends acknowledging alerts if alerts were generated', () => {
    const alert: Alert = { 
      id: 'a1', trendId: 't1', alertType: 'score_threshold_crossed', severity: 'critical', message: '', createdAt: '', acknowledged: false,
      title: 'Critical Alert', summary: 'Something happened', relatedSignalIds: [], relatedDocumentIds: [], relatedSourceIds: []
    };
    const summary = generateWhatChangedSummary(baseRun, [], [], [], [alert]);
    
    expect(summary.recommendedActions.some(a => a.toLowerCase().includes('acknowledge critical alert'))).toBe(true); 
    expect(summary.alerts).toHaveLength(1);
  });

  it('handles empty changes gracefully', () => {
    const run: MonitoringRun = { ...baseRun, newSignalsFound: 0 };
    const summary = generateWhatChangedSummary(run, [], [], [], []);
    
    expect(summary.headline).toBe('No significant changes detected in this run.');
    expect(summary.recommendedActions).toHaveLength(0);
  });
});
