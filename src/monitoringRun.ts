
import type { MonitoringRun } from './types'; 
import { 
  getMonitoringRules,
  saveMonitoringRun,
  getSourceSnapshots,
  saveSourceSnapshot,
  saveChangeEvents,
  getTrends,
  saveSignals,
  saveTrends,
  
  getTrendScoreSnapshots,
  saveTrendScoreChange,
  saveAlerts,
  saveWhatChangedSummary
} from './mockRepository';
import { getMockFeedSnapshot, createSourceSnapshotFromDocuments } from './monitoringFeed';
import { detectChanges } from './changeDetection';
import { extractSignalsFromDocument } from './signalExtraction';
import { matchSignalsToExistingTrends, calculateTrendScoreUpdate } from './trendScoring';
import { generateAlerts } from './alertEngine';
import { generateWhatChangedSummary } from './whatChangedEngine';
import { captureTrendScoreSnapshot } from './trendHistory';

export async function runMonitoringRule(ruleId: string, scenario: 'baseline' | 'new_activity' | 'contradictory_activity'): Promise<MonitoringRun> {
  const rules = getMonitoringRules();
  const rule = rules.find(r => r.id === ruleId);

  const run: MonitoringRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    ruleId,
    sourceId: rule?.sourceId || 'unknown',
    startedAt: new Date().toISOString(),
    status: 'pending',
    documentsScanned: 0,
    newDocumentsFound: 0,
    updatedDocumentsFound: 0,
    newSignalsFound: 0,
    affectedTrendIds: [],
    alertIds: []
  };

  if (!rule) {
    run.status = 'failed';
    run.errorMessage = `Rule ${ruleId} not found.`;
    run.completedAt = new Date().toISOString();
    saveMonitoringRun(run);
    return run;
  }

  run.status = 'running';
  saveMonitoringRun(run);

  try {
    const existingSnapshots = getSourceSnapshots(rule.sourceId).sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
    const previousSnapshot = existingSnapshots.length > 0 ? existingSnapshots[0] : null;

    const currentDocs = getMockFeedSnapshot(rule.sourceId, scenario);
    const currentSnapshot = createSourceSnapshotFromDocuments(rule.sourceId, currentDocs);
    saveSourceSnapshot(currentSnapshot);

    const changes = detectChanges(previousSnapshot, currentSnapshot);
    saveChangeEvents(changes);

    run.documentsScanned = currentDocs.length;
    run.newDocumentsFound = changes.filter(c => c.changeType === 'new_document').length;
    run.updatedDocumentsFound = changes.filter(c => c.changeType === 'updated_document' || c.changeType === 'metadata_change').length;

    // Extract signals for new or updated docs
    const changedDocIds = new Set(changes.filter(c => c.changeType !== 'removed_document').map(c => c.documentId));
    const docsToProcess = currentDocs.filter(d => changedDocIds.has(d.id));
    
    let allExtractedSignals: any[] = [];
    for (const doc of docsToProcess) {
       const signals = extractSignalsFromDocument(doc);
       allExtractedSignals.push(...signals);
    }
    
    if (allExtractedSignals.length > 0) {
      saveSignals(allExtractedSignals);
      run.newSignalsFound = allExtractedSignals.length;
    }

    const currentTrends = getTrends();
    const { matchedSignals, candidateTrends } = matchSignalsToExistingTrends(allExtractedSignals, currentTrends);

    if (candidateTrends.length > 0) {
       saveTrends(candidateTrends);
       run.affectedTrendIds.push(...candidateTrends.map(t => t.id));
       // Capture initial snapshots for new candidates
       candidateTrends.forEach(t => captureTrendScoreSnapshot(t.id));
    }

    // Since we don't have full score generation yet in the stub, we just simulate
    const scoreChanges = [];
    const { updateTrend } = await import('./mockRepository');
    
    for (const trend of currentTrends) {
       const related = matchedSignals.filter(s => trend.relatedSignalIds.includes(s.id) || s.signalType.toLowerCase() === trend.name.toLowerCase()); 
       
       let previousSnapshot = null;
        if (related.length > 0) {
          const existingSnapshots = getTrendScoreSnapshots(trend.id);
          if (existingSnapshots.length > 0) {
            existingSnapshots.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
            previousSnapshot = existingSnapshots[0];
          } else {
            // No prior snapshot exists. Capture a baseline snapshot so we can establish traceability.
            previousSnapshot = captureTrendScoreSnapshot(trend.id);
          }
        }
       
        if (!previousSnapshot) continue;
        const update = calculateTrendScoreUpdate(trend, related, previousSnapshot);
        if (update) {
          if (!run.affectedTrendIds.includes(trend.id)) run.affectedTrendIds.push(trend.id);
          
          // Apply score update
          updateTrend(trend.id, {
            confidenceScore: update.newConfidenceScore,
            momentumScore: update.newMomentumScore,
            impactScore: update.newImpactScore
          });
          
          // Capture new snapshot
          const newSnapshot = captureTrendScoreSnapshot(trend.id);
          if (newSnapshot) {
            update.currentSnapshotId = newSnapshot.id;
          }

          // Save the score change now that it has the current snapshot reference
          saveTrendScoreChange(update);
          scoreChanges.push(update);
        }
    }

    const alerts = generateAlerts(scoreChanges, candidateTrends, allExtractedSignals);
    if (alerts.length > 0) {
      saveAlerts(alerts);
      run.alertIds.push(...alerts.map(a => a.id));
    }

    const summary = generateWhatChangedSummary(run, allExtractedSignals, [...currentTrends, ...candidateTrends], scoreChanges, alerts);
    saveWhatChangedSummary(summary);

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    saveMonitoringRun(run);

    return run;
  } catch (error: any) {
    run.status = 'failed';
    run.errorMessage = error.message || 'Unknown error';
    run.completedAt = new Date().toISOString();
    saveMonitoringRun(run);
    return run;
  }
}
