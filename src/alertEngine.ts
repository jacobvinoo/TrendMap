
import type { Alert, TrendScoreChange, Trend, Signal } from './types'; 

export function generateAlerts(scoreChanges: TrendScoreChange[], newTrends: Trend[], signals: Signal[]): Alert[] { 
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  const getDocAndSourceIds = (signalIds: string[]) => {
    const relatedDocs = new Set<string>();
    const relatedSources = new Set<string>();
    for (const sid of signalIds) {
      const sig = signals.find(s => s.id === sid);
      if (sig) {
        if (sig.documentId) relatedDocs.add(sig.documentId);
        if (sig.sourceId) relatedSources.add(sig.sourceId);
      }
    }
    return { docs: Array.from(relatedDocs), sources: Array.from(relatedSources) };
  };

  // Alert for new candidate trends
  for (const trend of newTrends) {
    const { docs, sources } = getDocAndSourceIds(trend.relatedSignalIds || []);
    alerts.push({
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      trendId: trend.id,
      alertType: 'new_candidate',
      severity: 'info',
      title: 'New Candidate Trend Discovered',
      summary: `A new candidate trend "${trend.name}" was identified from recent signal clusters.`,
      message: `New candidate trend detected: ${trend.name}`,
      createdAt: now,
      acknowledged: false,
      relatedSignalIds: trend.relatedSignalIds || [],
      relatedDocumentIds: docs,
      relatedSourceIds: sources
    });
  }

  // Alert for significant score changes
  for (const change of scoreChanges) {
    const { docs, sources } = getDocAndSourceIds(change.relatedSignalIds || []);
    if (change.newImpactScore !== undefined && change.newImpactScore >= 0.8) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trendId: change.trendId,
        alertType: 'score_threshold_crossed',
        severity: 'critical',
        title: 'High Impact Threshold Reached',
        summary: `A trend has crossed the critical impact threshold of 80%.`,
        message: `High impact threshold reached for trend based on recent signals.`,
        createdAt: now,
        acknowledged: false,
        relatedSignalIds: change.relatedSignalIds || [],
        relatedDocumentIds: docs,
        relatedSourceIds: sources
      });
    } else if (change.newMomentumScore !== undefined && change.newMomentumScore < 0.5 && (change.reason || change.reason)?.includes('Negative')) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trendId: change.trendId,
        alertType: 'anomaly_detected',
        severity: 'warning',
        title: 'Significant Momentum Drop',
        summary: `Trend momentum has dropped below 50% due to negative or cooling signals.`,
        message: `Significant momentum drop detected for trend due to negative signals.`,
        createdAt: now,
        acknowledged: false,
        relatedSignalIds: change.relatedSignalIds || [],
        relatedDocumentIds: docs,
        relatedSourceIds: sources
      });
    }
  }

  return alerts;
}
