import { clusterSignalsIntoTrends } from './trendClustering';
import type { Signal } from './types';

// Helper to create a signal
function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 'sig-1',
    documentId: 'doc-1',
    sourceId: 'src-1',
    title: 'AI-assisted shopping',
    summary: 'Detected AI assistance.',
    signalType: 'AI-assisted shopping',
    pestleCategory: 'Technology',
    noveltyScore: 0.9,
    strengthScore: 0.9,
    confidenceScore: 0.9,
    evidenceDate: '2026-01-01',
    tags: [],
    ...overrides,
  };
}

describe('trendClustering service', () => {
  test('clusters AI‑assistant related signals into AI‑assisted grocery discovery trend', () => {
    const signals: Signal[] = [
      makeSignal({ id: 'sig-a1', strengthScore: 0.9, confidenceScore: 0.9 }),
      makeSignal({ id: 'sig-a2', strengthScore: 0.85, confidenceScore: 0.88, sourceId: 'src-2' }),
      makeSignal({ id: 'sig-a3', strengthScore: 0.95, confidenceScore: 0.92, sourceId: 'src-3' }),
    ];
    const trends = clusterSignalsIntoTrends(signals);
    expect(trends).toHaveLength(1);
    const trend = trends[0];
    expect(trend.name).toBe('AI-assisted grocery discovery');
    expect(trend.relatedSignalIds).toEqual(expect.arrayContaining(['sig-a1', 'sig-a2', 'sig-a3']));
    // Scores within 0‑1
    expect(trend.likelihoodScore).toBeGreaterThanOrEqual(0);
    expect(trend.likelihoodScore).toBeLessThanOrEqual(1);
    expect(trend.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(trend.confidenceScore).toBeLessThanOrEqual(1);
    // Horizon should be 6‑12 months because count ≥3 and avg strength high
    expect(trend.horizon).toBe('6-12 months');
    // Placeholder fields are present
    expect(trend.whatNeedsToBeTrue.length).toBeGreaterThan(0);
    expect(trend.leadingIndicators.length).toBeGreaterThan(0);
    expect(trend.monitoringQuestions.length).toBeGreaterThan(0);
    expect(trend.maturityStage).toBe('emerging');
  });

  test('clusters retail‑media signals into Retail media influence trend', () => {
    const signals: Signal[] = [
      makeSignal({
        id: 'sig-r1',
        signalType: 'Retail media influence',
        title: 'Retail media influence',
        strengthScore: 0.7,
        confidenceScore: 0.8,
      }),
      makeSignal({
        id: 'sig-r2',
        signalType: 'Retail media influence',
        title: 'Retail media influence',
        strengthScore: 0.75,
        confidenceScore: 0.85,
        sourceId: 'src-2',
      }),
    ];
    const trends = clusterSignalsIntoTrends(signals);
    expect(trends).toHaveLength(1);
    const trend = trends[0];
    expect(trend.name).toBe('Retail media influence on search outcomes');
    expect(trend.horizon).toBe('12-24 months');
  });

  test('unrelated signals produce no trends', () => {
    const signals: Signal[] = [
      makeSignal({
        id: 'sig-x1',
        signalType: 'Unrelated type',
        title: 'Unrelated signal',
        strengthScore: 0.5,
      }),
    ];
    const trends = clusterSignalsIntoTrends(signals);
    expect(trends).toHaveLength(0);
  });

  test('duplicate signals do not create duplicate trends', () => {
    const base = makeSignal({ id: 'sig-d1' });
    const signals: Signal[] = [base, { ...base, id: 'sig-d2' }];
    const trends = clusterSignalsIntoTrends(signals);
    // Both belong to same AI cluster, should result in one trend
    expect(trends).toHaveLength(1);
    expect(trends[0].relatedSignalIds).toEqual(expect.arrayContaining(['sig-d1', 'sig-d2']));
  });
});
