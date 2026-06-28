/**
 * Indicator Engine (Phase 3)
 * Generates deterministic leading indicators from assumptions.
 * Maps each assumption type to relevant indicator types and monitoring questions.
 */

import { getSignals } from './mockRepository';
import type { Assumption, LeadingIndicator, AssumptionType, IndicatorType, Signal } from './types';

interface IndicatorTemplate {
  indicatorType: IndicatorType;
  nameTemplate: (a: Assumption) => string;
  descriptionTemplate: (a: Assumption) => string;
  monitoringQuestionTemplate: (a: Assumption) => string;
  thresholdTemplate: (a: Assumption) => string;
}

const TYPE_MAP: Record<AssumptionType, IndicatorTemplate[]> = {
  customer_behaviour: [
    {
      indicatorType: 'customer',
      nameTemplate: (a) => `Customer adoption signal for: ${a.trendId}`,
      descriptionTemplate: (a) => `Tracks customer engagement signals relevant to the assumption: "${a.statement.substring(0, 60)}..."`,
      monitoringQuestionTemplate: () =>
        'What percentage of target customers are actively seeking or using solutions related to this trend?',
      thresholdTemplate: () => 'More than 20% of target customers show active demand signals',
    },
    {
      indicatorType: 'adoption',
      nameTemplate: (a) => `Market adoption rate: ${a.trendId}`,
      descriptionTemplate: () => 'Tracks the rate at which the target market segment is adopting related capabilities or behaviours.',
      monitoringQuestionTemplate: () =>
        'How many documented case studies or public announcements show customers adopting this type of capability?',
      thresholdTemplate: () => 'At least 3 verifiable public examples of customer adoption',
    },
  ],
  technology_readiness: [
    {
      indicatorType: 'technology',
      nameTemplate: (a) => `Technology maturity signal: ${a.trendId}`,
      descriptionTemplate: () => 'Monitors the maturity and reliability of underlying technology relevant to this assumption.',
      monitoringQuestionTemplate: () =>
        'How many production-grade implementations of this technology exist in comparable industries?',
      thresholdTemplate: () => 'At least 2 production implementations in comparable industries',
    },
    {
      indicatorType: 'investment',
      nameTemplate: (a) => `Investment signal: ${a.trendId}`,
      descriptionTemplate: () => 'Tracks venture and enterprise investment activity as a proxy for technology readiness confidence.',
      monitoringQuestionTemplate: () =>
        'What is the level of investment activity (funding rounds, acquisitions) in the technology space?',
      thresholdTemplate: () => 'At least $50M in sector investment within last 12 months',
    },
  ],
  regulation: [
    {
      indicatorType: 'regulatory',
      nameTemplate: (a) => `Regulatory signal: ${a.trendId}`,
      descriptionTemplate: () => 'Monitors regulatory developments, legislation, and public consultations relevant to this assumption.',
      monitoringQuestionTemplate: () =>
        'Are there active regulatory consultations, legislation proposals, or enforcement actions related to this area?',
      thresholdTemplate: () => 'No new restrictive legislation enacted or proposed that directly blocks deployment',
    },
  ],
  economics: [
    {
      indicatorType: 'economic',
      nameTemplate: (a) => `Economic viability signal: ${a.trendId}`,
      descriptionTemplate: () => 'Tracks economic signals including cost trends, ROI benchmarks, and pricing pressure.',
      monitoringQuestionTemplate: () =>
        'What is the current cost trajectory for implementing this capability, and are ROI benchmarks improving?',
      thresholdTemplate: () => 'Cost of implementation declining year-on-year, or clear ROI benchmarks available',
    },
  ],
  competitor_action: [
    {
      indicatorType: 'competitor',
      nameTemplate: (a) => `Competitor activity signal: ${a.trendId}`,
      descriptionTemplate: () => 'Monitors competitor investments, announcements, and product launches related to this assumption.',
      monitoringQuestionTemplate: () =>
        'How many direct competitors have announced investment in or launched a related capability?',
      thresholdTemplate: () => 'At least 2 direct competitors have publicly invested or launched related capabilities',
    },
    {
      indicatorType: 'adoption',
      nameTemplate: (a) => `Industry momentum signal: ${a.trendId}`,
      descriptionTemplate: () => 'Tracks broader industry momentum as evidence of competitive pressure building.',
      monitoringQuestionTemplate: () =>
        'What percentage of the top 10 industry players have announced plans or launched in this space?',
      thresholdTemplate: () => 'More than 30% of top industry players have made moves in this space',
    },
  ],
  operational_feasibility: [
    {
      indicatorType: 'technology',
      nameTemplate: (a) => `Internal capability signal: ${a.trendId}`,
      descriptionTemplate: () => 'Monitors internal skill availability, tooling readiness, and delivery capacity.',
      monitoringQuestionTemplate: () =>
        'Does the team have sufficient skills, tooling, and capacity to deliver this capability within the planning horizon?',
      thresholdTemplate: () => 'Feasibility assessment completed and delivery team identified',
    },
  ],
};

export function generateLeadingIndicators(
  assumptions: Assumption[],
  allSignals?: Signal[]
): LeadingIndicator[] {
  const indicators: LeadingIndicator[] = [];
  const signals = allSignals ?? getSignals();

  for (const assumption of assumptions) {
    const templates = TYPE_MAP[assumption.assumptionType] ?? [];
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const id = `indicator-${assumption.id}-${template.indicatorType}-${i}`;
      indicators.push({
        id,
        assumptionId: assumption.id,
        name: template.nameTemplate(assumption),
        description: template.descriptionTemplate(assumption),
        indicatorType: template.indicatorType,
        currentStatus: 'not_started',
        threshold: template.thresholdTemplate(assumption),
        monitoringQuestion: template.monitoringQuestionTemplate(assumption),
        relatedSourceIds: [...new Set(
          signals
            .filter(s => assumption.relatedSignalIds.includes(s.id))
            .map(s => s.sourceId)
        )].slice(0, 2),
      });
    }
  }

  return indicators;
}
