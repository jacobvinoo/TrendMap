import type { EstimatedEffort, OptionType, StrategicOption, TimeToValue, Trend } from './types';

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function firstUseful(items: string[] | undefined, fallback: string): string {
  return (items || []).map((item) => item.trim()).find(Boolean) || fallback;
}

function inferOptionType(trend: Trend): OptionType {
  const impact = trend.impactScore ?? 0;
  const confidence = trend.confidenceScore ?? 0;
  const momentum = trend.momentumScore ?? 0;

  if (impact >= 0.9 && confidence >= 0.8 && momentum >= 0.85) return 'invest';
  if (impact >= 0.65 || momentum >= 0.65) return 'experiment';
  return 'monitor';
}

function inferEffort(trend: Trend): EstimatedEffort {
  const impact = trend.impactScore ?? 0;
  const blockers = trend.blockers?.length ?? 0;
  if (impact >= 0.85 || blockers >= 3) return 'high';
  if (impact >= 0.6 || blockers >= 1) return 'medium';
  return 'low';
}

function inferTimeToValue(trend: Trend): TimeToValue {
  const horizon = (trend.horizon || '').toLowerCase();
  if (horizon.includes('0') || horizon.includes('now') || horizon.includes('short')) return '3_months';
  if (horizon.includes('12') || horizon.includes('month')) return '6_months';
  if (horizon.includes('24') || horizon.includes('year')) return '12_months';
  return (trend.momentumScore ?? 0) >= 0.75 ? '6_months' : '12_months';
}

function defaultNextStep(trend: Trend): string {
  const name = (trend.name || 'this trend').toLowerCase();
  if (name.includes('search') || name.includes('discovery')) {
    return 'Run a category-level AI search pilot with clear conversion, substitution, and customer trust measures.';
  }
  if (name.includes('value') || name.includes('afford')) {
    return 'Test a value-led offer and loyalty proposition in priority shopper segments.';
  }
  if (name.includes('fulfil')) {
    return 'Run a fulfilment journey pilot and compare convenience, availability, and cost-to-serve outcomes.';
  }
  return `Define a focused pilot for ${trend.name} with success metrics, accountable owner, and evidence review dates.`;
}

export function createStrategicOptionFromTrend(
  trend: Trend,
  context: { evidenceCount?: number } = {},
): StrategicOption {
  const priorityScore = clampScore(
    (trend.impactScore ?? 0) * 0.4
    + (trend.confidenceScore ?? 0) * 0.25
    + (trend.momentumScore ?? 0) * 0.2
    + (trend.likelihoodScore ?? 0) * 0.15,
  );

  const primaryProofPoint = firstUseful(
    trend.whatNeedsToBeTrue,
    firstUseful(trend.drivers, 'The trend has enough evidence to justify a bounded strategic test.'),
  );
  const primaryRisk = firstUseful(
    trend.blockers,
    'Product data quality, operating readiness, and customer trust may limit adoption.',
  );
  const primaryCapability = firstUseful(
    trend.leadingIndicators,
    'Pilot measurement, evidence review, and cross-functional delivery ownership.',
  );
  const recommendedNextStep = firstUseful(trend.recommendedActions, defaultNextStep(trend));

  return {
    id: `option-from-${trend.id}`,
    title: `Pilot response to ${trend.name}`,
    description: [
      `Translate the approved trend "${trend.name}" into a bounded strategic option.`,
      trend.summary,
      context.evidenceCount ? `Evidence base: ${context.evidenceCount} linked reference${context.evidenceCount === 1 ? '' : 's'}.` : '',
    ].filter(Boolean).join(' '),
    optionType: inferOptionType(trend),
    linkedTrendIds: [trend.id],
    linkedScenarioIds: [],
    linkedAssumptionIds: [],
    expectedBenefits: [
      primaryProofPoint,
      firstUseful(trend.drivers, 'Create measurable learning before committing larger roadmap investment.'),
    ],
    keyRisks: [
      primaryRisk,
      'Benefits may be overstated if the evidence is narrow, stale, or not specific to the workspace context.',
    ],
    requiredCapabilities: [
      primaryCapability,
      'Decision cadence to approve, pause, or scale after the pilot evidence review.',
    ],
    estimatedEffort: inferEffort(trend),
    timeToValue: inferTimeToValue(trend),
    impactScore: clampScore(trend.impactScore ?? 0),
    feasibilityScore: clampScore(1 - ((trend.blockers?.length ?? 0) * 0.08)),
    urgencyScore: clampScore(((trend.momentumScore ?? 0.55) * 0.6) + ((trend.likelihoodScore ?? 0.55) * 0.4)),
    confidenceScore: clampScore(trend.confidenceScore ?? 0),
    priorityScore,
    recommendedNextStep,
    status: 'proposed',
  };
}
