import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStrategicContext,
  saveStrategicContext,
  getAssumptions,
  saveAssumptions,
  updateAssumption,
  getLeadingIndicators,
  saveLeadingIndicators,
  updateLeadingIndicator,
  getStrategicImplications,
  saveStrategicImplications,
  getScenarios,
  saveScenarios,
  getStrategicOptions,
  saveStrategicOptions,
  updateStrategicOption,
  getDecisionBriefs,
  saveDecisionBrief,
  getRoadmapItems,
  saveRoadmapItems,
  updateRoadmapItem,
} from './mockRepository';
import type {
  StrategicContext, Assumption, LeadingIndicator, StrategicImplication,
  Scenario, StrategicOption, DecisionBrief, RoadmapItem,
} from './types';

describe('Phase 3 Repository', () => {
  beforeEach(() => {
    globalThis.__mockRepoState = {
      industryProfile: null,
      sources: [],
      documents: [],
      signals: [],
      trends: [],
      evidences: [],
      rules: [],
      runs: [],
      snapshots: [],
      changeEvents: [],
      trendScoreSnapshots: [],
      trendScoreChanges: [],
      alerts: [],
      summaries: [],
      strategicContext: null,
      assumptions: [],
      leadingIndicators: [],
      strategicImplications: [],
      scenarios: [],
      strategicOptions: [],
      decisionBriefs: [],
      roadmapItems: [],
    };
  });

  // Strategic Context
  it('saves and retrieves strategic context', () => {
    const ctx: StrategicContext = {
      id: 'sc1', industryProfileId: 'ind1', companyName: 'Woolworths NZ',
      businessModel: 'Online grocery', targetCustomers: ['shoppers'],
      strategicGoals: ['Improve search'], currentCapabilities: ['Search'],
      constraints: ['Capacity'], riskAppetite: 'medium', planningHorizons: ['1 year'],
    };
    saveStrategicContext(ctx);
    expect(getStrategicContext()).toEqual(ctx);
  });

  // Assumptions
  it('saves assumptions', () => {
    const a: Assumption = {
      id: 'a1', trendId: 't1', statement: 'Customers will adopt AI search',
      assumptionType: 'customer_behaviour', confidenceScore: 0.7,
      importanceScore: 0.9, status: 'untested',
      relatedSignalIds: [], relatedIndicatorIds: [], evidenceSummary: 'Based on survey',
    };
    saveAssumptions([a]);
    expect(getAssumptions()).toHaveLength(1);
    expect(getAssumptions()[0].id).toBe('a1');
  });

  it('updates assumption status', () => {
    const a: Assumption = {
      id: 'a1', trendId: 't1', statement: 'Test', assumptionType: 'economics',
      confidenceScore: 0.5, importanceScore: 0.5, status: 'untested',
      relatedSignalIds: [], relatedIndicatorIds: [], evidenceSummary: '',
    };
    saveAssumptions([a]);
    updateAssumption('a1', { status: 'supported' });
    expect(getAssumptions()[0].status).toBe('supported');
  });

  // Leading Indicators
  it('saves leading indicators', () => {
    const li: LeadingIndicator = {
      id: 'li1', assumptionId: 'a1', name: 'AI search adoption rate',
      description: 'How many retailers deploy AI search',
      indicatorType: 'adoption', currentStatus: 'weak_signal',
      threshold: '3+ retailers', monitoringQuestion: 'How many retailers?',
      relatedSourceIds: [],
    };
    saveLeadingIndicators([li]);
    expect(getLeadingIndicators()).toHaveLength(1);
  });

  it('updates indicator status', () => {
    const li: LeadingIndicator = {
      id: 'li1', assumptionId: 'a1', name: 'Test', description: '',
      indicatorType: 'customer', currentStatus: 'not_started',
      threshold: 'some', monitoringQuestion: 'some?', relatedSourceIds: [],
    };
    saveLeadingIndicators([li]);
    updateLeadingIndicator('li1', { currentStatus: 'emerging' });
    expect(getLeadingIndicators()[0].currentStatus).toBe('emerging');
  });

  // Implications
  it('saves strategic implications', () => {
    const si: StrategicImplication = {
      id: 'si1', trendId: 't1', implicationType: 'opportunity',
      title: 'Better discovery', summary: 'AI search improves conversion',
      affectedCapabilities: ['Search'], affectedCustomerSegments: ['Shoppers'],
      urgencyScore: 0.8, impactScore: 0.9, confidenceScore: 0.7, evidenceIds: [],
    };
    saveStrategicImplications([si]);
    expect(getStrategicImplications()).toHaveLength(1);
  });

  // Scenarios
  it('saves scenarios', () => {
    const sc: Scenario = {
      id: 'scen1', name: 'AI Goes Mainstream', horizon: '2 years',
      summary: 'AI becomes primary interface', scenarioType: 'upside',
      triggerConditions: ['3+ retailers adopt AI'],
      assumptions: ['a1'], implications: ['si1'],
      probabilityScore: 0.6, impactScore: 0.9, confidenceScore: 0.7,
      earlyWarningIndicators: ['li1'],
    };
    saveScenarios([sc]);
    expect(getScenarios()).toHaveLength(1);
  });

  // Strategic Options
  it('saves strategic options', () => {
    const opt: StrategicOption = {
      id: 'opt1', title: 'Run AI search pilot', description: 'Pilot on category pages',
      optionType: 'experiment', linkedTrendIds: ['t1'], linkedScenarioIds: [],
      linkedAssumptionIds: ['a1'], expectedBenefits: ['Better conversion'],
      keyRisks: ['Trust'], requiredCapabilities: ['Semantic search'],
      estimatedEffort: 'medium', timeToValue: '3_months',
      impactScore: 0.85, feasibilityScore: 0.7, urgencyScore: 0.8,
      confidenceScore: 0.75, priorityScore: 0.8,
      recommendedNextStep: 'Pick a pilot category',
    };
    saveStrategicOptions([opt]);
    expect(getStrategicOptions()).toHaveLength(1);
  });

  it('updates strategic option status', () => {
    const opt: StrategicOption = {
      id: 'opt1', title: 'Test', description: '', optionType: 'monitor',
      linkedTrendIds: ['t1'], linkedScenarioIds: [], linkedAssumptionIds: [],
      expectedBenefits: [], keyRisks: [], requiredCapabilities: [],
      estimatedEffort: 'low', timeToValue: 'now',
      impactScore: 0.5, feasibilityScore: 0.5, urgencyScore: 0.5,
      confidenceScore: 0.5, priorityScore: 0.5, recommendedNextStep: '',
    };
    saveStrategicOptions([opt]);
    updateStrategicOption('opt1', { status: 'accepted' });
    expect(getStrategicOptions()[0].status).toBe('accepted');
  });

  // Decision Briefs
  it('saves decision brief', () => {
    const brief: DecisionBrief = {
      id: 'db1', strategicContextId: 'sc1', generatedAt: '2026-01-01T00:00:00Z',
      headline: 'Q1 Strategic Brief', executiveSummary: 'Three opportunities identified',
      topOpportunities: ['si1'], topThreats: ['si2'], recommendedOptions: ['opt1'],
      assumptionsToTest: ['a1'], indicatorsToMonitor: ['li1'], evidenceIds: ['sig1'],
    };
    saveDecisionBrief(brief);
    expect(getDecisionBriefs()).toHaveLength(1);
    expect(getDecisionBriefs()[0].headline).toBe('Q1 Strategic Brief');
  });

  // Roadmap Items
  it('saves roadmap items', () => {
    const item: RoadmapItem = {
      id: 'rm1', strategicOptionId: 'opt1', title: 'Launch AI pilot',
      horizon: 'now', owner: 'Product', status: 'proposed',
      successMetric: 'Reduce zero-results by 20%', linkedIndicatorIds: ['li1'],
    };
    saveRoadmapItems([item]);
    expect(getRoadmapItems()).toHaveLength(1);
  });

  it('updates roadmap item status', () => {
    const item: RoadmapItem = {
      id: 'rm1', strategicOptionId: 'opt1', title: 'Test',
      horizon: 'next', owner: '', status: 'proposed',
      successMetric: 'Some metric', linkedIndicatorIds: [],
    };
    saveRoadmapItems([item]);
    updateRoadmapItem('rm1', { status: 'in_progress' });
    expect(getRoadmapItems()[0].status).toBe('in_progress');
  });
});
