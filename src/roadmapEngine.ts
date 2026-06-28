/**
 * Roadmap Engine (Phase 3)
 * Converts strategic options into roadmap items with horizon assignment.
 */

import type { StrategicOption, RoadmapItem, RoadmapHorizon, TimeToValue } from './types';

function horizonFromTimeToValue(ttv: TimeToValue): RoadmapHorizon {
  if (ttv === 'now' || ttv === '3_months') return 'now';
  if (ttv === '6_months' || ttv === '12_months') return 'next';
  return 'later';
}

export function generateRoadmapItems(options: StrategicOption[]): RoadmapItem[] {
  return options.map(option => ({
    id: `roadmap-${option.id}`,
    strategicOptionId: option.id,
    title: option.title,
    horizon: horizonFromTimeToValue(option.timeToValue),
    owner: '',
    status: 'proposed',
    successMetric: option.expectedBenefits[0]
      ? `Validate: ${option.expectedBenefits[0]}`
      : option.recommendedNextStep,
    linkedIndicatorIds: option.linkedAssumptionIds.map(id => `indicator-${id}-0`),
  }));
}
