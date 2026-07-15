// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Trend, EvidenceLink, TrendScoreSnapshot, TrendScoreChange, Workspace } from './types'; 
import LogViewerModal from './LogViewerModal';
import { MovableModal } from './MovableModal';
import {
  buildYearImpactSeries,
  emptyBusinessOpportunityInputs,
  estimateTrendOpportunities,
  sizeBusinessOpportunity,
  type BusinessOpportunityInputs,
} from './trendOpportunity';
import { createStrategicOptionFromTrend } from './strategicActionEngine';

interface EvidenceWithTraceability extends EvidenceLink {
  sourceName?: string;
  documentTitle?: string;
  documentDate?: string;
  retrievedDate?: string;
}

import { repository } from './repository';
import { approvalRestrictionMessage, canApproveTrends } from './workspacePermissions';

function entityId(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') return value.id ? String(value.id) : undefined;
  return String(value);
}

function evidenceDocumentId(ev: any): string | undefined {
  return ev.documentId ?? ev.document_id ?? entityId(ev.document);
}

function evidenceSourceId(ev: any): string | undefined {
  return ev.sourceId ?? ev.source_id ?? entityId(ev.source);
}

function rawDate(value: any): string | undefined {
  if (!value) return undefined;
  return String(value);
}

function sourceRetrievedDate(source: any, doc: any, ev: any): string | undefined {
  return rawDate(source?.retrievedAt ?? source?.retrieved_at)
    ?? rawDate(source?.updatedAt ?? source?.updated_at)
    ?? rawDate(source?.createdAt ?? source?.created_at)
    ?? rawDate(doc?.createdAt ?? doc?.created_at)
    ?? rawDate(ev?.createdAt ?? ev?.created_at)
    ?? rawDate(doc?.publishedDate ?? doc?.published_date);
}

