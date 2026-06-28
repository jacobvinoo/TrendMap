import { describe, it, expect } from 'vitest';
import {
  isValidStrategicContext,
  isValidAssumption,
  isValidLeadingIndicator,
  isValidStrategicImplication,
  isValidScenario,
  isValidStrategicOption,
  isValidDecisionBrief,
  isValidRoadmapItem,
} from './validation';

// ---- StrategicContext ----
describe('isValidStrategicContext', () => {
  const valid = {
    id: 'sc1',
    industryProfileId: 'ind1',
    companyName: 'Woolworths NZ',
    businessModel: 'Online grocery retailer',
    targetCustomers: ['shoppers'],
    strategicGoals: ['Improve search conversion'],
    currentCapabilities: ['Keyword search'],
    constraints: ['Limited capacity'],
    riskAppetite: 'medium' as const,
    planningHorizons: ['1 year'],
  };

  it('returns true for a valid StrategicContext', () => expect(isValidStrategicContext(valid)).toBe(true));
  it('returns false when companyName is empty', () => expect(isValidStrategicContext({ ...valid, companyName: '' })).toBe(false));
  it('returns false when riskAppetite is invalid', () => expect(isValidStrategicContext({ ...valid, riskAppetite: 'extreme' as any })).toBe(false));
  it('returns false when strategicGoals is empty', () => expect(isValidStrategicContext({ ...valid, strategicGoals: [] })).toBe(false));
  it('returns false when id is missing', () => expect(isValidStrategicContext({ ...valid, id: '' })).toBe(false));
});

// ---- Assumption ----
describe('isValidAssumption', () => {
  const valid = {
    id: 'a1',
    trendId: 't1',
    statement: 'Customers will adopt AI grocery search',
    assumptionType: 'customer_behaviour' as const,
    confidenceScore: 0.7,
    importanceScore: 0.9,
    status: 'untested' as const,
    relatedSignalIds: [],
    relatedIndicatorIds: [],
    evidenceSummary: 'Based on survey data',
  };

  it('returns true for a valid Assumption', () => expect(isValidAssumption(valid)).toBe(true));
  it('returns false when trendId is empty', () => expect(isValidAssumption({ ...valid, trendId: '' })).toBe(false));
  it('returns false when statement is empty', () => expect(isValidAssumption({ ...valid, statement: '' })).toBe(false));
  it('returns false when assumptionType is invalid', () => expect(isValidAssumption({ ...valid, assumptionType: 'unknown' as any })).toBe(false));
  it('returns false when confidenceScore > 1', () => expect(isValidAssumption({ ...valid, confidenceScore: 1.5 })).toBe(false));
  it('returns false when importanceScore < 0', () => expect(isValidAssumption({ ...valid, importanceScore: -0.1 })).toBe(false));
  it('returns false when status is invalid', () => expect(isValidAssumption({ ...valid, status: 'unknown' as any })).toBe(false));
});

// ---- LeadingIndicator ----
describe('isValidLeadingIndicator', () => {
  const valid = {
    id: 'li1',
    assumptionId: 'a1',
    name: 'Retail AI search adoption rate',
    description: 'Tracks how many retailers have deployed AI search',
    indicatorType: 'adoption' as const,
    currentStatus: 'weak_signal' as const,
    threshold: 'More than 3 major retailers go live',
    monitoringQuestion: 'How many major retailers have launched AI grocery search?',
    relatedSourceIds: ['src1'],
  };

  it('returns true for a valid LeadingIndicator', () => expect(isValidLeadingIndicator(valid)).toBe(true));
  it('returns false when assumptionId is empty', () => expect(isValidLeadingIndicator({ ...valid, assumptionId: '' })).toBe(false));
  it('returns false when name is empty', () => expect(isValidLeadingIndicator({ ...valid, name: '' })).toBe(false));
  it('returns false when indicatorType is invalid', () => expect(isValidLeadingIndicator({ ...valid, indicatorType: 'unknown' as any })).toBe(false));
  it('returns false when currentStatus is invalid', () => expect(isValidLeadingIndicator({ ...valid, currentStatus: 'unknown' as any })).toBe(false));
  it('returns false when monitoringQuestion is empty', () => expect(isValidLeadingIndicator({ ...valid, monitoringQuestion: '' })).toBe(false));
});

// ---- StrategicImplication ----
describe('isValidStrategicImplication', () => {
  const valid = {
    id: 'si1',
    trendId: 't1',
    implicationType: 'opportunity' as const,
    title: 'Better discovery via AI search',
    summary: 'AI search improves conversion',
    affectedCapabilities: ['Search'],
    affectedCustomerSegments: ['Shoppers'],
    urgencyScore: 0.8,
    impactScore: 0.9,
    confidenceScore: 0.7,
    evidenceIds: ['sig1'],
  };

  it('returns true for a valid StrategicImplication', () => expect(isValidStrategicImplication(valid)).toBe(true));
  it('returns false when trendId is empty', () => expect(isValidStrategicImplication({ ...valid, trendId: '' })).toBe(false));
  it('returns false when title is empty', () => expect(isValidStrategicImplication({ ...valid, title: '' })).toBe(false));
  it('returns false when implicationType is invalid', () => expect(isValidStrategicImplication({ ...valid, implicationType: 'unknown' as any })).toBe(false));
  it('returns false when urgencyScore > 1', () => expect(isValidStrategicImplication({ ...valid, urgencyScore: 1.2 })).toBe(false));
  it('returns false when impactScore < 0', () => expect(isValidStrategicImplication({ ...valid, impactScore: -0.1 })).toBe(false));
});

