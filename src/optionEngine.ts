/**
 * Option Engine (Phase 3)
 * Generates deterministic strategic options from implications, scenarios and assumptions.
 * Maps each implication type and risk appetite to appropriate option types.
 */

import type {
  StrategicContext, StrategicImplication, Scenario, Assumption,
  StrategicOption, OptionType, EstimatedEffort, TimeToValue,
} from './types';

function clamp(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}

function effort(ctx: StrategicContext, base: EstimatedEffort): EstimatedEffort {
  if (ctx.riskAppetite === 'high') return base === 'low' ? 'medium' : 'high';
  if (ctx.riskAppetite === 'low') return base === 'high' ? 'medium' : 'low';
  return base;
}

function timeToValue(urgency: number): TimeToValue {
  if (urgency >= 0.8) return '3_months';
  if (urgency >= 0.6) return '6_months';
  if (urgency >= 0.4) return '12_months';
  return '24_months';
}

function optionType(implicationType: string, riskAppetite: string): OptionType {
  if (implicationType === 'opportunity') {
    if (riskAppetite === 'high') return 'invest';
    if (riskAppetite === 'medium') return 'experiment';
    return 'monitor';
  }
  if (implicationType === 'threat') return 'defend';
  if (implicationType === 'risk') return 'build_capability';
  return 'monitor';
}

export function generateStrategicOptions(
  implications: StrategicImplication[],
  scenarios: Scenario[],
  assumptions: Assumption[],
  context: StrategicContext,
): StrategicOption[] {
  if (implications.length === 0 && scenarios.length === 0) return [];

  const options: StrategicOption[] = [];

  for (const implication of implications) {
    const type = optionType(implication.implicationType, context.riskAppetite);
    const relatedScenarios = scenarios.filter(s => s.implications.includes(implication.id));
    const relatedAssumptions = assumptions.filter(a => a.trendId === implication.trendId);

    const priorityScore = clamp(
      implication.impactScore * 0.4 +
      implication.urgencyScore * 0.35 +
      implication.confidenceScore * 0.25
    );

    let title: string;
    let description: string;
    let benefits: string[];
    let risks: string[];
    let nextStep: string;
    let capabilities: string[];

    if (implication.implicationType === 'opportunity') {
      title = `${type === 'invest' ? 'Invest in' : type === 'experiment' ? 'Pilot' : 'Monitor'}: ${implication.title}`;
      description =
        `${context.companyName} should ${type === 'invest' ? 'make a full investment in' : type === 'experiment' ? 'run a time-boxed experiment on' : 'closely monitor'} ` +
        `${implication.summary.toLowerCase()}. ` +
        `This is linked to ${relatedScenarios.length} scenario${relatedScenarios.length !== 1 ? 's' : ''} and ${relatedAssumptions.length} assumption${relatedAssumptions.length !== 1 ? 's' : ''}.`;
      benefits = [`Realise: ${implication.title}`, ...context.strategicGoals.slice(0, 1)];
      risks = implication.affectedCapabilities.map(c => `Capability gap in ${c}`);
      nextStep = type === 'experiment'
        ? `Define a time-boxed pilot — identify one product area and success metrics`
        : type === 'invest'
        ? `Allocate budget and assign a dedicated owner within 30 days`
        : `Set up a monitoring cadence and review in 4 weeks`;
      capabilities = [...new Set([...implication.affectedCapabilities, ...context.currentCapabilities.slice(0, 1)])];
    } else {
      title = `${type === 'defend' ? 'Defend against' : 'Address'}: ${implication.title}`;
      description =
        `${context.companyName} needs to ${type === 'defend' ? 'defend its position against' : 'build capability to address'} ` +
        `${implication.summary.toLowerCase()}.`;
      benefits = [`Protect market position`, `Reduce risk exposure`];
      risks = [`Inaction increases competitive exposure`, `Resource cost of response`];
      nextStep = `Assess competitive landscape and identify quick defensive actions within 6 weeks`;
      capabilities = implication.affectedCapabilities;
    }

    options.push({
      id: `option-${implication.id}-${type}`,
      title,
      description,
      optionType: type,
      linkedTrendIds: [implication.trendId],
      linkedScenarioIds: relatedScenarios.map(s => s.id),
      linkedAssumptionIds: relatedAssumptions.map(a => a.id),
      expectedBenefits: benefits,
      keyRisks: risks,
      requiredCapabilities: capabilities,
      estimatedEffort: effort(context, implication.impactScore > 0.7 ? 'high' : implication.impactScore > 0.4 ? 'medium' : 'low'),
      timeToValue: timeToValue(implication.urgencyScore),
      impactScore: clamp(implication.impactScore),
      feasibilityScore: clamp(0.8 - (implication.impactScore * 0.2)),
      urgencyScore: clamp(implication.urgencyScore),
      confidenceScore: clamp(implication.confidenceScore),
      priorityScore,
      recommendedNextStep: nextStep,
    });
  }

  return options;
}
