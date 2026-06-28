/**
 * Scenario Engine (Phase 3)
 * Generates deterministic strategic scenarios from implications, assumptions and indicators.
 * Always produces at minimum: upside, base_case, downside.
 */

import type {
  StrategicContext, StrategicImplication, Assumption,
  LeadingIndicator, Scenario, ScenarioType,
} from './types';

function clamp(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}

interface ScenarioTemplate {
  type: ScenarioType;
  condition: (
    implications: StrategicImplication[],
    assumptions: Assumption[],
    indicators: LeadingIndicator[],
  ) => boolean;
  build: (
    implications: StrategicImplication[],
    assumptions: Assumption[],
    indicators: LeadingIndicator[],
    ctx: StrategicContext,
    idx: number,
  ) => Omit<Scenario, 'id'>;
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    type: 'upside',
    condition: (implications) => implications.some(si => si.implicationType === 'opportunity'),
    build: (implications, assumptions, indicators, ctx) => {
      const opps = implications.filter(si => si.implicationType === 'opportunity');
      const avgImpact = opps.reduce((s, si) => s + si.impactScore, 0) / Math.max(opps.length, 1);
      return {
        name: `Best Case: ${ctx.companyName} leads on ${opps[0]?.title ?? 'emerging trend'}`,
        horizon: ctx.planningHorizons[0] ?? '12 months',
        summary:
          `${ctx.companyName} successfully capitalises on ${opps.length} identified opportunity${opps.length !== 1 ? 'ies' : 'y'}. ` +
          `The business achieves ${ctx.strategicGoals[0] ?? 'its primary strategic goal'} ahead of competitors, ` +
          `driving measurable improvement across target customer segments.`,
        scenarioType: 'upside',
        triggerConditions: [
          ...opps.map(o => `${o.title} materialises as expected`),
          ...assumptions.filter(a => a.importanceScore > 0.7).map(a => a.statement).slice(0, 2),
        ],
        assumptions: assumptions.map(a => a.id),
        implications: opps.map(si => si.id),
        probabilityScore: clamp(avgImpact * 0.6),
        impactScore: clamp(avgImpact),
        confidenceScore: clamp(opps.reduce((s, si) => s + si.confidenceScore, 0) / Math.max(opps.length, 1)),
        earlyWarningIndicators: indicators.filter(li => li.currentStatus !== 'not_started').map(li => li.id),
      };
    },
  },
  {
    type: 'base_case',
    condition: () => true, // always included
    build: (implications, assumptions, indicators, ctx) => {
      const allImpact = implications.reduce((s, si) => s + si.impactScore, 0) / Math.max(implications.length, 1);
      return {
        name: `Base Case: Measured progress for ${ctx.companyName}`,
        horizon: ctx.planningHorizons[0] ?? '12 months',
        summary:
          `${ctx.companyName} makes steady, measured progress on key strategic priorities. ` +
          `Some opportunities are realised, some assumptions prove incorrect, and the business ` +
          `adapts iteratively. Competitive position is maintained but not dramatically improved.`,
        scenarioType: 'base_case',
        triggerConditions: [
          'Current trajectory continues without major disruption',
          'Mix of assumption validation outcomes — some supported, some weakened',
          `${ctx.companyName} executes on one or two strategic options successfully`,
        ],
        assumptions: assumptions.map(a => a.id),
        implications: implications.map(si => si.id),
        probabilityScore: clamp(0.5 + allImpact * 0.1),
        impactScore: clamp(allImpact * 0.6),
        confidenceScore: clamp(0.6),
        earlyWarningIndicators: indicators.map(li => li.id),
      };
    },
  },
  {
    type: 'downside',
    condition: (implications) => implications.some(si => si.implicationType === 'threat' || si.implicationType === 'risk'),
    build: (implications, assumptions, indicators, ctx) => {
      const threats = implications.filter(si => si.implicationType === 'threat' || si.implicationType === 'risk');
      const avgImpact = threats.reduce((s, si) => s + si.impactScore, 0) / Math.max(threats.length, 1);
      return {
        name: `Downside: ${ctx.companyName} falls behind`,
        horizon: ctx.planningHorizons[0] ?? '12 months',
        summary:
          `Key assumptions prove incorrect, competitors move faster than ${ctx.companyName}, ` +
          `and execution challenges materialise. ${threats.length} identified threat${threats.length !== 1 ? 's' : ''} ` +
          `accumulate, resulting in missed strategic goals and weakened market position.`,
        scenarioType: 'downside',
        triggerConditions: [
          ...threats.map(t => `${t.title} materialises negatively`),
          ...assumptions.filter(a => a.status === 'weakened' || a.status === 'invalidated').map(a => a.statement).slice(0, 2),
          'Key capabilities unavailable within planning horizon',
        ],
        assumptions: assumptions.map(a => a.id),
        implications: threats.map(si => si.id),
        probabilityScore: clamp(avgImpact * 0.35),
        impactScore: clamp(avgImpact * 0.85),
        confidenceScore: clamp(threats.reduce((s, si) => s + si.confidenceScore, 0) / Math.max(threats.length, 1)),
        earlyWarningIndicators: indicators.map(li => li.id).slice(0, 3),
      };
    },
  },
  {
    type: 'wildcard',
    condition: (implications) => implications.length >= 2,
    build: (implications, assumptions, indicators, ctx) => {
      return {
        name: `Wildcard: Unexpected acceleration in ${implications[0]?.title ?? 'key trend'}`,
        horizon: '6 months',
        summary:
          `An unexpected external event or regulatory shift rapidly accelerates the ${implications[0]?.title ?? 'primary trend'}, ` +
          `forcing ${ctx.companyName} to respond faster than the planning horizon assumes. ` +
          `This could create a window of significant opportunity or severe disruption depending on readiness.`,
        scenarioType: 'wildcard',
        triggerConditions: [
          'Unexpected regulatory or technology event accelerates trend adoption',
          'Major competitor makes a disruptive acquisition or product launch',
          `${ctx.companyName}'s current capabilities are tested against a compressed timeline`,
        ],
        assumptions: assumptions.map(a => a.id).slice(0, 2),
        implications: implications.map(si => si.id).slice(0, 2),
        probabilityScore: clamp(0.1),
        impactScore: clamp(0.9),
        confidenceScore: clamp(0.3),
        earlyWarningIndicators: indicators.map(li => li.id).slice(0, 2),
      };
    },
  },
];

export function generateScenarios(
  implications: StrategicImplication[],
  assumptions: Assumption[],
  indicators: LeadingIndicator[],
  context: StrategicContext,
): Scenario[] {
  const scenarios: Scenario[] = [];

  for (let i = 0; i < SCENARIO_TEMPLATES.length; i++) {
    const template = SCENARIO_TEMPLATES[i];
    if (!template.condition(implications, assumptions, indicators)) continue;
    const built = template.build(implications, assumptions, indicators, context, i);
    scenarios.push({ id: `scenario-${template.type}-${context.id}`, ...built });
  }

  return scenarios;
}
