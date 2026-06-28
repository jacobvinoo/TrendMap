
import type { Signal, Trend, TrendScoreChange, TrendScoreSnapshot } from './types'; 

export function matchSignalsToExistingTrends(signals: Signal[], trends: Trend[]): { matchedSignals: Signal[], candidateTrends: Trend[] } {
  const matchedSignals: Signal[] = [];
  const candidateTrendsMap = new Map<string, Trend>();

  for (const signal of signals) {
    const candidate: Trend | undefined = trends.find(t => t.name.toLowerCase() === signal.signalType.toLowerCase());

    if (candidate) {
      if (candidate && !matchedSignals.includes(signal)) matchedSignals.push(signal);
      if (candidate && !candidate.relatedSignalIds.includes(signal.id)) candidate.relatedSignalIds.push(signal.id);
    } else {
      // It's unmatched, create a candidate trend or group it if we already made one
      let candidate: Trend | undefined = candidateTrendsMap.get(signal.signalType);
      if (!candidate) {
        candidate = { 
          id: `trend-cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: signal.signalType,
          summary: `Auto-generated candidate trend for ${signal.signalType}`,
          status: 'candidate',
          horizon: '3-5 years',
          maturityStage: 'Emerging',
          likelihoodScore: signal.confidenceScore,
          confidenceScore: signal.confidenceScore,
          impactScore: signal.strengthScore,
          momentumScore: signal.noveltyScore,
          relatedSignalIds: [],
          drivers: [],
          blockers: [],
          whatNeedsToBeTrue: [],
          leadingIndicators: [],
          monitoringQuestions: [],
          recommendedActions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        candidateTrendsMap.set(signal.signalType, candidate); 
      }
      candidate.relatedSignalIds.push(signal.id); 
    }
  }

  return { matchedSignals, candidateTrends: Array.from(candidateTrendsMap.values()) };
}

export function calculateTrendScoreUpdate(trend: Trend, relatedSignals: Signal[], previousSnapshot: TrendScoreSnapshot): TrendScoreChange | null {
  if (!relatedSignals || relatedSignals.length === 0) return null;

  let positiveImpact = 0;
  let negativeImpact = 0;

  for (const signal of relatedSignals) {
    const weight = (signal.strengthScore || 0.5) * (signal.confidenceScore || 0.5);
    if (signal.polarity === 'positive') { 
      positiveImpact += weight;
    } else if (signal.polarity === 'negative') { 
      negativeImpact += weight;
    }
  }

  // Scale down the change so scores move gradually
  const netChange = (positiveImpact - negativeImpact) * 0.1;

  if (netChange === 0) return null;

  const clamp = (val: number) => Math.max(0, Math.min(1, val));

  const newConfidence = clamp(trend.confidenceScore + netChange * 0.5);
  const newMomentum = clamp((trend.momentumScore || 0) + netChange * 1.2);
  const newImpact = clamp(trend.impactScore + netChange * 0.8);

  const reasonText = netChange > 0 ? 'Positive signals detected' : 'Negative/cooling signals detected';

  return {
    id: `score-change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trendId: trend.id,
    previousSnapshotId: previousSnapshot.id,
    currentSnapshotId: '', // Populated by orchestrator after capturing new snapshot
    changedAt: new Date().toISOString(),
    likelihoodDelta: netChange * 0.3,
    confidenceDelta: netChange * 0.5,
    impactDelta: netChange * 0.8,
    horizonChanged: false,
    maturityChanged: false,
    reason: reasonText,
    relatedSignalIds: relatedSignals.map(s => s.id),

    // Maintain legacy fields for compatibility with current orchestrator logic
    newConfidenceScore: newConfidence,
    newMomentumScore: newMomentum,
    newImpactScore: newImpact,
    primaryReason: reasonText,
    appliedAt: new Date().toISOString()
  };
}
