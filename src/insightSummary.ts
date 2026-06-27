import type { Trend, InsightSummary } from './types';

/**
 * Generate an insight summary from approved trends.
 * Deterministic classification:
 * - keyTrends: top 2 trends sorted by impactScore descending.
 * - watchItems: trends with impactScore >= 0.7 but confidenceScore < 0.7.
 * - emergingRisks: trends that have any blockers.
 * - opportunities: trends that have any recommendedActions.
 */
export function generateInsightSummary(allTrends: Trend[]): InsightSummary {
  const now = new Date().toISOString();

  // Filter only approved trends (exclude rejected and candidate)
  const approvedTrends = allTrends.filter((t) => t.status === 'approved');

  // Ensure deterministic ordering by sorting by impactScore desc then name
  const sortedByImpact = [...approvedTrends].sort((a, b) => {
    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
    return a.name.localeCompare(b.name);
  });

  const keyTrends = sortedByImpact.slice(0, 2);

  const watchItems = approvedTrends.filter(
    (t) => t.impactScore >= 0.7 && t.confidenceScore < 0.7,
  );

  const emergingRisks = approvedTrends.filter((t) => t.blockers && t.blockers.length > 0);

  const opportunities = approvedTrends.filter(
    (t) => t.recommendedActions && t.recommendedActions.length > 0,
  );

  return {
    generatedAt: now,
    keyTrends,
    watchItems,
    emergingRisks,
    opportunities,
  };
}
