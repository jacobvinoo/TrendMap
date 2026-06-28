// @ts-nocheck
import type { Trend, Signal, Document, Source, EvidenceLink } from './types';

/**
 * Generate deterministic evidence links linking trends to signals, documents and sources.
 * Only includes links where the source status is 'approved'.
 */
export function generateEvidenceLinks(
  trends: Trend[],
  signals: Signal[],
  documents: Document[],
  sources: Source[],
  allowRejectedSource: boolean = false,
): EvidenceLink[] {
  const sourceMap = new Map<string, Source>(sources.map((s) => [s.id, s]));
  const docMap = new Map<string, Document>(documents.map((d) => [d.id, d]));
  const signalMap = new Map<string, Signal>(signals.map((s) => [s.id, s]));

  const evidence: EvidenceLink[] = [];
  const seen = new Set<string>(); // key = `${trendId}|${signalId}|${documentId}|${sourceId}`

  for (const trend of trends) {
    for (const signalId of trend.relatedSignalIds) {
      const signal = signalMap.get(signalId);
      if (!signal) continue;
      const doc = docMap.get(signal.documentId);
      const src = sourceMap.get(signal.sourceId);
      if (!doc || !src) continue;
      if (src.status !== 'approved' && !allowRejectedSource) continue;

      const key = `${trend.id}|${signal.id}|${doc.id}|${src.id}`;
      if (seen.has(key)) continue; // skip duplicate linking
      seen.add(key);

      const quote = doc.content.slice(0, 120).trim();
      const relevanceReason = `Signal "${signal.title}" supports trend "${trend.name}"`;

      const evidenceLink: EvidenceLink = {
        id: `evidence-${trend.id}-${signal.id}`,
        trendId: trend.id,
        signalId: signal.id,
        documentId: doc.id,
        sourceId: src.id,
        quote,
        relevanceReason,
      };
      evidence.push(evidenceLink);
    }
    // Ensure at least one evidence per trend – if none added, fallback to first valid signal if any
    if (!evidence.some((e) => e.trendId === trend.id)) {
      const validSignalId = trend.relatedSignalIds.find((sid) => {
        const s = signalMap.get(sid);
        if (!s) return false;
        const src = sourceMap.get(s.sourceId);
        return src && (src.status === 'approved' || allowRejectedSource);
      });
      if (validSignalId) {
        const signal = signalMap.get(validSignalId)!;
        const doc = docMap.get(signal.documentId);
        const src = sourceMap.get(signal.sourceId);
        if (!doc || !src) continue;
        if (src.status !== 'approved' && !allowRejectedSource) continue;
        const key = `${trend.id}|${signal.id}|${doc.id}|${src.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const quote = doc.content.slice(0, 120).trim();
        const relevanceReason = `Signal "${signal.title}" supports trend "${trend.name}"`;
        evidence.push({
          id: `evidence-${trend.id}-${signal.id}`,
          trendId: trend.id,
          signalId: signal.id,
          documentId: doc.id,
          sourceId: src.id,
          quote,
          relevanceReason,
        });
        continue;
      }
    }
  }

  return evidence;
}
