import type { RoadmapItem } from './types';

export interface RoadmapExecutionSummary {
  totalItems: number;
  overdueCount: number;
  dueSoonCount: number;
  blockedCount: number;
  completedCount: number;
  missingExecutionDetailsCount: number;
  averageProgressPercent: number;
  attentionItems: RoadmapItem[];
}

function targetDateFor(item: RoadmapItem): string {
  return item.targetDate || item.target_date || '';
}

function progressFor(item: RoadmapItem): number {
  const raw = item.progressPercent ?? item.progress_percent ?? 0;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function daysBetween(left: Date, right: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const leftDay = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate());
  const rightDay = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());
  return Math.floor((rightDay - leftDay) / dayMs);
}

export function summarizeRoadmapExecution(
  items: RoadmapItem[],
  now: Date = new Date(),
): RoadmapExecutionSummary {
  const activeItems = items.filter((item) => item.status !== 'rejected' && item.status !== 'completed');
  const completedCount = items.filter((item) => item.status === 'completed').length;
  const blockedItems = items.filter((item) => item.status === 'blocked');

  const overdueItems = activeItems.filter((item) => {
    const targetDate = targetDateFor(item);
    if (!targetDate) return false;
    const parsed = new Date(`${targetDate}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && daysBetween(now, parsed) < 0;
  });

  const dueSoonItems = activeItems.filter((item) => {
    const targetDate = targetDateFor(item);
    if (!targetDate) return false;
    const parsed = new Date(`${targetDate}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime())) return false;
    const days = daysBetween(now, parsed);
    return days >= 0 && days <= 30;
  });

  const missingExecutionDetails = activeItems.filter((item) => !item.owner || !targetDateFor(item));
  const progressValues = items.map(progressFor);
  const averageProgressPercent = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : 0;

  const attentionById = new Map<string, RoadmapItem>();
  [...blockedItems, ...overdueItems, ...missingExecutionDetails].forEach((item) => attentionById.set(item.id, item));

  return {
    totalItems: items.length,
    overdueCount: overdueItems.length,
    dueSoonCount: dueSoonItems.length,
    blockedCount: blockedItems.length,
    completedCount,
    missingExecutionDetailsCount: missingExecutionDetails.length,
    averageProgressPercent,
    attentionItems: [...attentionById.values()],
  };
}
