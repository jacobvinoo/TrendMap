/**
 * Decision Brief Engine (Phase 3)
 * Synthesises a decision brief from all Phase 3 artefacts.
 * Deterministic — same input always produces the same brief structure.
 */

import type {
  StrategicContext, StrategicImplication, StrategicOption,
  Assumption, LeadingIndicator, DecisionBrief,
} from './types';

export function generateDecisionBrief(
  context: StrategicContext,
  implications: StrategicImplication[],
  options: StrategicOption[],
  assumptions: Assumption[],
  indicators: LeadingIndicator[],
): DecisionBrief {
  const opportunities = implications
    .filter(si => si.implicationType === 'opportunity')
    .sort((a, b) => b.impactScore - a.impactScore);

  const threats = implications
    .filter(si => si.implicationType === 'threat' || si.implicationType === 'risk')
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const sortedOptions = [...options].sort((a, b) => b.priorityScore - a.priorityScore);

  // Assumptions needing testing — untested and high importance
  const toTest = assumptions
    .filter(a => a.status === 'untested' && a.importanceScore >= 0.7)
    .sort((a, b) => b.importanceScore - a.importanceScore);

  // Indicators to monitor — not yet accelerating
  const toMonitor = indicators
    .filter(li => li.currentStatus !== 'accelerating')
    .sort((a, b) => (b.currentStatus === 'emerging' ? 1 : 0) - (a.currentStatus === 'emerging' ? 1 : 0));

  const evidenceIds = [...new Set(implications.flatMap(si => si.evidenceIds))];

  const topOppTitle = opportunities[0]?.title ?? 'strategic opportunity';
  const topThreatTitle = threats[0]?.title ?? 'competitive risk';
  const topOptionTitle = sortedOptions[0]?.title ?? 'recommended action';

  const headline =
    `${context.companyName}: ${opportunities.length} opportunity${opportunities.length !== 1 ? 'ies' : 'y'}, ` +
    `${threats.length} threat${threats.length !== 1 ? 's' : ''}, ${sortedOptions.length} recommended option${sortedOptions.length !== 1 ? 's' : ''}`;

  const executiveSummary =
    `Strategic analysis for ${context.companyName} identifies ${opportunities.length} key opportunity${opportunities.length !== 1 ? 'ies' : 'y'} ` +
    `and ${threats.length} threat${threats.length !== 1 ? 's' : ''} requiring attention within ${context.planningHorizons[0] ?? '12 months'}. ` +
    `The highest-priority opportunity is "${topOppTitle}". ` +
    `The most urgent threat is "${topThreatTitle}". ` +
    `The recommended first action is to "${topOptionTitle}". ` +
    `${toTest.length} assumption${toTest.length !== 1 ? 's' : ''} require testing and ` +
    `${toMonitor.length} leading indicator${toMonitor.length !== 1 ? 's' : ''} should be monitored to track progress.`;

  return {
    id: `brief-${context.id}-${Date.now()}`,
    strategicContextId: context.id,
    generatedAt: new Date().toISOString(),
    headline,
    executiveSummary,
    topOpportunities: opportunities.slice(0, 5).map(si => si.id),
    topThreats: threats.slice(0, 5).map(si => si.id),
    recommendedOptions: sortedOptions.slice(0, 5).map(o => o.id),
    assumptionsToTest: toTest.map(a => a.id),
    indicatorsToMonitor: toMonitor.map(li => li.id),
    evidenceIds,
  };
}