// ---- Scenario ----
describe('isValidScenario', () => {
  const valid = {
    id: 'scen1',
    name: 'AI Goes Mainstream',
    horizon: '2 years',
    summary: 'AI search becomes the primary grocery interface',
    scenarioType: 'upside' as const,
    triggerConditions: ['3+ major retailers adopt AI search'],
    assumptions: ['a1'],
    implications: ['si1'],
    probabilityScore: 0.6,
    impactScore: 0.9,
    confidenceScore: 0.7,
    earlyWarningIndicators: ['li1'],
  };

  it('returns true for a valid Scenario', () => expect(isValidScenario(valid)).toBe(true));
  it('returns false when name is empty', () => expect(isValidScenario({ ...valid, name: '' })).toBe(false));
  it('returns false when scenarioType is invalid', () => expect(isValidScenario({ ...valid, scenarioType: 'unknown' as any })).toBe(false));
  it('returns false when triggerConditions is empty', () => expect(isValidScenario({ ...valid, triggerConditions: [] })).toBe(false));
  it('returns false when probabilityScore > 1', () => expect(isValidScenario({ ...valid, probabilityScore: 1.1 })).toBe(false));
  it('returns false when horizon is empty', () => expect(isValidScenario({ ...valid, horizon: '' })).toBe(false));
});

// ---- StrategicOption ----
describe('isValidStrategicOption', () => {
  const valid = {
    id: 'opt1',
    title: 'Run AI grocery search pilot',
    description: 'Pilot conversational search on high-traffic category pages',
    optionType: 'experiment' as const,
    linkedTrendIds: ['t1'],
    linkedScenarioIds: [],
    linkedAssumptionIds: ['a1'],
    expectedBenefits: ['Improved search conversion'],
    keyRisks: ['Customer trust'],
    requiredCapabilities: ['Semantic search engine'],
    estimatedEffort: 'medium' as const,
    timeToValue: '3_months' as const,
    impactScore: 0.85,
    feasibilityScore: 0.7,
    urgencyScore: 0.8,
    confidenceScore: 0.75,
    priorityScore: 0.8,
    recommendedNextStep: 'Identify a category page for the pilot',
  };

  it('returns true for a valid StrategicOption', () => expect(isValidStrategicOption(valid)).toBe(true));
  it('returns false when title is empty', () => expect(isValidStrategicOption({ ...valid, title: '' })).toBe(false));
  it('returns false when optionType is invalid', () => expect(isValidStrategicOption({ ...valid, optionType: 'unknown' as any })).toBe(false));
  it('returns false when estimatedEffort is invalid', () => expect(isValidStrategicOption({ ...valid, estimatedEffort: 'extreme' as any })).toBe(false));
  it('returns false when timeToValue is invalid', () => expect(isValidStrategicOption({ ...valid, timeToValue: 'never' as any })).toBe(false));
  it('returns false when no linked trends and no linked scenarios', () => expect(isValidStrategicOption({ ...valid, linkedTrendIds: [], linkedScenarioIds: [] })).toBe(false));
  it('returns false when impactScore > 1', () => expect(isValidStrategicOption({ ...valid, impactScore: 1.1 })).toBe(false));
});

// ---- DecisionBrief ----
describe('isValidDecisionBrief', () => {
  const valid = {
    id: 'db1',
    strategicContextId: 'sc1',
    generatedAt: '2026-01-01T00:00:00Z',
    headline: 'Strategic brief for Q1',
    executiveSummary: 'Three major opportunities identified',
    topOpportunities: ['si1'],
    topThreats: ['si2'],
    recommendedOptions: ['opt1'],
    assumptionsToTest: ['a1'],
    indicatorsToMonitor: ['li1'],
    evidenceIds: ['sig1'],
  };

  it('returns true for a valid DecisionBrief', () => expect(isValidDecisionBrief(valid)).toBe(true));
  it('returns false when generatedAt is missing', () => expect(isValidDecisionBrief({ ...valid, generatedAt: '' })).toBe(false));
  it('returns false when headline is empty', () => expect(isValidDecisionBrief({ ...valid, headline: '' })).toBe(false));
  it('returns false when strategicContextId is empty', () => expect(isValidDecisionBrief({ ...valid, strategicContextId: '' })).toBe(false));
});

// ---- RoadmapItem ----
describe('isValidRoadmapItem', () => {
  const valid = {
    id: 'rm1',
    strategicOptionId: 'opt1',
    title: 'Launch AI search pilot',
    horizon: 'now' as const,
    owner: 'Product team',
    status: 'proposed' as const,
    successMetric: 'Reduce zero-result searches by 20%',
    linkedIndicatorIds: ['li1'],
  };

  it('returns true for a valid RoadmapItem', () => expect(isValidRoadmapItem(valid)).toBe(true));
  it('returns false when strategicOptionId is empty', () => expect(isValidRoadmapItem({ ...valid, strategicOptionId: '' })).toBe(false));
  it('returns false when title is empty', () => expect(isValidRoadmapItem({ ...valid, title: '' })).toBe(false));
  it('returns false when horizon is invalid', () => expect(isValidRoadmapItem({ ...valid, horizon: 'someday' as any })).toBe(false));
  it('returns false when status is invalid', () => expect(isValidRoadmapItem({ ...valid, status: 'unknown' as any })).toBe(false));
  it('returns false when successMetric is empty', () => expect(isValidRoadmapItem({ ...valid, successMetric: '' })).toBe(false));
});
