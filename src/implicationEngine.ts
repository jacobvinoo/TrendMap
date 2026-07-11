/**
 * Implication Engine (Phase 3)
 * Generates deterministic strategic implications (opportunities, threats, risks, watch items)
 * from approved trends and strategic context.
 */

import type { Trend, StrategicContext, StrategicImplication, ImplicationType, EvidenceLink } from './types';

function clamp(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}

interface ImplicationSpec {
  implicationType: ImplicationType;
  condition: (t: Trend) => boolean;
  titleFn: (t: Trend, ctx: StrategicContext) => string;
  summaryFn: (t: Trend, ctx: StrategicContext) => string;
  urgencyFn: (t: Trend) => number;
  impactFn: (t: Trend) => number;
  confidenceFn: (t: Trend) => number;
  affectedCapabilities: (t: Trend, ctx: StrategicContext) => string[];
  affectedSegments: (t: Trend, ctx: StrategicContext) => string[];
}

const SPECS: ImplicationSpec[] = [
  {
    implicationType: 'opportunity',
    condition: (t) => t.impactScore >= 0.5,
    titleFn: (t) => `Strategic opportunity: ${t.name}`,
    summaryFn: (t, ctx) =>
      `The trend "${t.name}" creates a potential advantage for ${ctx.companyName}. ` +
      `With impact score ${(t.impactScore * 100).toFixed(0)}% and confidence ${(t.confidenceScore * 100).toFixed(0)}%, ` +
      `this is a meaningful opportunity to differentiate on ${ctx.strategicGoals[0] ?? 'core strategic goals'}.`,
    urgencyFn: (t) => clamp(t.momentumScore ?? 0.5),
    impactFn: (t) => clamp(t.impactScore),
    confidenceFn: (t) => clamp(t.confidenceScore),
    affectedCapabilities: (_t, ctx) => ctx.currentCapabilities.slice(0, 2),
    affectedSegments: (_t, ctx) => ctx.targetCustomers.slice(0, 2),
  },
  {
    implicationType: 'risk',
    condition: (t) => t.blockers.length > 0,
    titleFn: (t) => `Execution risk: ${t.name}`,
    summaryFn: (t, ctx) =>
      `Pursuing ${t.name} carries execution risk for ${ctx.companyName}. ` +
      `Identified blockers: ${t.blockers.slice(0, 2).join(', ')}. ` +
      `These must be resolved to realise the opportunity.`,
    urgencyFn: (t) => clamp((t.momentumScore ?? 0.5) * 0.7),
    impactFn: (t) => clamp(t.impactScore * 0.6),
    confidenceFn: (t) => clamp(t.confidenceScore * 0.8),
    affectedCapabilities: (t) => t.blockers.slice(0, 2),
    affectedSegments: (_t, ctx) => ctx.targetCustomers.slice(0, 1),
  },
  {
    implicationType: 'threat',
    condition: (t) => (t.momentumScore ?? 0) >= 0.6 && t.impactScore >= 0.6,
    titleFn: (t, ctx) => `Competitive threat: ${t.name} may be adopted by ${ctx.companyName}'s competitors`,
    summaryFn: (t, ctx) =>
      `High-momentum trend "${t.name}" (momentum: ${((t.momentumScore ?? 0) * 100).toFixed(0)}%) ` +
      `presents a threat if competitors move faster than ${ctx.companyName}. ` +
      `Failing to act may erode competitive position.`,
    urgencyFn: (t) => clamp((t.momentumScore ?? 0) * 0.9),
    impactFn: (t) => clamp(t.impactScore * 0.8),
    confidenceFn: (t) => clamp(t.confidenceScore * 0.7),
    affectedCapabilities: (_t, ctx) => ctx.currentCapabilities.slice(0, 1),
    affectedSegments: (_t, ctx) => ctx.targetCustomers,
  },
  {
    implicationType: 'watch_item',
    condition: (t) => t.maturityStage === 'speculative' || t.impactScore < 0.5,
    titleFn: (t) => `Monitor: ${t.name}`,
    summaryFn: (t) =>
      `The trend "${t.name}" is at "${t.maturityStage}" maturity. ` +
      `Impact is currently limited (score: ${(t.impactScore * 100).toFixed(0)}%). ` +
      `Monitor for signals of acceleration before committing resources.`,
    urgencyFn: () => clamp(0.2),
    impactFn: (t) => clamp(t.impactScore * 0.5),
    confidenceFn: (t) => clamp(t.confidenceScore * 0.6),
    affectedCapabilities: () => [],
    affectedSegments: () => [],
  },
];

export function generateStrategicImplications(
  trends: Trend[],
  context: StrategicContext,
  allEvidences: EvidenceLink[] = []
): StrategicImplication[] {
  const approved = trends.filter(t => t.status === 'approved');
  const implications: StrategicImplication[] = [];
  const evidences = allEvidences;

  for (const trend of approved) {
    for (const spec of SPECS) {
      if (!spec.condition(trend)) continue;
      const id = `impl-${trend.id}-${spec.implicationType}`;
      implications.push({
        id,
        trendId: trend.id,
        implicationType: spec.implicationType,
        title: spec.titleFn(trend, context),
        summary: spec.summaryFn(trend, context),
        affectedCapabilities: spec.affectedCapabilities(trend, context),
        affectedCustomerSegments: spec.affectedSegments(trend, context),
        urgencyScore: spec.urgencyFn(trend),
        impactScore: spec.impactFn(trend),
        confidenceScore: spec.confidenceFn(trend),
        evidenceIds: [...new Set(evidences
          .filter(e => e.trendId === trend.id && trend.relatedSignalIds.includes(e.signalId))
          .map(e => e.signalId))]
          .slice(0, 3),
      });
    }
  }

  return implications;
}
