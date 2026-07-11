// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import type { MonitoringRun } from './types'; 
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { 
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  getMonitoringRules,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveMonitoringRun,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  getSourceSnapshots,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveSourceSnapshot,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveChangeEvents,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  getTrends,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveSignals,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveTrends,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  getTrendScoreSnapshots,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveTrendScoreSnapshot,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveTrendScoreChange,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveAlerts,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveWhatChangedSummary
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
} from './mockRepository';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { getMockFeedSnapshot, createSourceSnapshotFromDocuments } from './monitoringFeed';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { detectChanges } from './changeDetection';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { extractSignalsFromDocument } from './signalExtraction';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { matchSignalsToExistingTrends, calculateTrendScoreUpdate } from './trendScoring';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { generateAlerts } from './alertEngine';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { generateWhatChangedSummary } from './whatChangedEngine';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
import { generateTrendScoreSnapshot } from './trendHistory';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
export async function runMonitoringRule(ruleId: string, scenario: 'baseline' | 'new_activity' | 'contradictory_activity'): Promise<MonitoringRun> {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  const rules = getMonitoringRules();
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  const rule = rules.find(r => r.id === ruleId);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  const run: MonitoringRun = {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    ruleId,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    sourceId: rule?.sourceId || 'unknown',
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    startedAt: new Date().toISOString(),
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    status: 'pending',
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    documentsScanned: 0,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    newDocumentsFound: 0,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    updatedDocumentsFound: 0,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    newSignalsFound: 0,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    affectedTrendIds: [],
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    alertIds: []
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  };
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  if (!rule) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.status = 'failed';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.errorMessage = `Rule ${ruleId} not found.`;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.completedAt = new Date().toISOString();
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveMonitoringRun(run);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    return run;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  run.status = 'running';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  saveMonitoringRun(run);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  try {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const existingSnapshots = getSourceSnapshots(rule.sourceId).sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const previousSnapshot = existingSnapshots.length > 0 ? existingSnapshots[0] : null;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const currentDocs = getMockFeedSnapshot(rule.sourceId, scenario);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const currentSnapshot = createSourceSnapshotFromDocuments(rule.sourceId, currentDocs);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveSourceSnapshot(currentSnapshot);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const changes = detectChanges(previousSnapshot, currentSnapshot);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveChangeEvents(changes);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.documentsScanned = currentDocs.length;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.newDocumentsFound = changes.filter(c => c.changeType === 'new_document').length;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.updatedDocumentsFound = changes.filter(c => c.changeType === 'updated_document' || c.changeType === 'metadata_change').length;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    // Extract signals for new or updated docs
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const changedDocIds = new Set(changes.filter(c => c.changeType !== 'removed_document').map(c => c.documentId));
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const docsToProcess = currentDocs.filter(d => changedDocIds.has(d.id));
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    let allExtractedSignals: any[] = [];
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    for (const doc of docsToProcess) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       const signals = extractSignalsFromDocument(doc);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       allExtractedSignals.push(...signals);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    if (allExtractedSignals.length > 0) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
      saveSignals(allExtractedSignals);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
      run.newSignalsFound = allExtractedSignals.length;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const currentTrends = getTrends();
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const { matchedSignals, candidateTrends } = matchSignalsToExistingTrends(allExtractedSignals, currentTrends);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    if (candidateTrends.length > 0) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       saveTrends(candidateTrends);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       run.affectedTrendIds.push(...candidateTrends.map(t => t.id));
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       // Capture initial snapshots for new candidates
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       candidateTrends.forEach(t => saveTrendScoreSnapshot(generateTrendScoreSnapshot(t)));
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    // Since we don't have full score generation yet in the stub, we just simulate
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const scoreChanges = [];
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const { updateTrend } = await import('./mockRepository');
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    for (const trend of currentTrends) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       const related = matchedSignals.filter(s => trend.relatedSignalIds.includes(s.id) || s.signalType.toLowerCase() === trend.name.toLowerCase()); 
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       let previousSnapshot = null;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        if (related.length > 0) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          const existingSnapshots = getTrendScoreSnapshots(trend.id);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          if (existingSnapshots.length > 0) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            existingSnapshots.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            previousSnapshot = existingSnapshots[0];
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          } else {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            // No prior snapshot exists. Capture a baseline snapshot so we can establish traceability.
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            previousSnapshot = generateTrendScoreSnapshot(trend);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            saveTrendScoreSnapshot(previousSnapshot);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
       
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        if (!previousSnapshot) continue;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        const update = calculateTrendScoreUpdate(trend, related, previousSnapshot);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        if (update) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          if (!run.affectedTrendIds.includes(trend.id)) run.affectedTrendIds.push(trend.id);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          // Apply score update
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          updateTrend(trend.id, {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            confidenceScore: update.newConfidenceScore,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            momentumScore: update.newMomentumScore,
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            impactScore: update.newImpactScore
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          });
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          // Capture new snapshot
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          const newSnapshot = generateTrendScoreSnapshot(trend);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          if (newSnapshot) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            saveTrendScoreSnapshot(newSnapshot);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
            update.currentSnapshotId = newSnapshot.id;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          // Save the score change now that it has the current snapshot reference
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          saveTrendScoreChange(update);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
          scoreChanges.push(update);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
        }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const alerts = generateAlerts(scoreChanges, candidateTrends, allExtractedSignals);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    if (alerts.length > 0) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
      saveAlerts(alerts);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
      run.alertIds.push(...alerts.map(a => a.id));
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    const summary = generateWhatChangedSummary(run, allExtractedSignals, [...currentTrends, ...candidateTrends], scoreChanges, alerts);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveWhatChangedSummary(summary);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.status = 'completed';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.completedAt = new Date().toISOString();
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveMonitoringRun(run);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.

// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    return run;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  } catch (error: any) {
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.status = 'failed';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.errorMessage = error.message || 'Unknown error';
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    run.completedAt = new Date().toISOString();
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    saveMonitoringRun(run);
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
    return run;
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
  }
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
}
// @local-only - This file orchestrates mock monitoring runs and should only be used by LocalMockRepository.
