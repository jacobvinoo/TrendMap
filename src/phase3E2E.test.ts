/**
 * Phase 3 E2E Integration Test — Strategic Analysis Happy Path
 *
 * Tests the complete end-to-end flow:
 * approved trends → assumptions → indicators → implications → scenarios → options → brief
 *
 * All services used in sequence with realistic Woolworths NZ mock context.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveStrategicContext, saveAssumptions, saveLeadingIndicators,
  saveStrategicImplications, saveScenarios, saveStrategicOptions, saveDecisionBrief,
  getStrategicContext, getAssumptions, getLeadingIndicators,
  getStrategicImplications, getScenarios, getStrategicOptions, getDecisionBriefs,
} from './mockRepository';
import { generateAssumptionsFromTrends } from './assumptionEngine';
import { generateLeadingIndicators } from './indicatorEngine';
import { generateStrategicImplications } from './implicationEngine';
import { generateScenarios } from './scenarioEngine';
import { generateStrategicOptions } from './optionEngine';
import { generateDecisionBrief } from './decisionBriefEngine';
import { isValidStrategicContext, isValidAssumption, isValidLeadingIndicator,
         isValidStrategicImplication, isValidScenario, isValidStrategicOption,
         isValidDecisionBrief } from './validation';
import type { StrategicContext, Trend } from './types';

const WOOLWORTHS_CONTEXT: StrategicContext = {
  id: 'ctx-woolworths-nz',
  industryProfileId: 'ind-1',
  companyName: 'Woolworths NZ',
  businessModel: 'Online grocery retailer providing AI-enhanced discovery and search',
  targetCustomers: ['Home shoppers', 'Busy families', 'Health-conscious consumers'],
  strategicGoals: [
    'Improve search conversion',
    'Reduce zero-result searches',
    'Increase basket size',
    'Grow retail media revenue without damaging UX',
  ],
  currentCapabilities: ['Keyword search', 'Retail media placements', 'Basic personalisation'],
  constraints: ['Data quality varies', 'Sponsored placement may affect relevance', 'Limited capacity'],
  riskAppetite: 'medium',
  planningHorizons: ['3 months', '12 months', '24 months'],
};

const APPROVED_TRENDS: Trend[] = [
  {
    id: 'trend-ai-search', name: 'AI-assisted grocery discovery', status: 'approved',
    confidenceScore: 0.85, momentumScore: 0.8, impactScore: 0.92, likelihoodScore: 0.8,
    horizon: 'short', maturityStage: 'emerging',
    summary: 'AI enables natural language product discovery reducing zero-result searches',
    relatedSignalIds: ['sig1', 'sig2', 'sig3'],
    drivers: ['Improving NLP', 'Consumer AI comfort', 'Retailer investment'],
    blockers: ['Data quality', 'Trust in AI recommendations'],
    whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'trend-retail-media', name: 'Retail media maturation', status: 'approved',
    confidenceScore: 0.78, momentumScore: 0.72, impactScore: 0.75, likelihoodScore: 0.8,
    horizon: 'medium', maturityStage: 'growth',
    summary: 'Retail media networks maturing with improved targeting and measurement',
    relatedSignalIds: ['sig4'],
    drivers: ['Third-party cookie deprecation', 'First-party data value'],
    blockers: ['Customer privacy concerns'],
    whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
];

describe('Phase 3 E2E Happy Path — Woolworths NZ', () => {
  beforeEach(() => {
    globalThis.__mockRepoState = {
      industryProfile: null, sources: [], documents: [], signals: [],
      trends: [], evidences: [], rules: [], runs: [], snapshots: [],
      changeEvents: [], trendScoreSnapshots: [], trendScoreChanges: [],
      alerts: [], summaries: [],
      strategicContext: null, assumptions: [], leadingIndicators: [],
      strategicImplications: [], scenarios: [], strategicOptions: [],
      decisionBriefs: [], roadmapItems: [],   knowledgeGraph: { nodes: [], edges: [] },
    };
  });

  it('Step 1: context is saved and valid', () => {
    saveStrategicContext(WOOLWORTHS_CONTEXT);
    const ctx = getStrategicContext();
    expect(ctx).not.toBeNull();
    expect(isValidStrategicContext(ctx)).toBe(true);
    expect(ctx!.companyName).toBe('Woolworths NZ');
  });

  it('Step 2: assumptions are generated for all approved trends', () => {
    saveStrategicContext(WOOLWORTHS_CONTEXT);
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    expect(assumptions.length).toBeGreaterThan(0);
    expect(assumptions.every(a => isValidAssumption(a))).toBe(true);
    const trendIds = [...new Set(assumptions.map(a => a.trendId))];
    expect(trendIds).toContain('trend-ai-search');
    expect(trendIds).toContain('trend-retail-media');
  });

  it('Step 3: indicators are generated for all assumption types', () => {
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    saveAssumptions(assumptions);
    const indicators = generateLeadingIndicators(assumptions, []);
    expect(indicators.length).toBeGreaterThan(0);
    expect(indicators.every(li => isValidLeadingIndicator(li))).toBe(true);
    // All assumptions have at least one indicator
    const covered = [...new Set(indicators.map(li => li.assumptionId))];
    expect(covered.length).toBe(assumptions.length);
  });

  it('Step 4: implications cover opportunities, threats and risks', () => {
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    expect(implications.length).toBeGreaterThan(0);
    expect(implications.every(si => isValidStrategicImplication(si))).toBe(true);
    expect(implications.some(si => si.implicationType === 'opportunity')).toBe(true);
    expect(implications.some(si => si.implicationType === 'risk' || si.implicationType === 'threat')).toBe(true);
  });

  it('Step 5: scenarios include upside, base_case, and downside', () => {
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    const indicators = generateLeadingIndicators(assumptions, []);
    const scenarios = generateScenarios(implications, assumptions, indicators, WOOLWORTHS_CONTEXT);
    expect(scenarios.every(s => isValidScenario(s))).toBe(true);
    expect(scenarios.some(s => s.scenarioType === 'upside')).toBe(true);
    expect(scenarios.some(s => s.scenarioType === 'base_case')).toBe(true);
    expect(scenarios.some(s => s.scenarioType === 'downside')).toBe(true);
  });

  it('Step 6: options are generated and prioritised correctly', () => {
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    const scenarios = generateScenarios(implications, assumptions, [], WOOLWORTHS_CONTEXT);
    const options = generateStrategicOptions(implications, scenarios, assumptions, WOOLWORTHS_CONTEXT);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every(o => isValidStrategicOption(o))).toBe(true);
    // Medium risk appetite → should include experiment options
    expect(options.some(o => o.optionType === 'experiment')).toBe(true);
    // Options should be prioritised — all priority scores valid
    expect(options.every(o => o.priorityScore >= 0 && o.priorityScore <= 1)).toBe(true);
  });

  it('Step 7: decision brief is generated and references all artefacts', () => {
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    const indicators = generateLeadingIndicators(assumptions, []);
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    const scenarios = generateScenarios(implications, assumptions, indicators, WOOLWORTHS_CONTEXT);
    const options = generateStrategicOptions(implications, scenarios, assumptions, WOOLWORTHS_CONTEXT);
    const brief = generateDecisionBrief(WOOLWORTHS_CONTEXT, implications, options, assumptions, indicators);
    expect(isValidDecisionBrief(brief)).toBe(true);
    expect(brief.strategicContextId).toBe('ctx-woolworths-nz');
    expect(brief.headline.length).toBeGreaterThan(0);
    expect(brief.executiveSummary.length).toBeGreaterThan(0);
    expect(brief.topOpportunities.length).toBeGreaterThan(0);
    expect(brief.recommendedOptions.length).toBeGreaterThan(0);
  });

  it('Full pipeline: context → brief persists correctly to repository', () => {
    saveStrategicContext(WOOLWORTHS_CONTEXT);
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    saveAssumptions(assumptions);
    const indicators = generateLeadingIndicators(assumptions, []);
    saveLeadingIndicators(indicators);
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    saveStrategicImplications(implications);
    const scenarios = generateScenarios(implications, assumptions, indicators, WOOLWORTHS_CONTEXT);
    saveScenarios(scenarios);
    const options = generateStrategicOptions(implications, scenarios, assumptions, WOOLWORTHS_CONTEXT);
    saveStrategicOptions(options);
    const brief = generateDecisionBrief(WOOLWORTHS_CONTEXT, implications, options, assumptions, indicators);
    saveDecisionBrief(brief);

    // Assert all layers persisted
    expect(getStrategicContext()).not.toBeNull();
    expect(getAssumptions().length).toBeGreaterThan(0);
    expect(getLeadingIndicators().length).toBeGreaterThan(0);
    expect(getStrategicImplications().length).toBeGreaterThan(0);
    expect(getScenarios().length).toBeGreaterThan(0);
    expect(getStrategicOptions().length).toBeGreaterThan(0);
    expect(getDecisionBriefs().length).toBe(1);
  });

  it('Evidence traceability: brief evidence ids trace to signals from approved trends', () => {
    const implications = generateStrategicImplications(APPROVED_TRENDS, WOOLWORTHS_CONTEXT, []);
    const options = generateStrategicOptions(implications, [], [], WOOLWORTHS_CONTEXT);
    const assumptions = generateAssumptionsFromTrends(APPROVED_TRENDS, WOOLWORTHS_CONTEXT);
    const indicators = generateLeadingIndicators(assumptions, []);
    const brief = generateDecisionBrief(WOOLWORTHS_CONTEXT, implications, options, assumptions, indicators);
    // Evidence ids in the brief must come from trend signals
    const allTrendSignals = APPROVED_TRENDS.flatMap(t => t.relatedSignalIds);
    brief.evidenceIds.forEach(eId => {
      expect(allTrendSignals).toContain(eId);
    });
  });
});
