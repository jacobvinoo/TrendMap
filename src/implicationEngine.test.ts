import { describe, it, expect } from 'vitest';
import { generateStrategicImplications } from './implicationEngine';
import type { Trend, StrategicContext } from './types';

const mockContext: StrategicContext = {
  id: 'ctx1',
  industryProfileId: 'ind-1',
  companyName: 'Woolworths NZ',
  businessModel: 'Online grocery retailer',
  targetCustomers: ['Home shoppers', 'Busy families'],
  strategicGoals: ['Improve search conversion', 'Reduce zero-result searches'],
  currentCapabilities: ['Keyword search', 'Basic personalisation'],
  constraints: ['Data quality', 'Limited capacity'],
  riskAppetite: 'medium',
  planningHorizons: ['12 months'],
};

const highImpactTrend: Trend = {
  id: 't1',
  name: 'AI-assisted grocery discovery',
  status: 'approved',
  confidenceScore: 0.85,
  momentumScore: 0.8,
  impactScore: 0.92,
  likelihoodScore: 0.8,
  horizon: 'short',
  maturityStage: 'emerging',
  summary: 'AI enables natural language product discovery',
  relatedSignalIds: ['sig1', 'sig2'],
  drivers: ['Improving NLP', 'Consumer AI comfort'],
  blockers: ['Data quality'],
  whatNeedsToBeTrue: [],
  leadingIndicators: [],
  monitoringQuestions: [],
  recommendedActions: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const lowImpactTrend: Trend = {
  id: 't2',
  name: 'Minor packaging shift',
  status: 'approved',
  confidenceScore: 0.5,
  momentumScore: 0.3,
  impactScore: 0.2,
  likelihoodScore: 0.4,
  horizon: 'long',
  maturityStage: 'speculative',
  summary: 'Minor change in packaging',
  relatedSignalIds: [],
  drivers: [],
  blockers: [],
  whatNeedsToBeTrue: [],
  leadingIndicators: [],
  monitoringQuestions: [],
  recommendedActions: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('generateStrategicImplications', () => {
  it('only generates implications for approved trends', () => {
    const rejected = { ...highImpactTrend, id: 't99', status: 'rejected' as const };
    const implications = generateStrategicImplications([highImpactTrend, rejected], mockContext);
    expect(implications.every(si => si.trendId !== 't99')).toBe(true);
  });

  it('generates at least one implication per approved trend', () => {
    const implications = generateStrategicImplications([highImpactTrend, lowImpactTrend], mockContext);
    const trendIds = [...new Set(implications.map(si => si.trendId))];
    expect(trendIds).toContain('t1');
    expect(trendIds).toContain('t2');
  });

  it('generates an opportunity implication for high-impact trends', () => {
    const implications = generateStrategicImplications([highImpactTrend], mockContext);
    expect(implications.some(si => si.implicationType === 'opportunity')).toBe(true);
  });

  it('generates a risk implication for trends with blockers', () => {
    const implications = generateStrategicImplications([highImpactTrend], mockContext);
    expect(implications.some(si => si.implicationType === 'risk')).toBe(true);
  });

  it('each implication has a non-empty title and summary', () => {
    const implications = generateStrategicImplications([highImpactTrend], mockContext);
    expect(implications.every(si => si.title.length > 0 && si.summary.length > 0)).toBe(true);
  });

  it('each implication has scores in range 0-1', () => {
    const implications = generateStrategicImplications([highImpactTrend], mockContext);
    for (const si of implications) {
      expect(si.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(si.urgencyScore).toBeLessThanOrEqual(1);
      expect(si.impactScore).toBeGreaterThanOrEqual(0);
      expect(si.impactScore).toBeLessThanOrEqual(1);
      expect(si.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(si.confidenceScore).toBeLessThanOrEqual(1);
    }
  });

  it('links evidence from the trend signals', () => {
    const implications = generateStrategicImplications([highImpactTrend], mockContext);
    const withEvidence = implications.filter(si => si.evidenceIds.length > 0);
    expect(withEvidence.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const r1 = generateStrategicImplications([highImpactTrend], mockContext);
    const r2 = generateStrategicImplications([highImpactTrend], mockContext);
    expect(r1.map(si => si.id)).toEqual(r2.map(si => si.id));
  });

  it('returns empty for no approved trends', () => {
    const candidate = { ...highImpactTrend, status: 'candidate' as const };
    expect(generateStrategicImplications([candidate], mockContext)).toHaveLength(0);
  });
});
