import { describe, it, expect } from 'vitest';
import { generateDecisionBrief } from './decisionBriefEngine';
import type {
  StrategicContext, StrategicImplication, StrategicOption,
  Assumption, LeadingIndicator,
} from './types';

const mockContext: StrategicContext = {
  id: 'ctx1', industryProfileId: 'ind-1', companyName: 'Woolworths NZ',
  businessModel: 'Online grocery', targetCustomers: ['Shoppers'],
  strategicGoals: ['Improve search conversion'],
  currentCapabilities: ['Keyword search'], constraints: ['Capacity'],
  riskAppetite: 'medium', planningHorizons: ['12 months'],
};

const opportunity: StrategicImplication = {
  id: 'si-opp', trendId: 't1', implicationType: 'opportunity',
  title: 'AI search opportunity', summary: 'Boost conversion',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.8, impactScore: 0.9, confidenceScore: 0.75, evidenceIds: ['sig1'],
};

const threat: StrategicImplication = {
  id: 'si-thr', trendId: 't1', implicationType: 'threat',
  title: 'Competitor threat', summary: 'Competitors ahead',
  affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
  urgencyScore: 0.7, impactScore: 0.75, confidenceScore: 0.65, evidenceIds: [],
};

const option1: StrategicOption = {
  id: 'opt-1', title: 'Pilot AI search', description: 'Run experiment',
  optionType: 'experiment', linkedTrendIds: ['t1'], linkedScenarioIds: [],
  linkedAssumptionIds: ['a1'], expectedBenefits: ['Improved conversion'],
  keyRisks: ['Trust'], requiredCapabilities: ['Semantic search'],
  estimatedEffort: 'medium', timeToValue: '3_months',
  impactScore: 0.9, feasibilityScore: 0.7, urgencyScore: 0.8,
  confidenceScore: 0.75, priorityScore: 0.82,
  recommendedNextStep: 'Define pilot scope',
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

describe('generateDecisionBrief', () => {
  it('returns a decision brief with a non-empty headline', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.headline.length).toBeGreaterThan(0);
  });

  it('returns a non-empty executive summary', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.executiveSummary.length).toBeGreaterThan(0);
  });

  it('links the strategic context id', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.strategicContextId).toBe('ctx1');
  });

  it('includes top opportunities (opportunity implication ids)', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.topOpportunities).toContain('si-opp');
  });

  it('includes top threats (threat implication ids)', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.topThreats).toContain('si-thr');
  });

  it('includes recommended options sorted by priority', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.recommendedOptions).toContain('opt-1');
  });

  it('includes assumptions to test', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.assumptionsToTest).toContain('a1');
  });

  it('includes indicators to monitor', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.indicatorsToMonitor).toContain('li1');
  });

  it('sets a generatedAt timestamp', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.generatedAt).toBeTruthy();
    expect(typeof brief.generatedAt).toBe('string');
  });

  it('collects evidence ids from implications', () => {
    const brief = generateDecisionBrief(mockContext, [opportunity, threat], [option1], [assumption], [indicator]);
    expect(brief.evidenceIds).toContain('sig1');
  });
});
