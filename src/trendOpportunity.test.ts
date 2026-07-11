import { describe, expect, it } from 'vitest';
import { buildYearImpactSeries, estimateImpactMonth, estimateTrendOpportunity, estimateTrendOpportunities, sizeBusinessOpportunity } from './trendOpportunity';
import type { Trend } from './types';

function trend(patch: Partial<Trend> = {}): Trend {
  return {
    id: 'trend-1',
    name: 'AI-assisted grocery discovery',
    summary: 'AI discovery improves shopper search and basket building.',
    status: 'approved',
    horizon: '6-12 months',
    likelihoodScore: 0.8,
    confidenceScore: 0.7,
    momentumScore: 0.6,
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
    ...patch,
  };
}

describe('trend opportunity estimates', () => {
  it('estimates impact month from common horizon labels', () => {
    expect(estimateImpactMonth('6-12 months')).toBe(12);
    expect(estimateImpactMonth('short')).toBe(6);
    expect(estimateImpactMonth('medium')).toBe(18);
    expect(estimateImpactMonth('long')).toBe(36);
    expect(estimateImpactMonth('2-3 years')).toBe(36);
  });

  it('works backward from likely impact window for roadmap timing', () => {
    const estimate = estimateTrendOpportunity(trend());
    expect(estimate.impactLabel).toBe('6-12 months');
    expect(estimate.workbackLabel).toBe('Start now');
    expect(estimate.opportunityBand).toBe('Transformational');
  });

  it('adds directional market, revenue and cost interpretation', () => {
    const estimate = estimateTrendOpportunity(trend({ impactScore: 0.95, likelihoodScore: 0.95, confidenceScore: 0.9 }));
    expect(estimate.marketSizeProxy).toMatch(/addressable|category/i);
    expect(estimate.revenuePotential).toMatch(/revenue/i);
    expect(estimate.costReductionPotential).toMatch(/cost|productivity|efficiency/i);
  });

  it('only estimates approved trends and sorts them by impact window', () => {
    const estimates = estimateTrendOpportunities([
      trend({ id: 'later', horizon: '24-36 months' }),
      trend({ id: 'candidate', status: 'candidate' }),
      trend({ id: 'soon', horizon: '0-6 months' }),
    ]);

    expect(estimates.map(item => item.trendId)).toEqual(['soon', 'later']);
  });

  it('projects yearly impact bubble size toward the impact year', () => {
    const estimate = estimateTrendOpportunity(trend({ horizon: '24-36 months' }));
    const series = buildYearImpactSeries(estimate, 2026, 5);

    expect(series.map(point => point.year)).toEqual([2026, 2027, 2028, 2029, 2030]);
    expect(series[0].projectedImpactScore).toBeLessThan(series[2].projectedImpactScore);
    expect(series[2].isImpactYear).toBe(true);
  });

  it('uses business inputs to calculate directional market sizing', () => {
    const estimate = estimateTrendOpportunity(trend({ impactScore: 0.8, likelihoodScore: 0.8, confidenceScore: 0.8, momentumScore: 0.8 }));
    const sizing = sizeBusinessOpportunity(estimate, {
      onlineGroceryRevenue: 100_000_000,
      searchToCartConversion: 10,
      recommendationAttributedSales: 8_000_000,
      substitutionRate: 4,
      churnRate: 10,
      complaintsRefunds: 500_000,
      retailMediaRevenue: 2_000_000,
    });

    expect(sizing.addressableRevenueBase).toBeGreaterThan(0);
    expect(sizing.revenueUpside).toBeGreaterThan(0);
    expect(sizing.costRiskReduction).toBeGreaterThan(0);
    expect(sizing.totalOpportunity).toBeCloseTo(sizing.revenueUpside + sizing.costRiskReduction, 2);
    expect(sizing.sizingSummary).toMatch(/directional annual opportunity/i);
  });
});
