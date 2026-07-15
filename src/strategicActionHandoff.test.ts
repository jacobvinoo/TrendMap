import { describe, expect, it } from 'vitest';
import { buildStrategicActionHandoffs } from './strategicActionHandoff';
import type { RoadmapItem, StrategicOption, Trend } from './types';

function trend(id: string, impactScore = 0.7): Trend {
  return {
    id,
    name: id,
    summary: '',
    status: 'approved',
    horizon: '2027',
    likelihoodScore: 0.7,
    confidenceScore: 0.7,
    impactScore,
    maturityStage: 'emerging',
    relatedSignalIds: [],
    drivers: [],
    blockers: [],
    whatNeedsToBeTrue: [],
    leadingIndicators: [],
    monitoringQuestions: [],
    recommendedActions: [],
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
  };
}

function option(id: string, trendId: string, status: StrategicOption['status'] = 'proposed'): StrategicOption {
  return {
    id,
    title: id,
    description: '',
    optionType: 'experiment',
    linkedTrendIds: [trendId],
    linkedScenarioIds: [],
    linkedAssumptionIds: [],
    expectedBenefits: [],
    keyRisks: [],
    requiredCapabilities: [],
    estimatedEffort: 'medium',
    timeToValue: '6_months',
    impactScore: 0.7,
    feasibilityScore: 0.7,
    urgencyScore: 0.7,
    confidenceScore: 0.7,
    priorityScore: 0.7,
    recommendedNextStep: 'Run pilot',
    status,
  };
}

describe('buildStrategicActionHandoffs', () => {
  it('classifies approved trends by option and roadmap state', () => {
    const trends = [trend('needs'), trend('proposed'), trend('accepted'), trend('planned'), { ...trend('candidate'), status: 'candidate' as const }];
    const options = [
      option('option-proposed', 'proposed'),
      option('option-accepted', 'accepted', 'accepted'),
      option('option-planned', 'planned', 'accepted'),
    ];
    const roadmapItems: RoadmapItem[] = [{
      id: 'roadmap-option-planned',
      strategicOptionId: 'option-planned',
      title: 'Planned',
      horizon: 'next',
      owner: '',
      status: 'proposed',
      successMetric: 'Metric',
      linkedIndicatorIds: [],
    }];

    const handoffs = buildStrategicActionHandoffs(trends, options, roadmapItems, { needs: 3 });

    expect(handoffs.map((item) => item.trend.id)).toEqual(['needs', 'proposed', 'accepted', 'planned']);
    expect(handoffs.map((item) => item.state)).toEqual(['needs_option', 'option_proposed', 'option_accepted', 'roadmap_planned']);
    expect(handoffs[0].evidenceCount).toBe(3);
  });
});
