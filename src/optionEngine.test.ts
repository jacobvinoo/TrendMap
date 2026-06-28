import { describe, it, expect } from 'vitest';
import { generateStrategicOptions } from './optionEngine';
import type { StrategicContext, StrategicImplication, Scenario, Assumption } from './types';

const mockContext: StrategicContext = {
  id: 'ctx1', industryProfileId: 'ind-1', companyName: 'Woolworths NZ',
  businessModel: 'Online grocery', targetCustomers: ['Shoppers'],
  strategicGoals: ['Improve search conversion'],
  currentCapabilities: ['Keyword search', 'Basic personalisation'],
  constraints: ['Limited capacity'], riskAppetite: 'medium',
  planningHorizons: ['12 months'],
};

const opportunity: StrategicImplication = {
  id: 'si-opp', trendId: 't1', implicationType: 'opportunity',
  title: 'AI search opportunity', summary: 'Boost conversion via AI',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.8, impactScore: 0.9, confidenceScore: 0.75, evidenceIds: ['sig1'],
};

const threat: StrategicImplication = {
  id: 'si-thr', trendId: 't1', implicationType: 'threat',
  title: 'Competitor moves faster', summary: 'Risk of falling behind',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.7, impactScore: 0.75, confidenceScore: 0.65, evidenceIds: [],
};

const upsideScenario: Scenario = {
  id: 'scenario-upside-ctx1', name: 'Best case', horizon: '12 months',
  summary: 'Company leads', scenarioType: 'upside',
  triggerConditions: ['AI search adoption accelerates'],
  assumptions: ['a1'], implications: ['si-opp'],
  probabilityScore: 0.6, impactScore: 0.9, confidenceScore: 0.7,
  earlyWarningIndicators: ['li1'],
};

const assumption: Assumption = {
  id: 'a1', trendId: 't1', statement: 'Customers will adopt AI search',
  assumptionType: 'customer_behaviour', confidenceScore: 0.65,
  importanceScore: 0.8, status: 'untested', relatedSignalIds: [],
  relatedIndicatorIds: [], evidenceSummary: '',
};

describe('generateStrategicOptions', () => {
  it('generates at least one option for opportunity implications', () => {
    const options = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    expect(options.length).toBeGreaterThan(0);
  });

  it('generates a defend/monitor option for threat implications', () => {
    const options = generateStrategicOptions([threat], [], [assumption], mockContext);
    const types = options.map(o => o.optionType);
    expect(types.some(t => t === 'defend' || t === 'monitor')).toBe(true);
  });

  it('each option has a non-empty title and description', () => {
    const options = generateStrategicOptions([opportunity, threat], [upsideScenario], [assumption], mockContext);
    expect(options.every(o => o.title.length > 0 && o.description.length > 0)).toBe(true);
  });

  it('each option has scores in 0-1 range', () => {
    const options = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    for (const o of options) {
      expect(o.impactScore).toBeGreaterThanOrEqual(0);
      expect(o.impactScore).toBeLessThanOrEqual(1);
      expect(o.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(o.feasibilityScore).toBeLessThanOrEqual(1);
      expect(o.priorityScore).toBeGreaterThanOrEqual(0);
      expect(o.priorityScore).toBeLessThanOrEqual(1);
    }
  });

  it('each option links to at least one trend or scenario', () => {
    const options = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    expect(options.every(o => o.linkedTrendIds.length > 0 || o.linkedScenarioIds.length > 0)).toBe(true);
  });

  it('options include a recommendedNextStep', () => {
    const options = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    expect(options.every(o => typeof o.recommendedNextStep === 'string')).toBe(true);
  });

  it('is deterministic', () => {
    const r1 = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    const r2 = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    expect(r1.map(o => o.id)).toEqual(r2.map(o => o.id));
  });

  it('respects risk appetite — medium context generates experiment options', () => {
    const options = generateStrategicOptions([opportunity], [upsideScenario], [assumption], mockContext);
    expect(options.some(o => o.optionType === 'experiment')).toBe(true);
  });

  it('returns empty when no implications or scenarios provided', () => {
    const options = generateStrategicOptions([], [], [], mockContext);
    expect(options).toHaveLength(0);
  });
});
