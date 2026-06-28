import { describe, it, expect } from 'vitest';
import { generateAssumptionsFromTrends } from './assumptionEngine';
import type { Trend, StrategicContext } from './types';

const mockContext: StrategicContext = {
  id: 'ctx1',
  industryProfileId: 'ind-1',
  companyName: 'Woolworths NZ',
  businessModel: 'Online grocery retailer',
  targetCustomers: ['Home shoppers'],
  strategicGoals: ['Improve search conversion'],
  currentCapabilities: ['Keyword search'],
  constraints: ['Limited capacity'],
  riskAppetite: 'medium',
  planningHorizons: ['12 months'],
};

const approvedTrend: Trend = {
  id: 't1',
  name: 'AI-assisted grocery discovery',
  status: 'approved',
  confidenceScore: 0.8,
  momentumScore: 0.7,
  impactScore: 0.9,
  likelihoodScore: 0.75,
  horizon: 'short',
  maturityStage: 'emerging',
  summary: 'AI search helps shoppers find products via conversational queries',
  relatedSignalIds: ['sig1', 'sig2'],
  drivers: ['Improving NLP models', 'Growing consumer comfort with AI'],
  blockers: ['Data quality', 'Trust'],
  whatNeedsToBeTrue: [],
  leadingIndicators: [],
  monitoringQuestions: [],
  recommendedActions: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const candidateTrend: Trend = {
  id: 't2',
  name: 'Candidate Trend',
  status: 'candidate',
  confidenceScore: 0.4,
  momentumScore: 0.3,
  impactScore: 0.5,
  likelihoodScore: 0.4,
  horizon: 'long',
  maturityStage: 'speculative',
  summary: 'Some candidate',
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

const rejectedTrend: Trend = {
  ...candidateTrend,
  id: 't3',
  name: 'Rejected Trend',
  status: 'rejected',
};

describe('generateAssumptionsFromTrends', () => {
  it('only generates assumptions for approved trends', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend, candidateTrend, rejectedTrend], mockContext);
    const trendIds = [...new Set(assumptions.map(a => a.trendId))];
    expect(trendIds).toEqual(['t1']);
    expect(trendIds).not.toContain('t2');
    expect(trendIds).not.toContain('t3');
  });

  it('generates multiple assumption types per approved trend', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    const types = [...new Set(assumptions.map(a => a.assumptionType))];
    expect(types.length).toBeGreaterThanOrEqual(3);
  });

  it('generates customer_behaviour assumption', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.some(a => a.assumptionType === 'customer_behaviour')).toBe(true);
  });

  it('generates technology_readiness assumption', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.some(a => a.assumptionType === 'technology_readiness')).toBe(true);
  });

  it('each assumption links to a trend via trendId', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.every(a => a.trendId === 't1')).toBe(true);
  });

  it('each assumption has a confidenceScore between 0 and 1', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.every(a => a.confidenceScore >= 0 && a.confidenceScore <= 1)).toBe(true);
  });

  it('each assumption has an importanceScore between 0 and 1', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.every(a => a.importanceScore >= 0 && a.importanceScore <= 1)).toBe(true);
  });

  it('assumptions are deterministic (same input, same output)', () => {
    const a1 = generateAssumptionsFromTrends([approvedTrend], mockContext);
    const a2 = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(a1.map(a => a.id)).toEqual(a2.map(a => a.id));
    expect(a1.map(a => a.statement)).toEqual(a2.map(a => a.statement));
  });

  it('each assumption includes an evidence summary', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.every(a => typeof a.evidenceSummary === 'string')).toBe(true);
  });

  it('assumptions include related signal ids from the trend where available', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    const withSignals = assumptions.filter(a => a.relatedSignalIds.length > 0);
    expect(withSignals.length).toBeGreaterThan(0);
  });

  it('each assumption has status untested by default', () => {
    const assumptions = generateAssumptionsFromTrends([approvedTrend], mockContext);
    expect(assumptions.every(a => a.status === 'untested')).toBe(true);
  });

  it('generates no assumptions when no approved trends exist', () => {
    const assumptions = generateAssumptionsFromTrends([candidateTrend, rejectedTrend], mockContext);
    expect(assumptions).toHaveLength(0);
  });
});
