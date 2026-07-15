import type { RoadmapItem, StrategicActionHandoff, StrategicOption, Trend } from './types';

function optionForTrend(trend: Trend, options: StrategicOption[]): StrategicOption | undefined {
  return options.find((option) => (option.linkedTrendIds || []).includes(trend.id));
}

function roadmapForOption(option: StrategicOption | undefined, roadmapItems: RoadmapItem[]): RoadmapItem | undefined {
  if (!option) return undefined;
  return roadmapItems.find((item) => item.strategicOptionId === option.id);
}

function recommendedActionFor(state: StrategicActionHandoff['state']): string {
  if (state === 'needs_option') return 'Create a strategic option for this approved trend.';
  if (state === 'option_proposed') return 'Accept this option when it is ready for roadmap planning.';
  if (state === 'option_accepted') return 'Add the accepted option to the roadmap.';
  return 'Track execution progress on the roadmap.';
}

export function buildStrategicActionHandoffs(
  trends: Trend[],
  options: StrategicOption[],
  roadmapItems: RoadmapItem[],
  evidenceCounts: Record<string, number> = {},
): StrategicActionHandoff[] {
  return trends
    .filter((trend) => trend.status === 'approved')
    .filter((trend) => !/^test trend$/i.test(trend.name || ''))
    .map((trend) => {
      const option = optionForTrend(trend, options);
      const roadmapItem = roadmapForOption(option, roadmapItems);
      const state: StrategicActionHandoff['state'] = roadmapItem
        ? 'roadmap_planned'
        : option?.status === 'accepted'
          ? 'option_accepted'
          : option
            ? 'option_proposed'
            : 'needs_option';
      return {
        trend,
        state,
        evidenceCount: evidenceCounts[trend.id] ?? 0,
        option,
        roadmapItem,
        recommendedAction: recommendedActionFor(state),
      };
    })
    .sort((a, b) => {
      const stateOrder = ['needs_option', 'option_proposed', 'option_accepted', 'roadmap_planned'];
      const stateDelta = stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state);
      if (stateDelta !== 0) return stateDelta;
      return (b.trend.impactScore ?? 0) - (a.trend.impactScore ?? 0);
    });
}
