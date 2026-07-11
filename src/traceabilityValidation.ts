// @ts-nocheck
import { repository } from './repository';
import type { Trend, Signal, Document, Source, EvidenceLink } from './types';

export interface TraceabilityReportItem {
  type: 'trend' | 'signal' | 'document' | 'evidence';
  id: string;
  message: string;
}

/**
 * Walks the repository and returns an array of any broken links.
 * Returns an empty array when the traceability chain is healthy.
 */
export const validateTraceability = async (): Promise<TraceabilityReportItem[]> => {
  const report: TraceabilityReportItem[] = [];

  const trends = await repository.getTrends();
  const signals = await repository.getSignals();
  const documents = await repository.getDocuments();
  const sources = await repository.getSources();
  // Gather all evidences
  const evidences: EvidenceLink[] = [];
  await Promise.all(trends.map(async (t) => {
    const trendEvidences = await repository.getEvidenceForTrend(t.id);
    evidences.push(...trendEvidences);
  }));

  const signalMap = new Map<string, Signal>(signals.map((s) => [s.id, s]));
  const docMap = new Map<string, Document>(documents.map((d) => [d.id, d]));
  const sourceMap = new Map<string, Source>(sources.map((src) => [src.id, src]));
  const trendMap = new Map<string, Trend>(trends.map((t) => [t.id, t]));

  // Trend → Signal validation
  trends.forEach((t) => {
    (t.relatedSignalIds ?? []).forEach((sid) => {
      if (!signalMap.has(sid)) {
        report.push({ type: 'trend', id: t.id, message: `relatedSignalId ${sid} not found` });
      }
    });
  });

  // Signal → Document validation
  signals.forEach((s) => {
    if (!docMap.has(s.documentId)) {
      report.push({ type: 'signal', id: s.id, message: `documentId ${s.documentId} not found` });
    }
    if (!sourceMap.has(s.sourceId)) {
      report.push({ type: 'signal', id: s.id, message: `sourceId ${s.sourceId} not found` });
    }
  });

  // Document → Source validation
  documents.forEach((d) => {
    if (!sourceMap.has(d.sourceId)) {
      report.push({ type: 'document', id: d.id, message: `sourceId ${d.sourceId} not found` });
    }
  });

  // Evidence links validation
  evidences.forEach((e) => {
    if (!trendMap.has(e.trendId)) {
      report.push({ type: 'evidence', id: e.id, message: `trendId ${e.trendId} not found` });
    }
    if (!signalMap.has(e.signalId)) {
      report.push({ type: 'evidence', id: e.id, message: `signalId ${e.signalId} not found` });
    }
    if (!docMap.has(e.documentId)) {
      report.push({ type: 'evidence', id: e.id, message: `documentId ${e.documentId} not found` });
    }
    const src = sourceMap.get(e.sourceId);
    if (src && src.status === 'rejected') {
      report.push({ type: 'evidence', id: e.id, message: `evidence from rejected source ${src.id}` });
    }
  });

  // Approved trend must have at least one evidence item
  trends.filter((t) => t.status === 'approved').forEach((t) => {
    const hasEvidence = evidences.some((e) => e.trendId === t.id);
    if (!hasEvidence) {
      report.push({ type: 'trend', id: t.id, message: 'no evidence links for approved trend' });
    }
  });

  return report;
};
