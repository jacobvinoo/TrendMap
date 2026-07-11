
import type { TrendScoreSnapshot, Trend } from './types'; 

export function generateTrendScoreSnapshot(trend: Trend): TrendScoreSnapshot {

  const snapshot = { 

    id: `score-snap-${trend.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  return snapshot;
}


