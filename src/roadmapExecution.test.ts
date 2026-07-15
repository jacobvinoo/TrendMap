import { describe, expect, it } from 'vitest';
import { summarizeRoadmapExecution } from './roadmapExecution';
import type { RoadmapItem } from './types';

const item = (patch: Partial<RoadmapItem>): RoadmapItem => ({
  id: patch.id || 'roadmap-1',
  strategicOptionId: patch.strategicOptionId || 'option-1',
  title: patch.title || 'Roadmap item',
  horizon: patch.horizon || 'now',
  owner: patch.owner ?? 'Product',
  status: patch.status || 'in_progress',
  successMetric: patch.successMetric || 'Improve conversion',
  linkedIndicatorIds: patch.linkedIndicatorIds || [],
  targetDate: patch.targetDate,
  progressPercent: patch.progressPercent,
  progressNote: patch.progressNote,
});

describe('summarizeRoadmapExecution', () => {
  const now = new Date('2026-07-14T12:00:00Z');

  it('counts overdue, due soon, blocked, completed, and missing execution details', () => {
    const summary = summarizeRoadmapExecution([
      item({ id: 'overdue', title: 'Overdue pilot', targetDate: '2026-07-01', progressPercent: 25 }),
      item({ id: 'soon', title: 'Due soon pilot', targetDate: '2026-07-30', progressPercent: 50 }),
      item({ id: 'blocked', title: 'Blocked pilot', status: 'blocked', targetDate: '2026-09-01', progressPercent: 10 }),
      item({ id: 'missing', title: 'Missing owner', owner: '', targetDate: '', progressPercent: 0 }),
      item({ id: 'done', title: 'Completed pilot', status: 'completed', targetDate: '2026-06-30', progressPercent: 100 }),
    ], now);

    expect(summary.totalItems).toBe(5);
    expect(summary.overdueCount).toBe(1);
    expect(summary.dueSoonCount).toBe(1);
    expect(summary.blockedCount).toBe(1);
    expect(summary.completedCount).toBe(1);
    expect(summary.missingExecutionDetailsCount).toBe(1);
    expect(summary.averageProgressPercent).toBe(37);
    expect(summary.attentionItems.map((entry) => entry.id)).toEqual(['blocked', 'overdue', 'missing']);
  });

  it('ignores completed items when calculating overdue and due soon attention', () => {
    const summary = summarizeRoadmapExecution([
      item({ id: 'done-late', status: 'completed', targetDate: '2026-07-01', progressPercent: 100 }),
    ], now);

    expect(summary.overdueCount).toBe(0);
    expect(summary.dueSoonCount).toBe(0);
    expect(summary.completedCount).toBe(1);
  });
});
