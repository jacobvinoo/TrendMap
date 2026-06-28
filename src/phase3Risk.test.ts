/**
 * Phase 3 E2E — Risk and Uncertainty Path
 *
 * Tests edge cases: high-risk appetite, invalidated assumptions,
 * declining indicators, and minimum inputs.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateAssumptionsFromTrends } from './assumptionEngine';
import { generateLeadingIndicators } from './indicatorEngine';
import { generateStrategicImplications } from './implicationEngine';
import { generateScenarios } from './scenarioEngine';
import { generateStrategicOptions } from './optionEngine';
import { generateDecisionBrief } from './decisionBriefEngine';
import { generateRoadmapItems } from './roadmapEngine';
import type { StrategicContext, Trend } from './types';

const HIGH_RISK_CONTEXT: StrategicContext = {
  id: 'ctx-high-risk', industryProfileId: 'ind-1', companyName: 'Acme Fast-Mover',
  businessModel: 'Digital-first challenger', targetCustomers: ['Early adopters'],
  strategicGoals: ['Capture market share fast'], currentCapabilities: ['Speed'],
  constraints: [], riskAppetite: 'high', planningHorizons: ['3 months'],
};

const LOW_RISK_CONTEXT: StrategicContext = {
  id: 'ctx-low-risk', industryProfileId: 'ind-1', companyName: 'Cautious Corp',
  businessModel: 'Established player', targetCustomers: ['Mass market'],
  strategicGoals: ['Protect current position'], currentCapabilities: ['Scale'],
  constraints: ['Regulatory', 'Compliance'], riskAppetite: 'low', planningHorizons: ['24 months'],
};

const SPECULATIVE_TREND: Trend = {
  id: 't-speculative', name: 'Quantum retail search', status: 'approved',
  confidenceScore: 0.25, momentumScore: 0.1, impactScore: 0.15, likelihoodScore: 0.1,
  horizon: 'long', maturityStage: 'speculative', summary: 'Very early stage quantum computing',
  relatedSignalIds: [], drivers: [], blockers: ['No viable hardware'],
  whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

const HIGH_MOMENTUM_THREAT_TREND: Trend = {
  id: 't-threat', name: 'Competitor AI deployment', status: 'approved',
  confidenceScore: 0.9, momentumScore: 0.95, impactScore: 0.85, likelihoodScore: 0.9,
  horizon: 'short', maturityStage: 'growth', summary: 'Competitors deploying AI faster',
  relatedSignalIds: ['sig-threat-1'],
  drivers: ['Large competitor budgets', 'Easy-to-deploy SaaS AI'],
  blockers: [],
  whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

describe('Phase 3 E2E — Risk and Uncertainty Path', () => {
  beforeEach(() => {
    globalThis.__mockRepoState = {
      industryProfile: null, sources: [], documents: [], signals: [],
      trends: [], evidences: [], rules: [], runs: [], snapshots: [],
      changeEvents: [], trendScoreSnapshots: [], trendScoreChanges: [],
      alerts: [], summaries: [],
      strategicContext: null, assumptions: [], leadingIndicators: [],
      strategicImplications: [], scenarios: [], strategicOptions: [],
      decisionBriefs: [], roadmapItems: [],
    };
  });

  it('high risk appetite produces invest options for opportunities', () => {
    const implications = generateStrategicImplications([HIGH_MOMENTUM_THREAT_TREND], HIGH_RISK_CONTEXT);
    const opps = implications.filter(si => si.implicationType === 'opportunity');
    const options = generateStrategicOptions(opps, [], [], HIGH_RISK_CONTEXT);
    const types = options.map(o => o.optionType);
    expect(types.some(t => t === 'invest')).toBe(true);
  });

  it('low risk appetite produces monitor options for same opportunities', () => {
    const implications = generateStrategicImplications([HIGH_MOMENTUM_THREAT_TREND], LOW_RISK_CONTEXT);
    const opps = implications.filter(si => si.implicationType === 'opportunity');
    const options = generateStrategicOptions(opps, [], [], LOW_RISK_CONTEXT);
    const types = options.map(o => o.optionType);
    expect(types.some(t => t === 'monitor')).toBe(true);
  });

  it('speculative trend generates watch_item implication', () => {
    const implications = generateStrategicImplications([SPECULATIVE_TREND], LOW_RISK_CONTEXT);
    expect(implications.some(si => si.implicationType === 'watch_item')).toBe(true);
  });

  it('invalidated assumptions are not listed in assumptionsToTest in brief', () => {
    const assumptions = generateAssumptionsFromTrends([HIGH_MOMENTUM_THREAT_TREND], HIGH_RISK_CONTEXT);
    // Simulate all invalidated
    const invalidated = assumptions.map(a => ({ ...a, status: 'invalidated' as const }));
    const indicators = generateLeadingIndicators(invalidated);
    const implications = generateStrategicImplications([HIGH_MOMENTUM_THREAT_TREND], HIGH_RISK_CONTEXT);
    const options = generateStrategicOptions(implications, [], invalidated, HIGH_RISK_CONTEXT);
    const brief = generateDecisionBrief(HIGH_RISK_CONTEXT, implications, options, invalidated, indicators);
    // No invalidated assumptions should need testing
    expect(brief.assumptionsToTest).toHaveLength(0);
  });

  it('declining indicators still appear in indicatorsToMonitor', () => {
    const assumptions = generateAssumptionsFromTrends([SPECULATIVE_TREND], LOW_RISK_CONTEXT);
    const indicators = generateLeadingIndicators(assumptions);
    const declining = indicators.map(li => ({ ...li, currentStatus: 'declining' as const }));
    const implications = generateStrategicImplications([SPECULATIVE_TREND], LOW_RISK_CONTEXT);
    const options = generateStrategicOptions(implications, [], assumptions, LOW_RISK_CONTEXT);
    const brief = generateDecisionBrief(LOW_RISK_CONTEXT, implications, options, assumptions, declining);
    // Declining indicators (not accelerating) should still be monitored
    expect(brief.indicatorsToMonitor.length).toBeGreaterThan(0);
  });

  it('empty inputs produce a valid base_case scenario at minimum', () => {
    const scenarios = generateScenarios([], [], [], HIGH_RISK_CONTEXT);
    expect(scenarios.some(s => s.scenarioType === 'base_case')).toBe(true);
  });

  it('roadmap assigns now/next/later horizons correctly', () => {
    const implications = generateStrategicImplications([HIGH_MOMENTUM_THREAT_TREND], HIGH_RISK_CONTEXT);
    const options = generateStrategicOptions(implications, [], [], HIGH_RISK_CONTEXT);
    const items = generateRoadmapItems(options);
    // High urgency options → 3_months timeToValue → 'now' horizon
    expect(items.some(r => r.horizon === 'now')).toBe(true);
  });

  it('high momentum threat trend produces a threat implication', () => {
    const implications = generateStrategicImplications([HIGH_MOMENTUM_THREAT_TREND], HIGH_RISK_CONTEXT);
    expect(implications.some(si => si.implicationType === 'threat')).toBe(true);
  });
});
