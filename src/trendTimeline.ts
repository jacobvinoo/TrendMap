import type {
  AuditEvent,
  Document,
  EvidenceLink,
  Source,
  Trend,
  TrendScoreChange,
  TrendScoreSnapshot,
  TrendTimelineEntry,
  TrendTimelineSummary,
} from './types';

interface BuildTrendTimelineInput {
  trend: Trend;
  evidence: EvidenceLink[];
  documents: Document[];
  sources: Source[];
  snapshots: TrendScoreSnapshot[];
  changes: TrendScoreChange[];
  auditEvents: AuditEvent[];
}

function entityId(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') return value.id ? String(value.id) : undefined;
  return String(value);
}

function evidenceDocumentId(evidence: any): string | undefined {
  return evidence.documentId ?? evidence.document_id ?? entityId(evidence.document);
}

function evidenceSourceId(evidence: any): string | undefined {
  return evidence.sourceId ?? evidence.source_id ?? entityId(evidence.source);
}

function firstDate(...values: Array<unknown>): string {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.length > 0);
  return value ? String(value) : new Date(0).toISOString();
}

function percent(value?: number): number | undefined {
  return typeof value === 'number' ? Math.round(value * 100) : undefined;
}

function movement(delta?: number): 'up' | 'down' | 'flat' {
  if ((delta ?? 0) > 0.005) return 'up';
  if ((delta ?? 0) < -0.005) return 'down';
  return 'flat';
}

function movementText(change: TrendScoreChange, previous?: TrendScoreSnapshot, current?: TrendScoreSnapshot): string {
  const direction = movement(change.impactDelta);
  const currentImpact = percent(current?.impactScore ?? change.newImpactScore);
  const previousImpact = percent(previous?.impactScore);
  const reason = change.primaryReason || change.reason || 'No reason recorded.';
  if (direction === 'flat') return `Impact stayed at ${currentImpact ?? 'unknown'}%. ${reason}`;
  return `Impact moved ${direction === 'up' ? 'up' : 'down'} from ${previousImpact ?? 'unknown'}% to ${currentImpact ?? 'unknown'}%. ${reason}`;
}

function auditTimestamp(event: AuditEvent): string {
  return event.timestamp || event.createdAt || event.created_at || new Date(0).toISOString();
}

function auditEntityType(event: AuditEvent): string {
  return event.entityType || event.entity_type;
}

function auditEntityId(event: AuditEvent): string {
  return event.entityId || event.entity_id;
}

function auditUserId(event: AuditEvent): string {
  return event.userId || event.user_id || 'unknown user';
}

function titleForAction(action: string): string {
  if (action.includes('approved')) return 'Trend approved';
  if (action.includes('rejected')) return 'Trend rejected';
  if (action.includes('status')) return 'Trend status changed';
  return action.split('.').map((part) => part.replace(/_/g, ' ')).join(' / ');
}

export function buildTrendTimeline(input: BuildTrendTimelineInput): TrendTimelineSummary {
  const snapshotsById = new Map(input.snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const entries: TrendTimelineEntry[] = [];

  for (const change of input.changes) {
    const previous = snapshotsById.get(change.previousSnapshotId);
    const current = snapshotsById.get(change.currentSnapshotId);
    entries.push({
      id: `change-${change.id}`,
      type: 'score_change',
      date: firstDate(change.changedAt, change.appliedAt),
      title: movement(change.impactDelta) === 'flat' ? 'Importance unchanged' : `Importance ${movement(change.impactDelta) === 'up' ? 'increased' : 'decreased'}`,
      summary: movementText(change, previous, current),
      impactScore: current?.impactScore ?? change.newImpactScore,
      confidenceScore: current?.confidenceScore ?? change.newConfidenceScore,
      movement: movement(change.impactDelta),
      snippet: change.relatedSignalIds?.length ? `Related signals: ${change.relatedSignalIds.join(', ')}` : undefined,
    });
  }

  for (const snapshot of input.snapshots) {
    entries.push({
      id: `snapshot-${snapshot.id}`,
      type: 'score_snapshot',
      date: firstDate(snapshot.capturedAt),
      title: 'Score snapshot captured',
      summary: snapshot.reason || `${snapshot.evidenceCount} evidence links and ${snapshot.signalCount} signals were included.`,
      impactScore: snapshot.impactScore,
      confidenceScore: snapshot.confidenceScore,
    });
  }

  for (const ev of input.evidence) {
    const doc = input.documents.find((document) => document.id === evidenceDocumentId(ev));
    const source = input.sources.find((item) => item.id === evidenceSourceId(ev));
    entries.push({
      id: `evidence-${ev.id}`,
      type: 'evidence',
      date: firstDate(doc?.publishedDate, (source as any)?.retrievedAt, (source as any)?.retrieved_at, (doc as any)?.createdAt, (doc as any)?.created_at),
      title: source?.name ? `Evidence from ${source.name}` : 'Evidence added',
      summary: ev.relevanceReason || 'Evidence was linked to this trend.',
      sourceName: source?.name || 'Unknown source',
      documentTitle: doc?.title || 'Unknown document',
      snippet: ev.quote || doc?.content?.slice(0, 260),
    });
  }

  for (const event of input.auditEvents.filter((item) => auditEntityType(item) === 'trend' && auditEntityId(item) === input.trend.id)) {
    entries.push({
      id: `decision-${event.id}`,
      type: 'decision',
      date: firstDate(auditTimestamp(event)),
      title: titleForAction(event.action),
      summary: `Decision recorded by ${auditUserId(event)}.`,
    });
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestSnapshot = [...input.snapshots].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())[0];
  const sourceIds = new Set(input.evidence.map(evidenceSourceId).filter(Boolean));

  return {
    trend: input.trend,
    entries,
    latestImpactScore: latestSnapshot?.impactScore ?? input.trend.impactScore,
    latestConfidenceScore: latestSnapshot?.confidenceScore ?? input.trend.confidenceScore,
    evidenceCount: input.evidence.length,
    sourceCount: sourceIds.size,
  };
}