function formatReferenceDate(value?: string): string {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function pct(value?: number): number {
  return Math.round((value ?? 0) * 100);
}

function movementLabel(delta?: number): string {
  if ((delta ?? 0) > 0.005) return 'increased';
  if ((delta ?? 0) < -0.005) return 'decreased';
  return 'stayed';
}

function evidenceSignalId(ev: any): string | undefined {
  return ev.signalId ?? ev.signal_id ?? entityId(ev.signal);
}

function timelineEvidenceForChange(change: TrendScoreChange, evidence: EvidenceWithTraceability[]): EvidenceWithTraceability[] {
  const relatedIds = new Set(change.relatedSignalIds || []);
  const matched = evidence.filter((ev) => {
    const signalId = evidenceSignalId(ev);
    return signalId ? relatedIds.has(signalId) : false;
  });
  return matched.length ? matched : evidence;
}

function scoreMovementText(change: TrendScoreChange, previous?: TrendScoreSnapshot, current?: TrendScoreSnapshot): string {
  const previousImportance = pct(previous?.impactScore);
  const currentImportance = pct(current?.impactScore ?? change.newImpactScore);
  const movement = movementLabel(change.impactDelta);
  if (movement === 'stayed') return `Importance stayed at ${currentImportance}%.`;
  return `Importance ${movement} from ${previousImportance}% to ${currentImportance}%.`;
}

/**
 * TrendReviewBoard – displays candidate trends and allows approve/reject/edit actions.
 * Provides an executive-level detailed review panel with evidence and strategic analysis.
 */
const TrendReviewBoard: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selected, setSelected] = useState<Trend | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, number>>({});
  const [trendReferenceMap, setTrendReferenceMap] = useState<Record<string, EvidenceWithTraceability[]>>({});
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceWithTraceability[]>([]);
  const [scoreHistory, setScoreHistory] = useState<TrendScoreSnapshot[]>([]);
  const [scoreChanges, setScoreChanges] = useState<TrendScoreChange[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [strategyMessage, setStrategyMessage] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const loadData = async () => {
    try {
      const [allTrends, docs, sources] = await Promise.all([
        repository.getTrends(),
        repository.getDocuments(),
        repository.getSources(),
      ]);
      setWorkspace(await repository.getActiveWorkspace());
      const map: Record<string, number> = {};
      const references: Record<string, EvidenceWithTraceability[]> = {};
      
      const reviewableTrends = allTrends.filter(t => t.status === 'candidate' || t.status === 'approved');

      // Load evidence counts for each trend shown on the board.
      await Promise.all(
        reviewableTrends.map(async (t) => {
          const evidences = await repository.getEvidenceForTrend(t.id);
          map[t.id] = evidences.length;
          references[t.id] = evidences.map(ev => {
            const docId = evidenceDocumentId(ev);
            const sourceId = evidenceSourceId(ev);
            const doc = docs.find(d => d.id === docId);
            const source = sources.find(s => s.id === sourceId);
            return {
              ...ev,
              sourceName: source?.name,
              documentTitle: doc?.title,
              documentDate: doc?.publishedDate,
              retrievedDate: sourceRetrievedDate(source, doc, ev),
            };
          });
        })
      );
      
      const cleanReviewable = reviewableTrends
        .filter((t) => !/^test trend$/i.test(t.name || ''))
        .filter((t) => !/^(trend|emerging strategic trends)$/i.test((t.name || '').trim()));

      const candidateWithEvidence = cleanReviewable
        .filter((t) => t.status === 'candidate')
        .filter((t) => (map[t.id] ?? 0) > 0);
      const latestRunId = candidateWithEvidence
        .filter((trend) => trend.extractionRunId)
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())[0]?.extractionRunId;
      const candidateDeduped = new Map<string, Trend>();
      const approvedDeduped = new Map<string, Trend>();

      candidateWithEvidence
        .filter((trend) => !latestRunId || trend.extractionRunId === latestRunId)
        .forEach((trend) => {
          const key = (trend.name || '').trim().toLowerCase();
          const existing = candidateDeduped.get(key);
          if (!existing || new Date(trend.createdAt || 0).getTime() > new Date(existing.createdAt || 0).getTime()) {
            candidateDeduped.set(key, trend);
          }
        });

      cleanReviewable
        .filter((trend) => trend.status === 'approved')
        .forEach((trend) => {
          const key = (trend.name || '').trim().toLowerCase();
          const existing = approvedDeduped.get(key);
          if (!existing || new Date(trend.createdAt || 0).getTime() > new Date(existing.createdAt || 0).getTime()) {
            approvedDeduped.set(key, trend);
          }
        });

      setTrends([...candidateDeduped.values(), ...approvedDeduped.values()]);
      setEvidenceMap(map);
      setTrendReferenceMap(references);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!canApproveTrends(workspace)) {
      setStrategyMessage(approvalRestrictionMessage('trend'));
      return;
    }
    await repository.updateTrend(id, { status: 'approved' });
    await loadData();
  };

  const handleReject = async (id: string) => {
    if (!canApproveTrends(workspace)) {
      setStrategyMessage(approvalRestrictionMessage('trend'));
      return;
    }
    await repository.updateTrend(id, { status: 'rejected' });
    await loadData();
  };

  const handleSelect = async (trend: Trend) => {
    const [docs, sources, evidence, scoreSnaps, latestTrends] = await Promise.all([
      repository.getDocuments(),
      repository.getSources(),
      repository.getEvidenceForTrend(trend.id),
      repository.getScoreHistory(trend.id),
      repository.getTrends(),
    ]);
    const latestTrend = latestTrends.find((item) => item.id === trend.id) || trend;

    setSelected(latestTrend);

    const evLinks = evidence.map(ev => {
      const docId = evidenceDocumentId(ev);
      const sourceId = evidenceSourceId(ev);
      const doc = docs.find(d => d.id === docId);
      const source = sources.find(s => s.id === sourceId);
      return {
        ...ev,
        sourceName: source?.name,
        documentTitle: doc?.title,
        documentDate: doc?.publishedDate,
        retrievedDate: sourceRetrievedDate(source, doc, ev),
      };
    });

    const snaps = Array.isArray(scoreSnaps) ? scoreSnaps : (scoreSnaps.snapshots || []);
    const changes = Array.isArray(scoreSnaps) ? [] : (scoreSnaps.changes || []);
    snaps.sort((a: any, b: any) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
    changes.sort((a: any, b: any) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());

    setSelectedEvidence(evLinks);
    setScoreHistory(snaps);
    setScoreChanges(changes);
    setEditName(latestTrend.name);
    setIsEditing(false);
    setShowHistory(false);
    setStrategyMessage('');
  };

  const handleSaveEdit = async () => {
    if (selected && editName.trim() !== '' && editName !== selected.name) {
      await repository.updateTrend(selected.id, { name: editName });
      
      // Update local selected state
      setSelected({ ...selected, name: editName });
      
      await loadData();
    }
    setIsEditing(false);
  };

  const handleCreateStrategicOption = async (trend: Trend) => {
    const option = createStrategicOptionFromTrend(trend, { evidenceCount: evidenceMap[trend.id] ?? selectedEvidence.length });
    const existingOptions = await repository.getStrategicOptions();
    const alreadyExists = existingOptions.some((existing) => existing.id === option.id);

    if (!alreadyExists) {
      await repository.saveStrategicOptions([option]);
    }

    setStrategyMessage(
      alreadyExists
        ? 'Strategic option already exists in this workspace. Open Strategy Options to continue planning.'
        : 'Strategic option created. Open Strategy Options to refine owner, investment, timing, and roadmap fit.',
    );
  };

  const approvedTrends = trends.filter(t => t.status === 'approved');
  const opportunityEstimates = estimateTrendOpportunities(approvedTrends);

  return (
    <div style={{ padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Trend Review Board</h2>
        <button
          type="button"
          onClick={() => setShowLogs(true)}
          style={{ padding: '0.5rem 1rem', background: '#2a2a4a', color: '#e0e0ff', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          View Logs
        </button>
      </div>

      {showLogs && <LogViewerModal onClose={() => setShowLogs(false)} />}
      {!selected && strategyMessage && (
        <div role="status" style={{ marginBottom: '1rem', background: '#10291f', color: '#b6f3d0', border: '1px solid #1f7a4c', borderRadius: '6px', padding: '0.7rem 0.85rem', fontSize: '0.9rem' }}>
          {strategyMessage}
        </div>
      )}
      
      {selected ? (
        // Executive Detail Panel
        <div style={{ background: '#1a1a2e', borderRadius: '8px', border: '1px solid #3a3a5a', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Header section with edit capability */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2a2a4a', paddingBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Edit trend name"
                    style={{ fontSize: '1.5rem', padding: '0.5rem', background: '#0f0f1a', color: '#fff', border: '1px solid #5a5aff', borderRadius: '4px', width: '80%' }}
                  />
                  <button onClick={handleSaveEdit} style={{ padding: '0.5rem 1rem', background: '#5a5aff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#e0e0ff' }}>{selected.name}</h3>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    aria-label="Edit"
                    style={{ padding: '0.3rem 0.6rem', background: '#2a2a4a', color: '#a0a0ff', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Edit Name
                  </button>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    style={{ padding: '0.3rem 0.6rem', background: '#2a2a4a', color: '#a0a0ff', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 'auto' }}
                  >
                    {showHistory ? 'View Details' : 'View History'}
                  </button>
                  {selected.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleCreateStrategicOption(selected)}
                      style={{ padding: '0.3rem 0.6rem', background: '#3b2f71', color: '#f4f3ff', border: '1px solid #6d5dfc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Create Strategic Option
                    </button>
                  )}
                </div>
              )}
              <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '0.5rem' }}>{selected.summary}</p>
              {strategyMessage && (
                <div role="status" style={{ marginTop: '0.75rem', background: '#10291f', color: '#b6f3d0', border: '1px solid #1f7a4c', borderRadius: '6px', padding: '0.7rem 0.85rem', fontSize: '0.9rem' }}>
                  {strategyMessage}
                </div>
              )}
            </div>
            
            <button 
              type="button" 
              aria-label="Close" 
              onClick={() => setSelected(null)}
              style={{ padding: '0.5rem 1.5rem', background: 'transparent', color: '#e0e0ff', border: '1px solid #5a5aff', borderRadius: '4px', cursor: 'pointer' }}
            >
              Back to Board
            </button>
          </div>

          {/* Scores & Metrics */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <MetricBox label="Likelihood" value={(selected.likelihoodScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Confidence" value={(selected.confidenceScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Impact" value={(selected.impactScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Horizon" value={selected.horizon} />
            <MetricBox label="Maturity" value={selected.maturityStage} />
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Left Column: Strategic Fields */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ color: '#a0a0ff', margin: 0, borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>Strategic Analysis</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <StrategicList title="What Needs To Be True" items={selected.whatNeedsToBeTrue} />
                <StrategicList title="Leading Indicators" items={selected.leadingIndicators} />
                <StrategicList title="Monitoring Questions" items={selected.monitoringQuestions} />
                <StrategicList title="Recommended Actions" items={selected.recommendedActions} />
                <StrategicList title="Drivers" items={selected.drivers} />
                <StrategicList title="Blockers" items={selected.blockers} />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: '#a0a0ff', margin: '0 0 1rem 0', borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>Score History Timeline</h4>
                {scoreHistory.length > 0 ? (
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {scoreHistory.map(snap => (
                      <div key={snap.id} style={{ minWidth: '150px', background: '#2a2a4a', padding: '1rem', borderRadius: '8px', border: '1px solid #3a3a5a' }}>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>
                          {new Date(snap.capturedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                          L: {Math.round((snap.likelihoodScore ?? snap.confidenceScore ?? 0) * 100)}% | M: {Math.round((snap.momentumScore ?? 0) * 100)}% | I: {Math.round(snap.impactScore * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>No score history available.</p>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: '#a0a0ff', margin: '0 0 1rem 0', borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>Trend Development Timeline</h4>
                {scoreChanges.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {scoreChanges.map((change) => {
                      const previous = scoreHistory.find((snap) => snap.id === change.previousSnapshotId);
                      const current = scoreHistory.find((snap) => snap.id === change.currentSnapshotId);
                      const relatedEvidence = timelineEvidenceForChange(change, selectedEvidence);
                      return (
                        <div key={change.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
                          <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                            {formatReferenceDate(change.changedAt)}
                          </div>
                          <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '1rem', background: '#13132b', borderRadius: '0 8px 8px 0', padding: '0.9rem 1rem' }}>
                            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.4rem' }}>
                              {scoreMovementText(change, previous, current)}
                            </div>
                            <p style={{ color: '#c7c7e8', margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
                              {change.primaryReason || change.reason || 'Score changed based on the latest evidence review.'}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {relatedEvidence.slice(0, 3).map((ev) => (
                                <div key={`${change.id}-${ev.id}`} style={{ border: '1px solid #2a2a4a', borderRadius: '6px', padding: '0.75rem', background: '#10101f' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: '#aaa', fontSize: '0.78rem', marginBottom: '0.45rem' }}>
                                    <span><em>Source</em>: {ev.sourceName || evidenceSourceId(ev) || 'Unknown source'}</span>
                                    <span><em>Document</em>: {ev.documentTitle || evidenceDocumentId(ev) || 'Unknown document'}</span>
                                    <span><em>Evidence date</em>: {formatReferenceDate(ev.documentDate)}</span>
                                  </div>
                                  <div style={{ color: '#ddd', fontSize: '0.88rem', fontStyle: 'italic' }}>
                                    {ev.quote}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>No score movement events yet.</p>
                )}
              </div>
            </div>

            {/* Right Column: Evidence */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: '#13132b', padding: '1.5rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#a0a0ff', margin: 0 }}>Why this trend exists (Evidence)</h4>
              {selectedEvidence.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.9rem' }}>No direct evidence linked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedEvidence.map(ev => (
                    <div key={ev.id} style={{ borderLeft: '3px solid #5a5aff', paddingLeft: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                        <span style={{ color: '#a0a0ff' }}>Source:</span> {ev.sourceName || ev.sourceId} &nbsp;|&nbsp; 
                        <span style={{ color: '#a0a0ff' }}> Retrieved:</span> {formatReferenceDate(ev.retrievedDate)} &nbsp;|&nbsp; 
                        <span style={{ color: '#a0a0ff' }}> Document:</span> {ev.documentTitle || ev.documentId} ({ev.documentDate})
                      </div>
                      <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#ddd', fontSize: '0.95rem' }}>
                        "{ev.quote}"
                      </blockquote>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#aaa', fontSize: '0.85rem' }}>
                        <strong>Relevance:</strong> {ev.relevanceReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Board View
        trends.length === 0 ? (
          <p style={{ color: '#888' }}>No candidate trends to review. Approved trends will appear here after review.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <TrendSection
              title="Candidate Trends"
              emptyText="No candidate trends waiting for review."
              trends={trends.filter(t => t.status === 'candidate')}
              evidenceMap={evidenceMap}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelect={handleSelect}
              onCreateStrategicOption={handleCreateStrategicOption}
              canApprove={canApproveTrends(workspace)}
            />
            <TrendImpactPlanning estimates={opportunityEstimates} referencesByTrend={trendReferenceMap} />
            <TrendSection
              title="Approved Trends"
              emptyText="Approved trends will appear here after review."
              trends={trends.filter(t => t.status === 'approved')}
              evidenceMap={evidenceMap}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelect={handleSelect}
              onCreateStrategicOption={handleCreateStrategicOption}
              canApprove={canApproveTrends(workspace)}
            />
          </div>
        )
      )}

      {showHistory && selected && (
        <MovableModal
          title={`History: ${selected.name}`}
          onClose={() => setShowHistory(false)}
        >
          <div className="p-4" style={{ background: '#1a1a2e', color: '#e0e0ff' }}>
            <div className="space-y-4">
              {(!selected.logs || selected.logs.length === 0) ? (
                <div className="text-sm italic text-gray-500">No logs available for this trend.</div>
              ) : (
                selected.logs.map((log, i) => (
                  <div key={i} className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-4 text-sm" style={{ background: '#2a2a4a', padding: '1rem', borderRadius: '8px', border: '1px solid #3a3a5a', marginBottom: '1rem' }}>
                    <div className="mb-2 text-xs text-gray-400" style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>
                      {new Date(log.date).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-300" style={{ color: '#e0e0ff', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 flex justify-end border-t border-gray-800 pt-4" style={{ marginTop: '1rem', borderTop: '1px solid #2a2a4a', paddingTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setShowHistory(false)}
                className="rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-600/30"
                style={{ padding: '0.5rem 1rem', background: '#2a2a4a', color: '#a0a0ff', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};

// Helper Components
const MetricBox = ({ label, value }: { label: string, value: string | number }) => (
  <div style={{ background: '#13132b', padding: '1rem', borderRadius: '8px', border: '1px solid #2a2a4a', minWidth: '120px' }}>
    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '1.4rem', color: '#e0e0ff', fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
  </div>
);

const formatTrendReferences = (refs: EvidenceWithTraceability[] = []): string => {
  if (!refs.length) return 'References: no linked snippets or sources available.';

  return [
    'References:',
    ...refs.slice(0, 4).map((ref, index) => {
      const source = ref.sourceName || ref.sourceId || 'Unknown source';
      const document = ref.documentTitle || ref.documentId || 'Unknown document';
      const retrieved = formatReferenceDate(ref.retrievedDate);
      const snippet = (ref.quote || ref.relevanceReason || '').replace(/\s+/g, ' ').trim();
      return `${index + 1}. Source: ${source}; Retrieved: ${retrieved}; Document: ${document}; Snippet: ${snippet || 'No snippet captured.'}`;
    }),
    refs.length > 4 ? `+ ${refs.length - 4} more reference${refs.length - 4 === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join('\n');
};

const referenceLabelStyle = {
  color: '#aeb0ff',
  display: 'inline-block',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic' as const,
  minWidth: '4.9rem',
};

const renderReferenceLine = (line: string, index: number) => {
  const match = line.match(/^(\d+)\.\s+Source:\s*(.*?);\s*Retrieved:\s*(.*?);\s*Document:\s*(.*?);\s*Snippet:\s*(.*)$/);
  if (!match) {
    if (line === 'References:') {
      return (
        <div key={index} style={{ color: '#f8fafc', fontWeight: 700, marginTop: '0.7rem', marginBottom: '0.45rem' }}>
          References
        </div>
      );
    }
    if (line.startsWith('+ ')) {
      return <div key={index} style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '0.45rem' }}>{line}</div>;
    }
    return <p key={index} style={{ color: '#d1d5db', margin: index === 0 ? '0 0 0.35rem 0' : '0.25rem 0' }}>{line}</p>;
  }

  const [, number, source, retrieved, document, snippet] = match;
  return (
    <div
      key={index}
      style={{
        background: '#15162c',
        border: '1px solid #2b2d55',
        borderRadius: '8px',
        marginTop: '0.45rem',
        padding: '0.65rem 0.75rem',
      }}
    >
      <div style={{ color: '#cbd5e1', fontWeight: 700, marginBottom: '0.45rem' }}>Reference {number}</div>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <div><em style={referenceLabelStyle}>Source</em><span>{source}</span></div>
        <div><em style={referenceLabelStyle}>Retrieved</em><span>{retrieved}</span></div>
        <div><em style={referenceLabelStyle}>Document</em><span>{document}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '4.9rem 1fr', gap: 0 }}>
          <em style={referenceLabelStyle}>Snippet</em>
          <span style={{ color: '#e5e7eb' }}>{snippet}</span>
        </div>
      </div>
    </div>
  );
};

const ReferenceDetails = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
    {text.split('\n').filter(Boolean).map(renderReferenceLine)}
  </div>
);

const businessInputFields: Array<{
  key: keyof BusinessOpportunityInputs;
  label: string;
  suffix?: string;
  placeholder: string;
}> = [
  { key: 'onlineGroceryRevenue', label: 'Online grocery revenue', placeholder: '50000000' },
  { key: 'searchToCartConversion', label: 'Search-to-cart conversion', suffix: '%', placeholder: '8' },
  { key: 'recommendationAttributedSales', label: 'Recommendation-attributed sales', placeholder: '7500000' },
  { key: 'substitutionRate', label: 'Substitution rate', suffix: '%', placeholder: '5' },
  { key: 'churnRate', label: 'Churn rate', suffix: '%', placeholder: '12' },
  { key: 'complaintsRefunds', label: 'Complaints / refunds', placeholder: '350000' },
  { key: 'retailMediaRevenue', label: 'Retail media revenue', placeholder: '1500000' },
];

const formatMoney = (value: number) => new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
  maximumFractionDigits: 0,
}).format(Math.round(value));

const BusinessOpportunityInputForm = ({
  title,
  inputs,
  onChange,
}: {
  title: string;
  inputs: BusinessOpportunityInputs;
  onChange: (field: keyof BusinessOpportunityInputs, value: string) => void;
}) => (
  <div style={{ background: '#0f1020', border: '1px solid #26264a', borderRadius: '8px', padding: '0.85rem', marginTop: '0.65rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
      <div>
        <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: '0.88rem' }}>{title}</h4>
        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.78rem' }}>
          Annual assumptions for this trend only. Saved in this browser.
        </p>
      </div>
      <button
        type="button"
        onClick={() => businessInputFields.forEach((field) => onChange(field.key, '0'))}
        style={{ background: '#17182f', color: '#cbd5e1', border: '1px solid #34365f', borderRadius: '6px', cursor: 'pointer', padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
      >
        Clear
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
      {businessInputFields.map((field) => (
        <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.74rem', fontWeight: 700 }}>{field.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', background: '#15162c', border: '1px solid #2b2d55', borderRadius: '7px', overflow: 'hidden' }}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={inputs[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(event) => onChange(field.key, event.target.value)}
              aria-label={field.label}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: '#f8fafc', padding: '0.5rem 0.6rem', outline: 'none', fontSize: '0.82rem' }}
            />
            <span style={{ color: '#94a3b8', fontSize: '0.78rem', padding: '0 0.6rem' }}>{field.suffix || 'NZD'}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
);

const BusinessSizingSummary = ({
  estimate,
  inputs,
}: {
  estimate: ReturnType<typeof estimateTrendOpportunities>[number];
  inputs: BusinessOpportunityInputs;
}) => {
  const sizing = sizeBusinessOpportunity(estimate, inputs);
  return (
    <div style={{ marginTop: '0.55rem', borderTop: '1px solid #2a2a4a', paddingTop: '0.55rem', color: '#dbeafe' }}>
      <div style={{ fontWeight: 700 }}>{sizing.sizingSummary}</div>
      {sizing.totalOpportunity > 0 && (
        <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '0.25rem' }}>
          Addressable base {formatMoney(sizing.addressableRevenueBase)}; revenue upside {formatMoney(sizing.revenueUpside)}; cost/risk reduction {formatMoney(sizing.costRiskReduction)}.
        </div>
      )}
    </div>
  );
};

const TrendImpactPlanning = ({
  estimates,
  referencesByTrend,
}: {
  estimates: ReturnType<typeof estimateTrendOpportunities>;
  referencesByTrend: Record<string, EvidenceWithTraceability[]>;
}) => {
  const [yearCount, setYearCount] = useState(5);
  const [activeReference, setActiveReference] = useState<{ title: string; text: string; x: number; y: number } | null>(null);
  const [businessInputsByTrend, setBusinessInputsByTrend] = useState<Record<string, BusinessOpportunityInputs>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = window.localStorage.getItem('trendmap.businessOpportunityInputsByTrend');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!activeReference) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveReference(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeReference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('trendmap.businessOpportunityInputsByTrend', JSON.stringify(businessInputsByTrend));
  }, [businessInputsByTrend]);

  if (estimates.length === 0) return null;

  const showReference = (
    event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    title: string,
    text: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfDialogWidth = 304;
    const leftNavSafeEdge = 232;
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, leftNavSafeEdge + halfDialogWidth),
      window.innerWidth - halfDialogWidth - 16,
    );
    const y = Math.min(rect.bottom + 14, window.innerHeight - 220);
    setActiveReference({ title, text, x, y });
  };

  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearCount }, (_, index) => startYear + index);
  const trendColors = ['#38bdf8', '#f97316', '#a78bfa', '#22c55e', '#f43f5e', '#eab308', '#14b8a6', '#fb7185'];
  const bandColor: Record<string, string> = {
    Low: '#64748b',
    Medium: '#38bdf8',
    High: '#f59e0b',
    Transformational: '#ef4444',
  };

  const businessInputsForTrend = (trendId: string): BusinessOpportunityInputs => ({
    ...emptyBusinessOpportunityInputs(),
    ...(businessInputsByTrend[trendId] || {}),
  });

  const updateBusinessInput = (trendId: string, field: keyof BusinessOpportunityInputs, value: string) => {
    const numeric = Number(value);
    setBusinessInputsByTrend((current) => ({
      ...current,
      [trendId]: {
        ...emptyBusinessOpportunityInputs(),
        ...(current[trendId] || {}),
        [field]: Number.isFinite(numeric) ? numeric : 0,
      },
    }));
  };

  return (
    <section style={{ background: '#13132b', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e0e0ff', fontSize: '1.15rem' }}>Impact Timeline and Opportunity Matrix</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            Approved trends mapped by calendar year. Bubble size shows projected impact building toward the likely impact window.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', background: '#0f1020', border: '1px solid #26264a', borderRadius: '999px', padding: '0.25rem' }}>
            {[3, 5, 10].map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setYearCount(range)}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.35rem 0.65rem',
                  cursor: 'pointer',
                  background: yearCount === range ? '#5a5aff' : 'transparent',
                  color: yearCount === range ? '#fff' : '#aeb0d8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {range} years
              </button>
            ))}
          </div>
          <div style={{ color: '#fbbf24', fontSize: '0.78rem', maxWidth: '24rem', textAlign: 'right' }}>
            Directional estimate. Add revenue, margin, cost base, and market size inputs later for quantified dollar values.
          </div>
        </div>
      </div>

      {activeReference && typeof document !== 'undefined' && createPortal((
        <div
          role="dialog"
          aria-label={activeReference.title}
          style={{
            position: 'fixed',
            left: activeReference.x,
            top: activeReference.y,
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: '#0f1020',
            border: '1px solid #3a3a5a',
            borderRadius: '10px',
            boxShadow: '0 18px 60px rgba(0, 0, 0, 0.45)',
            color: '#e5e7eb',
            fontSize: '0.78rem',
            lineHeight: 1.45,
            maxHeight: '45vh',
            maxWidth: '38rem',
            minWidth: '24rem',
            overflowY: 'auto',
            padding: '0.9rem 1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{activeReference.title}</strong>
            <button
              type="button"
              aria-label="Close reference details"
              onClick={() => setActiveReference(null)}
              style={{ background: 'transparent', border: '1px solid #3a3a5a', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', lineHeight: 1, padding: '0.15rem 0.4rem' }}
            >
              x
            </button>
          </div>
          <ReferenceDetails text={activeReference.text} />
        </div>
      ), document.body)}

      <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
        <div
          role="table"
          aria-label="Trend impact by year"
          style={{
            minWidth: `${220 + years.length * 108}px`,
            display: 'grid',
            gridTemplateColumns: `220px repeat(${years.length}, minmax(96px, 1fr))`,
            border: '1px solid #26264a',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#0f1020',
          }}
        >
          <div style={matrixHeaderCell}>Trend</div>
          {years.map(year => (
            <div key={year} style={{ ...matrixHeaderCell, textAlign: 'center' }}>{year}</div>
          ))}
          {estimates.map((estimate, trendIndex) => {
          const color = trendColors[trendIndex % trendColors.length];
          const series = buildYearImpactSeries(estimate, startYear, yearCount);
          const referenceText = formatTrendReferences(referencesByTrend[estimate.trendId]);
          const trendTitle = `${estimate.trendName}\n${estimate.commercialInterpretation}\n\n${referenceText}`;
          return (
            <React.Fragment key={estimate.trendId}>
              <div
                tabIndex={0}
                onMouseEnter={(event) => showReference(event, estimate.trendName, trendTitle)}
                onFocus={(event) => showReference(event, estimate.trendName, trendTitle)}
                onClick={(event) => showReference(event, estimate.trendName, trendTitle)}
                style={{ ...matrixCell, justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column', gap: '0.35rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: '0.65rem', height: '0.65rem', borderRadius: '999px', background: color, flexShrink: 0 }} />
                  <span style={{ color: '#f3f4f6', fontSize: '0.82rem', fontWeight: 700 }}>{estimate.trendName}</span>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                  {estimate.workbackLabel}; impact {estimate.impactLabel}
                </span>
              </div>
              {series.map(point => {
                const diameter = 18 + point.projectedImpactScore * 34;
                const markerDiameter = diameter + 12;
                return (
                  <div key={`${estimate.trendId}-${point.year}`} style={{ ...matrixCell, position: 'relative' }}>
                    {point.isImpactYear && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          width: `${markerDiameter}px`,
                          height: `${markerDiameter}px`,
                          borderRadius: '999px',
                          border: `2px solid ${color}`,
                          opacity: 0.35,
                        }}
                      />
                    )}
                    <span
                      data-testid={`trend-impact-bubble-${estimate.trendId}-${point.year}`}
                      aria-label={`${estimate.trendName} projected impact ${Math.round(point.projectedImpactScore * 100)} in ${point.year}. ${referenceText}`}
                      tabIndex={0}
                      onMouseEnter={(event) => showReference(
                        event,
                        `${estimate.trendName} - ${point.year}`,
                        `${estimate.trendName}: ${Math.round(point.projectedImpactScore * 100)} projected impact in ${point.year}.\n${estimate.commercialInterpretation}\n\n${referenceText}`,
                      )}
                      onFocus={(event) => showReference(
                        event,
                        `${estimate.trendName} - ${point.year}`,
                        `${estimate.trendName}: ${Math.round(point.projectedImpactScore * 100)} projected impact in ${point.year}.\n${estimate.commercialInterpretation}\n\n${referenceText}`,
                      )}
                      onClick={(event) => showReference(
                        event,
                        `${estimate.trendName} - ${point.year}`,
                        `${estimate.trendName}: ${Math.round(point.projectedImpactScore * 100)} projected impact in ${point.year}.\n${estimate.commercialInterpretation}\n\n${referenceText}`,
                      )}
                      style={{
                        width: `${diameter}px`,
                        height: `${diameter}px`,
                        borderRadius: '999px',
                        background: color,
                        border: 'none',
                        display: 'inline-block',
                      }}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ color: '#9ca3af', fontSize: '0.75rem', textAlign: 'left', borderBottom: '1px solid #2a2a4a' }}>
              <th style={{ padding: '0.6rem' }}>Trend</th>
              <th style={{ padding: '0.6rem' }}>Impact Window</th>
              <th style={{ padding: '0.6rem' }}>Roadmap Start</th>
              <th style={{ padding: '0.6rem' }}>Opportunity</th>
              <th style={{ padding: '0.6rem' }}>Market / Revenue / Cost Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map(estimate => {
              const trendInputs = businessInputsForTrend(estimate.trendId);
              return (
              <tr key={estimate.trendId} style={{ borderBottom: '1px solid #20203a', color: '#d1d5db', fontSize: '0.82rem' }}>
                <td style={{ padding: '0.7rem', fontWeight: 600, color: '#f3f4f6' }}>{estimate.trendName}</td>
                <td style={{ padding: '0.7rem' }}>{estimate.impactLabel}</td>
                <td style={{ padding: '0.7rem' }}>{estimate.workbackLabel}</td>
                <td style={{ padding: '0.7rem' }}>
                  <span style={{ color: bandColor[estimate.opportunityBand], fontWeight: 700 }}>{estimate.opportunityBand}</span>
                  <span style={{ color: '#9ca3af' }}> ({Math.round(estimate.opportunityScore * 100)})</span>
                </td>
                <td style={{ padding: '0.7rem', lineHeight: 1.5 }}>
                  <div>{estimate.marketSizeProxy}</div>
                  <div>{estimate.revenuePotential}</div>
                  <div>{estimate.costReductionPotential}</div>
                  <BusinessSizingSummary estimate={estimate} inputs={trendInputs} />
                  <details style={{ marginTop: '0.6rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#aeb0ff', fontWeight: 700 }}>Size this trend</summary>
                    <BusinessOpportunityInputForm
                      title={`Business inputs for ${estimate.trendName}`}
                      inputs={trendInputs}
                      onChange={(field, value) => updateBusinessInput(estimate.trendId, field, value)}
                    />
                  </details>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const matrixHeaderCell = {
  padding: '0.65rem',
  borderBottom: '1px solid #26264a',
  borderRight: '1px solid #20203a',
  color: '#9ca3af',
  fontSize: '0.76rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const matrixCell = {
  minHeight: '5.3rem',
  padding: '0.75rem',
  borderBottom: '1px solid #20203a',
  borderRight: '1px solid #20203a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const TrendSection = ({
  title,
  emptyText,
  trends,
  evidenceMap,
  onApprove,
  onReject,
  onSelect,
  onCreateStrategicOption,
  canApprove,
}: {
  title: string;
  emptyText: string;
  trends: Trend[];
  evidenceMap: Record<string, number>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelect: (trend: Trend) => void;
  onCreateStrategicOption: (trend: Trend) => void;
  canApprove: boolean;
}) => (
  <section>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
      <h3 style={{ margin: 0, color: '#e0e0ff', fontSize: '1.15rem' }}>{title}</h3>
      <span style={{ color: '#888', fontSize: '0.85rem' }}>{trends.length}</span>
    </div>
    {trends.length === 0 ? (
      <p style={{ color: '#888', margin: 0 }}>{emptyText}</p>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {trends.map((t) => (
          <TrendCard
            key={t.id}
            trend={t}
            evidenceCount={evidenceMap[t.id] ?? 0}
            onApprove={onApprove}
            onReject={onReject}
            onSelect={onSelect}
            onCreateStrategicOption={onCreateStrategicOption}
            canApprove={canApprove}
          />
        ))}
      </div>
    )}
  </section>
);

const TrendCard = ({
  trend,
  evidenceCount,
  onApprove,
  onReject,
  onSelect,
  onCreateStrategicOption,
  canApprove,
}: {
  trend: Trend;
  evidenceCount: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelect: (trend: Trend) => void;
  onCreateStrategicOption: (trend: Trend) => void;
  canApprove: boolean;
}) => {
  const isApproved = trend.status === 'approved';

  return (
    <div 
      data-testid="trend-card" 
      tabIndex={0} 
      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { onSelect(trend); } }} 
      style={{ background: '#1a1a2e', borderRadius: '8px', border: isApproved ? '1px solid #2f6b45' : '1px solid #2a2a4a', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', justifyContent: 'space-between' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#e0e0ff' }}>{trend.name}</h3>
          {isApproved && (
            <span style={{ flexShrink: 0, background: '#163923', color: '#9ff3b0', border: '1px solid #2f6b45', borderRadius: '999px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>
              Approved
            </span>
          )}
        </div>
        <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{trend.summary}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
        <span>Impact: {(trend.impactScore * 100).toFixed(0)}%</span>
        <span>Horizon: {trend.horizon}</span>
        <span>Evidence: {evidenceCount}</span>
        <span className="status-text" aria-label="trend-status">Status: {trend.status}</span>
      </div>
      
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
        {isApproved ? (
          <>
            <span style={{ flex: 1, padding: '0.5rem', background: '#163923', color: '#9ff3b0', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
              Approved
            </span>
            <button type="button" onClick={() => onCreateStrategicOption(trend)} style={btnStyle('#3b2f71', '#f4f3ff')}>
              Create Strategic Option
            </button>
          </>
        ) : (
          <button 
            type="button" 
            data-testid={"trend-approve-" + trend.id} 
            aria-label="Approve" 
            onClick={() => onApprove(trend.id)} 
            disabled={!evidenceCount || !canApprove}
            title={!canApprove ? approvalRestrictionMessage('trend') : !evidenceCount ? 'Trend needs linked evidence before approval.' : 'Approve trend'}
            style={btnStyle(
              !evidenceCount || !canApprove ? '#2a2a2a' : '#2a4a2a', 
              !evidenceCount || !canApprove ? '#555' : '#a0ffa0',
              !evidenceCount || !canApprove
            )}
          >
            Approve
          </button>
        )}
        <button
          type="button"
          data-testid={"trend-reject-" + trend.id}
          aria-label="Reject"
          onClick={() => onReject(trend.id)}
          disabled={!canApprove}
          title={!canApprove ? approvalRestrictionMessage('trend') : 'Reject trend'}
          style={btnStyle(!canApprove ? '#2a2a2a' : '#4a2a2a', !canApprove ? '#555' : '#ffa0a0', !canApprove)}
        >
          Reject
        </button>
        <button type="button" data-testid={"trend-detail-" + trend.id} aria-label="Details" onClick={() => onSelect(trend)} style={btnStyle('#2a2a4a', '#a0a0ff')}>
          Details
        </button>
      </div>
    </div>
  );
};

const StrategicList = ({ title, items }: { title: string, items: string[] }) => (
  <div>
    <h5 style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{title}</h5>
    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#aaa', fontSize: '0.9rem' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
    </ul>
  </div>
);

const btnStyle = (bg: string, color: string, disabled: boolean = false) => ({
  flex: 1,
  padding: '0.5rem',
  background: bg,
  color: color,
  border: 'none',
  borderRadius: '4px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.85rem'
});

export default TrendReviewBoard;
