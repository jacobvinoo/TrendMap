// @ts-nocheck
import { generateInsightSummary } from './insightSummary';
import type { Trend } from './types';

function makeTrend(overrides: Partial<Trend> = {}): Trend {
  return { 
    id: 'trend-1',
    name: 'Trend A',
    summary: 'Summary A',
    status: 'approved',
    horizon: '6-12 months',
    likelihoodScore: 0.8,
    confidenceScore: 0.8,
    impactScore: 0.9,
    maturityStage: 'emerging',
    relatedSignalIds: [],
    drivers: [],
    blockers: [],
    whatNeedsToBeTrue: [],
    leadingIndicators: [],
    monitoringQuestions: [],
    recommendedActions: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('generateInsightSummary deterministic service', () => {
  test('excludes rejected and candidate trends', () => {
    const approved = makeTrend({ id: 't1', impactScore: 0.9, confidenceScore: 0.9 });
    const rejected = makeTrend({ id: 't2', status: 'rejected' as any });
    const candidate = makeTrend({ id: 't3', status: 'candidate' as any });
    const summary = generateInsightSummary([approved, rejected, candidate]);
    expect(summary.keyTrends.map(t => t.id)).toContain('t1');
    expect(summary.keyTrends).not.toContainEqual(expect.objectContaining({ id: 't2' }));
    expect(summary.keyTrends).not.toContainEqual(expect.objectContaining({ id: 't3' }));
  });

  test('identifies key trends by highest impact', () => {
    const t1 = makeTrend({ id: 't1', impactScore: 0.9 });
    const t2 = makeTrend({ id: 't2', impactScore: 0.8 });
    const t3 = makeTrend({ id: 't3', impactScore: 0.7 });
    const summary = generateInsightSummary([t1, t2, t3]);
    expect(summary.keyTrends.map(t => t.id)).toEqual(['t1', 't2']);
  });

  test('watch items are high impact low confidence', () => {
    const t1 = makeTrend({ id: 't1', impactScore: 0.8, confidenceScore: 0.6 });
    const t2 = makeTrend({ id: 't2', impactScore: 0.6, confidenceScore: 0.5 });
    const summary = generateInsightSummary([t1, t2]);
    expect(summary.watchItems.map(t => t.id)).toContain('t1');
    expect(summary.watchItems).not.toContainEqual(expect.objectContaining({ id: 't2' }));
  });

  test('emerging risks include trends with blockers', () => {
    const t1 = makeTrend({ id: 't1', blockers: ['blocker'] });
    const summary = generateInsightSummary([t1]);
    expect(summary.emergingRisks.map(t => t.id)).toContain('t1');
  });

  test('opportunities include trends with recommended actions', () => {
    const t1 = makeTrend({ id: 't1', recommendedActions: ['action'] });
    const summary = generateInsightSummary([t1]);
    expect(summary.opportunities.map(t => t.id)).toContain('t1');
  });
});
