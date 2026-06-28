import { describe, it, expect } from 'vitest';
import { generateRoadmapItems } from './roadmapEngine';
import type { StrategicOption } from './types';

const OPTIONS: StrategicOption[] = [
  {
    id: 'opt-1', title: 'Pilot AI search', description: 'Run a time-boxed experiment',
    optionType: 'experiment', linkedTrendIds: ['t1'], linkedScenarioIds: [],
    linkedAssumptionIds: ['a1'], expectedBenefits: ['Better conversion'],
    keyRisks: ['Trust'], requiredCapabilities: ['Semantic search'],
    estimatedEffort: 'medium', timeToValue: '3_months',
    impactScore: 0.9, feasibilityScore: 0.7, urgencyScore: 0.8,
    confidenceScore: 0.75, priorityScore: 0.82,
    recommendedNextStep: 'Define pilot scope',
    status: 'accepted',
  },
  {
    id: 'opt-2', title: 'Defend retail media position', description: 'Strengthen targeting',
    optionType: 'defend', linkedTrendIds: ['t2'], linkedScenarioIds: [],
    linkedAssumptionIds: [], expectedBenefits: ['Protect revenue'],
    keyRisks: ['Capacity'], requiredCapabilities: ['Analytics'],
    estimatedEffort: 'low', timeToValue: '6_months',
    impactScore: 0.7, feasibilityScore: 0.8, urgencyScore: 0.6,
    confidenceScore: 0.7, priorityScore: 0.68,
    recommendedNextStep: 'Audit current targeting',
  },
];

describe('generateRoadmapItems', () => {
  it('generates a roadmap item for each accepted option', () => {
    const items = generateRoadmapItems(OPTIONS.filter(o => o.status === 'accepted'));
    expect(items.some(r => r.strategicOptionId === 'opt-1')).toBe(true);
  });

  it('assigns horizon based on timeToValue', () => {
    const items = generateRoadmapItems(OPTIONS);
    const item1 = items.find(r => r.strategicOptionId === 'opt-1');
    expect(item1?.horizon).toBe('now'); // 3_months → now
    const item2 = items.find(r => r.strategicOptionId === 'opt-2');
    expect(item2?.horizon).toBe('next'); // 6_months → next
  });

  it('each item has a non-empty title and successMetric', () => {
    const items = generateRoadmapItems(OPTIONS);
    expect(items.every(r => r.title.length > 0)).toBe(true);
    expect(items.every(r => r.successMetric.length > 0)).toBe(true);
  });

  it('each item has a proposed status by default', () => {
    const items = generateRoadmapItems(OPTIONS);
    expect(items.every(r => r.status === 'proposed')).toBe(true);
  });

  it('is deterministic', () => {
    const r1 = generateRoadmapItems(OPTIONS);
    const r2 = generateRoadmapItems(OPTIONS);
    expect(r1.map(r => r.id)).toEqual(r2.map(r => r.id));
  });

  it('returns empty for no options', () => {
    expect(generateRoadmapItems([])).toHaveLength(0);
  });
});
