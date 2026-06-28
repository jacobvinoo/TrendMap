
import type { TrendScoreSnapshot } from './types'; 
import { getTrendById, getTrendScoreSnapshots, saveTrendScoreSnapshot } from './mockRepository';

export function captureTrendScoreSnapshot(trendId: string): TrendScoreSnapshot | null {
  const trend = getTrendById(trendId);
  if (!trend) return null;

  const snapshot = { 

    id: `score-snap-${trendId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trendId: trend.id,
    capturedAt: new Date().toISOString(),
    likelihoodScore: trend.likelihoodScore ?? trend.confidenceScore,
    confidenceScore: trend.confidenceScore,
    momentumScore: trend.momentumScore ?? 0,
    impactScore: trend.impactScore,
    horizon: trend.horizon || '3-5 years',
    maturityStage: trend.maturityStage || 'Emerging',
    evidenceCount: trend.relatedSignalIds?.length || 0,
    signalCount: trend.relatedSignalIds?.length || 0,
    sourceDiversity: 1,
    reason: 'Periodic snapshot capture'
  };

  saveTrendScoreSnapshot(snapshot);
  return snapshot;
}

export function getTrendHistory(trendId: string): TrendScoreSnapshot[] {
  // Return history sorted by capturedAt ascending (oldest first)
  const snapshots = getTrendScoreSnapshots(trendId);
  return snapshots.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
}
