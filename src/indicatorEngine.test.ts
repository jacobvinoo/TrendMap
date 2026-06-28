import { describe, it, expect } from 'vitest';
import { generateLeadingIndicators } from './indicatorEngine';
import type { Assumption } from './types';

const ASSUMPTIONS: Assumption[] = [
  {
    id: 'assumption-t1-customer_behaviour',
    trendId: 't1',
    statement: 'Customers will actively engage with AI grocery search',
    assumptionType: 'customer_behaviour',
    confidenceScore: 0.65,
    importanceScore: 0.85,
    status: 'untested',
    relatedSignalIds: ['sig1'],
    relatedIndicatorIds: [],
    evidenceSummary: 'Based on survey data',
  },
  {
    id: 'assumption-t1-technology_readiness',
    trendId: 't1',
    statement: 'AI search technology will be production-ready',
    assumptionType: 'technology_readiness',
    confidenceScore: 0.6,
    importanceScore: 0.8,
    status: 'untested',
    relatedSignalIds: [],
    relatedIndicatorIds: [],
    evidenceSummary: 'Emerging maturity stage',
  },
  {
    id: 'assumption-t1-regulation',
    trendId: 't1',
    statement: 'Regulation will remain permissive',
    assumptionType: 'regulation',
    confidenceScore: 0.7,
    importanceScore: 0.7,
    status: 'untested',
    relatedSignalIds: [],
    relatedIndicatorIds: [],
    evidenceSummary: 'No current regulatory blockers',
  },
];

describe('generateLeadingIndicators', () => {
  it('generates at least one leading indicator per assumption', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS);
    const uniqueAssumptions = [...new Set(indicators.map(li => li.assumptionId))];
    expect(uniqueAssumptions.length).toBe(3);
  });

  it('links each indicator to its parent assumption', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS);
    expect(indicators.every(li => ASSUMPTIONS.some(a => a.id === li.assumptionId))).toBe(true);
  });

  it('generates customer-type indicators for customer_behaviour assumptions', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS.filter(a => a.assumptionType === 'customer_behaviour'));
    expect(indicators.some(li => li.indicatorType === 'customer')).toBe(true);
  });

  it('generates technology-type indicators for technology_readiness assumptions', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS.filter(a => a.assumptionType === 'technology_readiness'));
    expect(indicators.some(li => li.indicatorType === 'technology')).toBe(true);
  });

  it('generates regulatory-type indicators for regulation assumptions', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS.filter(a => a.assumptionType === 'regulation'));
    expect(indicators.some(li => li.indicatorType === 'regulatory')).toBe(true);
  });

  it('each indicator has a non-empty monitoring question', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS);
    expect(indicators.every(li => li.monitoringQuestion.length > 0)).toBe(true);
  });

  it('each indicator has a non-empty threshold', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS);
    expect(indicators.every(li => li.threshold.length > 0)).toBe(true);
  });

  it('each indicator starts with not_started status', () => {
    const indicators = generateLeadingIndicators(ASSUMPTIONS);
    expect(indicators.every(li => li.currentStatus === 'not_started')).toBe(true);
  });

  it('is deterministic — same input produces same ids', () => {
    const r1 = generateLeadingIndicators(ASSUMPTIONS);
    const r2 = generateLeadingIndicators(ASSUMPTIONS);
    expect(r1.map(li => li.id)).toEqual(r2.map(li => li.id));
  });

  it('returns empty array for empty input', () => {
    expect(generateLeadingIndicators([])).toHaveLength(0);
  });
});
