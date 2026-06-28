
import { describe, it, expect } from 'vitest';
import { calculateTrendScoreUpdate } from './trendScoring';
import type { Signal } from './types'; 

describe('Trend Score Update Engine', () => {
  const baseTrend: any = { id: 't1', name: 'Competitor Launch', 
    summary: '',
    status: 'approved',
    relatedSignalIds: [],
    createdAt: '',
    updatedAt: '',
    confidenceScore: 0.5,
    momentumScore: 0.5,
    impactScore: 0.5
  };

  const prevSnapshot: any = {
    id: 'snap1',
    trendId: 't1',
    capturedAt: '2026-01-01',
    confidenceScore: 0.5,
    momentumScore: 0.5,
    impactScore: 0.5
  };

  it('increases scores for positive signals', () => {
    const signals: Signal[] = [
      { id: 's1', polarity: 'positive', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.8, strengthScore: 0.8, confidenceScore: 0.8, evidenceDate: '', tags: [], documentId: '', sourceId: '' } 
    ];

    const update = calculateTrendScoreUpdate(baseTrend, signals, prevSnapshot);
    expect(update).not.toBeNull();
    expect(update!.newConfidenceScore).toBeGreaterThan(0.5);
    expect(update!.newImpactScore).toBeGreaterThan(0.5);
    expect(update!.newMomentumScore).toBeGreaterThanOrEqual(0.5);
  });

  it('decreases scores for negative signals', () => {
    const signals: Signal[] = [
      { id: 's1', polarity: 'negative', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.8, strengthScore: 0.8, confidenceScore: 0.8, evidenceDate: '', tags: [], documentId: '', sourceId: '' } 
    ];

    const update = calculateTrendScoreUpdate(baseTrend, signals, prevSnapshot);
    expect(update).not.toBeNull();
    expect(update!.newConfidenceScore).toBeLessThan(0.5);
    expect(update!.newMomentumScore).toBeLessThan(0.5);
  });

  it('handles mixed signals correctly', () => {
    const signals: Signal[] = [
      { id: 's1', polarity: 'positive', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.9, strengthScore: 0.9, confidenceScore: 0.9, evidenceDate: '', tags: [], documentId: '', sourceId: '' }, 
      { id: 's2', polarity: 'negative', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.4, strengthScore: 0.4, confidenceScore: 0.4, evidenceDate: '', tags: [], documentId: '', sourceId: '' } 
    ];

    const update = calculateTrendScoreUpdate(baseTrend, signals, prevSnapshot);
    expect(update).not.toBeNull();
    // Strong positive outweighs weak negative
    expect(update!.newConfidenceScore).toBeGreaterThan(0.5);
  });

  it('returns null if no signals', () => {
    const update = calculateTrendScoreUpdate(baseTrend, [], prevSnapshot);
    expect(update).toBeNull();
  });

  it('bounds scores to 0.0 and 1.0', () => {
    const highTrend = { ...baseTrend, confidenceScore: 0.99, impactScore: 0.99, momentumScore: 0.99 };
    const positiveSignals: Signal[] = [
      { id: 's1', polarity: 'positive', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.9, strengthScore: 0.9, confidenceScore: 0.9, evidenceDate: '', tags: [], documentId: '', sourceId: '' } 
    ];
    
    const updateHigh = calculateTrendScoreUpdate(highTrend, positiveSignals, prevSnapshot);
    expect(updateHigh!.newConfidenceScore).toBeLessThanOrEqual(1.0);
    expect(updateHigh!.newImpactScore).toBeLessThanOrEqual(1.0);
    
    const lowTrend = { ...baseTrend, confidenceScore: 0.01, impactScore: 0.01, momentumScore: 0.01 };
    const negativeSignals: Signal[] = [
      { id: 's1', polarity: 'negative', signalType: '', title: '', summary: '', pestleCategory: '', noveltyScore: 0.9, strengthScore: 0.9, confidenceScore: 0.9, evidenceDate: '', tags: [], documentId: '', sourceId: '' } 
    ];
    
    const updateLow = calculateTrendScoreUpdate(lowTrend, negativeSignals, prevSnapshot);
    expect(updateLow!.newConfidenceScore).toBeGreaterThanOrEqual(0.0);
    expect(updateLow!.newMomentumScore).toBeGreaterThanOrEqual(0.0);
  });
});
