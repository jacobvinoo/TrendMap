/**
 * Assumption Engine (Phase 3)
 * Generates deterministic assumptions from approved trends and strategic context.
 * No real LLM calls — uses rule-based, deterministic logic.
 */

import type { Trend, StrategicContext, Assumption, AssumptionType } from './types';

interface AssumptionTemplate {
  assumptionType: AssumptionType;
  statementTemplate: (trend: Trend) => string;
  evidenceTemplate: (trend: Trend) => string;
  confidenceBase: number;
  importanceBase: number;
}

const TEMPLATES: AssumptionTemplate[] = [
  {
    assumptionType: 'customer_behaviour',
    statementTemplate: (t) =>
      `Customers will actively engage with ${t.name.toLowerCase()} as part of their regular shopping behaviour.`,
    evidenceTemplate: (t) =>
      `Based on the trend "${t.name}" with confidence ${(t.confidenceScore * 100).toFixed(0)}% and momentum ${((t.momentumScore ?? 0) * 100).toFixed(0)}%. Drivers: ${t.drivers.slice(0, 2).join(', ') || 'not specified'}.`,
    confidenceBase: 0.65,
    importanceBase: 0.85,
  },
  {
    assumptionType: 'technology_readiness',
    statementTemplate: (t) =>
      `The underlying technology required to support ${t.name.toLowerCase()} will be sufficiently mature and reliable for production use.`,
    evidenceTemplate: (t) =>
      `Trend maturity stage is "${t.maturityStage}". Blockers include: ${t.blockers.slice(0, 2).join(', ') || 'none identified'}.`,
    confidenceBase: 0.6,
    importanceBase: 0.8,
  },
  {
    assumptionType: 'regulation',
    statementTemplate: (t) =>
      `The regulatory environment will remain permissive enough to deploy ${t.name.toLowerCase()} without major compliance barriers.`,
    evidenceTemplate: (t) =>
      `Horizon: ${t.horizon}. No specific regulatory blockers identified in current signal set for this trend.`,
    confidenceBase: 0.7,
    importanceBase: 0.7,
  },
  {
    assumptionType: 'economics',
    statementTemplate: (t) =>
      `The economic case for investing in ${t.name.toLowerCase()} will be positive — with measurable ROI within the planning horizon.`,
    evidenceTemplate: (t) =>
      `Impact score ${(t.impactScore * 100).toFixed(0)}% and likelihood ${(t.likelihoodScore * 100).toFixed(0)}%. Based on trend signals from the current monitoring cycle.`,
    confidenceBase: 0.6,
    importanceBase: 0.75,
  },
  {
    assumptionType: 'competitor_action',
    statementTemplate: (t) =>
      `Key competitors will also be experimenting with or investing in ${t.name.toLowerCase()}, creating competitive pressure.`,
    evidenceTemplate: (t) =>
      `Momentum score: ${((t.momentumScore ?? 0) * 100).toFixed(0)}%. Trend is in "${t.maturityStage}" stage, suggesting market movement is already underway.`,
    confidenceBase: 0.55,
    importanceBase: 0.7,
  },
  {
    assumptionType: 'operational_feasibility',
    statementTemplate: (t) =>
      `Our current capabilities and team capacity can be extended or adapted to deliver ${t.name.toLowerCase()} within the planning horizon.`,
    evidenceTemplate: (t) =>
      `Blockers referenced: ${t.blockers.slice(0, 2).join(', ') || 'none'}. Horizon: ${t.horizon}. Team readiness based on existing capability set.`,
    confidenceBase: 0.65,
    importanceBase: 0.8,
  },
];

/**
 * Generate deterministic assumptions for each approved trend.
 * Only approved trends are considered; candidates and rejected trends are excluded.
 */
export function generateAssumptionsFromTrends(
  trends: Trend[],
  _context: StrategicContext
): Assumption[] {
  const approved = trends.filter(t => t.status === 'approved');
  const assumptions: Assumption[] = [];

  for (const trend of approved) {
    for (const template of TEMPLATES) {
      const id = `assumption-${trend.id}-${template.assumptionType}`;
      const assumption: Assumption = {
        id,
        trendId: trend.id,
        statement: template.statementTemplate(trend),
        assumptionType: template.assumptionType,
        // Slightly adjust base score by trend confidence to keep determinism
        confidenceScore: Math.min(1, Math.round((template.confidenceBase * 0.7 + trend.confidenceScore * 0.3) * 100) / 100),
        importanceScore: Math.min(1, Math.round((template.importanceBase * 0.6 + trend.impactScore * 0.4) * 100) / 100),
        status: 'untested',
        relatedSignalIds: trend.relatedSignalIds.slice(0, 3),
        relatedIndicatorIds: [],
        evidenceSummary: template.evidenceTemplate(trend),
      };
      assumptions.push(assumption);
    }
  }

  return assumptions;
}
