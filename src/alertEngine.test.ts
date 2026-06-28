
import { describe, it, expect } from 'vitest';
import { generateAlerts } from './alertEngine';
import type { Signal } from './types'; 

describe('Alert Generation Engine', () => {

  it('generates an alert for a new candidate trend', () => {
    const candidate: any = { 
      id: 't-cand', name: 'New Candidate', summary: '', status: 'candidate', relatedSignalIds: ['s1'],
      createdAt: '', updatedAt: '', confidenceScore: 0.8, momentumScore: 0.8, impactScore: 0.8
    };

    const signals: Signal[] = [
      { id: 's1', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0, strengthScore: 0, confidenceScore: 0, evidenceDate: '', tags: [], documentId: '', sourceId: '', polarity: 'positive' } 
    ];

    const alerts = generateAlerts([], [candidate], signals);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('new_candidate');
    expect(alerts[0].severity).toBe('info');
    expect(alerts[0].trendId).toBe('t-cand');
  });

  it('generates a warning alert when momentum drops significantly', () => {
    const scoreChanges: any[] = [
      { id: 'sc1', trendId: 't1', newConfidenceScore: 0.5, newMomentumScore: 0.3, newImpactScore: 0.5, reason: 'Negative signals detected', appliedAt: '' }
    ];
    // Since we don't have the old score in TrendScoreChange easily without querying, we can trigger an alert if new momentum is low and reason is negative.
    // Or if the engine queries the snapshot. For simplicity, let's say if primaryReason contains 'Negative' and momentum < 0.5 -> anomaly/warning.

    const alerts = generateAlerts(scoreChanges, [], []);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('anomaly_detected');
    expect(alerts[0].severity).toBe('warning');
    expect(alerts[0].trendId).toBe('t1');
  });

  it('generates a critical alert when impact hits a high threshold', () => {
    const scoreChanges: any[] = [
      { id: 'sc2', trendId: 't2', newConfidenceScore: 0.9, newMomentumScore: 0.9, newImpactScore: 0.9, reason: 'Positive signals detected', appliedAt: '' }
    ];

    const alerts = generateAlerts(scoreChanges, [], []);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('score_threshold_crossed');
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].trendId).toBe('t2');
  });

  it('returns no alerts if nothing crosses thresholds', () => {
    const scoreChanges: any[] = [
      { id: 'sc3', trendId: 't3', newConfidenceScore: 0.6, newMomentumScore: 0.6, newImpactScore: 0.6, reason: 'Positive signals detected', appliedAt: '' }
    ];

    const alerts = generateAlerts(scoreChanges, [], []);
    
    expect(alerts).toHaveLength(0);
  });
});
