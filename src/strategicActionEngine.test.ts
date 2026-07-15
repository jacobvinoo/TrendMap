import { describe, expect, it } from 'vitest';
import { createStrategicOptionFromTrend } from './strategicActionEngine';
import type { Trend } from './types';

const trend: Trend = {
  id: 'trend-ai-search',
  name: 'AI-assisted grocery discovery',
  summary: 'AI search is improving grocery discovery and basket building.',
  status: 'approved',
  horizon: '12-24 months',
  likelihoodScore: 0.78,
  confidenceScore: 0.82,
  impactScore: 0.88,
  momentumScore: 0.76,
  maturityStage: 'emerging',
  relatedSignalIds: ['sig-1'],
  drivers: ['Zero-result search pressure', 'Customer demand for convenience'],
  blockers: ['Product data quality', 'Trust in AI recommendations'],
  whatNeedsToBeTrue: ['AI discovery improves search-to-cart conversion'],
  leadingIndicators: ['Search-to-cart conversion', 'Zero-result rate'],
  monitoringQuestions: ['Which missions benefit most from AI search?'],
  recommendedActions: ['Run a category-level AI search pilot'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('createStrategicOptionFromTrend', () => {
  it('turns an approved trend into a proposed strategic option with business-action context', () => {
    const option = createStrategicOptionFromTrend(trend, { evidenceCount: 4 });

    expect(option.id).toBe('option-from-trend-ai-search');
    expect(option.title).toMatch(/AI-assisted grocery discovery/i);
    expect(option.linkedTrendIds).toEqual(['trend-ai-search']);
    expect(option.optionType).toBe('experiment');
    expect(option.expectedBenefits.join(' ')).toMatch(/search-to-cart conversion/i);
    expect(option.keyRisks.join(' ')).toMatch(/Product data quality/i);
    expect(option.recommendedNextStep).toMatch(/Run a category-level AI search pilot/i);
    expect(option.status).toBe('proposed');
    expect(option.priorityScore).toBeGreaterThan(0.7);
  });
});
