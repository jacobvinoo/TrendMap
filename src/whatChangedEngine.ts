
import type { WhatChangedSummary, MonitoringRun, Signal, Trend, TrendScoreChange, Alert } from './types'; 

export function generateWhatChangedSummary(run: MonitoringRun, signals: Signal[], trends: Trend[], scoreChanges: TrendScoreChange[], alerts: Alert[]): WhatChangedSummary {
  const newCandidateTrends = trends.filter(t => t.status === 'candidate');
  
  let headline = '';
  if (signals.length === 0 && scoreChanges.length === 0 && newCandidateTrends.length === 0) {
    headline = 'No significant changes detected in this run.';
  } else {
    headline = `Found ${signals.length} new signal${signals.length === 1 ? '' : 's'} and updated ${scoreChanges.length} trend${scoreChanges.length === 1 ? '' : 's'}.`;
  }

  const recommendedActions: string[] = [];

  for (const cand of newCandidateTrends) {
    recommendedActions.push(`Review candidate trend: "${cand.name}"`);
  }

  for (const alert of alerts) {
    if (alert.severity === 'critical') {
      recommendedActions.push(`Acknowledge critical alert for trend ID ${alert.trendId}`);
    } else if (alert.severity === 'warning') {
      recommendedActions.push(`Review warning alert for trend ID ${alert.trendId}`);
    }
  }

  const changedTrends = trends.filter(t => scoreChanges.some(sc => sc.trendId === t.id));

  return {
    id: `summary-${run.id}`,
    monitoringRunId: run.id,
    generatedAt: new Date().toISOString(),
    headline,
    newSignals: signals,
    changedTrends,
    newCandidateTrends,
    alerts,
    recommendedActions
  };
}
