import { describe, it, expect } from 'vitest';
import { generateScenarios } from './scenarioEngine';
import type { StrategicContext, StrategicImplication, Assumption, LeadingIndicator } from './types';

const mockContext: StrategicContext = {
  id: 'ctx1', industryProfileId: 'ind-1', companyName: 'Woolworths NZ',
  businessModel: 'Online grocery', targetCustomers: ['Shoppers'],
  strategicGoals: ['Improve search'], currentCapabilities: ['Keyword search'],
  constraints: ['Capacity'], riskAppetite: 'medium', planningHorizons: ['12 months'],
};

const opportunity: StrategicImplication = {
  id: 'si-opp', trendId: 't1', implicationType: 'opportunity',
  title: 'AI search opportunity', summary: 'Boost conversion via AI',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.8, impactScore: 0.9, confidenceScore: 0.75, evidenceIds: ['sig1'],
};

const threat: StrategicImplication = {
  id: 'si-thr', trendId: 't1', implicationType: 'threat',
  title: 'Competitor AI threat', summary: 'Competitors moving faster',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.7, impactScore: 0.75, confidenceScore: 0.65, evidenceIds: [],
};

const assumption: Assumption = {
  id: 'a1', trendId: 't1', statement: 'Customers will adopt AI search',
  assumptionType: 'customer_behaviour', confidenceScore: 0.65,
  importanceScore: 0.8, status: 'untested', relatedSignalIds: [],
  relatedIndicatorIds: [], evidenceSummary: '',
};

const indicator: LeadingIndicator = {
  id: 'li1', assumptionId: 'a1', name: 'Adoption signal',
  description: 'Tracks adoption', indicatorType: 'customer',
  currentStatus: 'weak_signal', threshold: 'Some threshold',
  monitoringQuestion: 'How many?', relatedSourceIds: [],
};

describe('generateScenarios', () => {
  it('generates at least 3 scenarios for rich inputs', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    expect(scenarios.length).toBeGreaterThanOrEqual(3);
  });

  it('generates an upside scenario when opportunity implication exists', () => {
    const scenarios = generateScenarios([opportunity], [assumption], [indicator], mockContext);
    expect(scenarios.some(s => s.scenarioType === 'upside')).toBe(true);
  });

  it('generates a base_case scenario', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    expect(scenarios.some(s => s.scenarioType === 'base_case')).toBe(true);
  });

  it('generates a downside scenario when threat implication exists', () => {
    const scenarios = generateScenarios([threat], [assumption], [indicator], mockContext);
    expect(scenarios.some(s => s.scenarioType === 'downside')).toBe(true);
  });

  it('each scenario has a non-empty name and summary', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    expect(scenarios.every(s => s.name.length > 0 && s.summary.length > 0)).toBe(true);
  });

  it('each scenario has at least one trigger condition', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    expect(scenarios.every(s => s.triggerConditions.length > 0)).toBe(true);
  });

  it('each scenario links early warning indicators', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    const withIndicators = scenarios.filter(s => s.earlyWarningIndicators.length > 0);
    expect(withIndicators.length).toBeGreaterThan(0);
  });

  it('each scenario has scores in 0-1 range', () => {
    const scenarios = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    for (const s of scenarios) {
      expect(s.probabilityScore).toBeGreaterThanOrEqual(0);
      expect(s.probabilityScore).toBeLessThanOrEqual(1);
      expect(s.impactScore).toBeGreaterThanOrEqual(0);
      expect(s.impactScore).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic', () => {
    const r1 = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    const r2 = generateScenarios([opportunity, threat], [assumption], [indicator], mockContext);
    expect(r1.map(s => s.id)).toEqual(r2.map(s => s.id));
  });

  it('returns at least a base_case scenario even with minimal inputs', () => {
    const scenarios = generateScenarios([], [], [], mockContext);
    expect(scenarios.some(s => s.scenarioType === 'base_case')).toBe(true);
  });
});
