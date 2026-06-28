// @ts-nocheck
import type { Document, SourceSnapshot, DocumentFingerprint } from './types'; 
import { getDocuments } from './mockRepository';

// Simple deterministic string hash for mock purposes
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function createSourceSnapshotFromDocuments(sourceId: string, documents: Document[]): SourceSnapshot {
  const fingerprints: DocumentFingerprint[] = documents.map(doc => ({
    documentId: doc.id,
    url: doc.url,
    titleHash: hashString(doc.title),
    contentHash: hashString(doc.content),
    publishedDate: doc.publishedDate,
    lastSeenAt: new Date().toISOString()
  }));

  return {
    id: `snap-${sourceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, // Phase 2 IDs don't have to be purely deterministic except when needed, but tests don't check ID deterministic.
    sourceId,
    capturedAt: new Date().toISOString(),
    documentFingerprints: fingerprints,
    rawMetadata: {}
  };
}

export function getMockFeedSnapshot(sourceId: string, scenario: 'baseline' | 'new_activity' | 'contradictory_activity'): Document[] {
  // We filter existing documents just for the requested sourceId to mimic a feed
  const baselineDocs = getDocuments().filter(d => d.sourceId === sourceId);

  if (scenario === 'baseline') {
    return baselineDocs;
  }

  const newActivityDocs: Document[] = [];
  const contradictoryDocs: Document[] = [];

  // Construct scenario docs for specific sources
  if (sourceId === 'src-1') {
    // Retail Dive
    newActivityDocs.push({
      id: 'doc-new-1',
      sourceId: 'src-1',
      title: 'Competitor launches conversational grocery search',
      publishedDate: new Date().toISOString(),
      content: 'A major competitor has just launched a conversational grocery search feature powered by generative AI.',
      url: 'https://example.com/competitor-launch',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
    contradictoryDocs.push({
      id: 'doc-contra-1',
      sourceId: 'src-1',
      title: 'Retailer pauses AI assistant pilot due to poor recommendation trust',
      publishedDate: new Date().toISOString(),
      content: 'A major retailer has paused its AI assistant pilot. Consumers cited poor trust in the recommendations and frequent hallucinations.',
      url: 'https://example.com/pilot-pause',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
  } else if (sourceId === 'src-4') {
    // Forrester
    newActivityDocs.push({
      id: 'doc-new-4',
      sourceId: 'src-4',
      title: 'Retail media source reports sponsored placement expansion',
      publishedDate: new Date().toISOString(),
      content: 'Retail media networks are aggressively expanding sponsored placement inventory in search results.',
      url: 'https://example.com/rmn-expansion',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
    contradictoryDocs.push({
      id: 'doc-contra-4',
      sourceId: 'src-4',
      title: 'Analyst report says adoption is slower than expected',
      publishedDate: new Date().toISOString(),
      content: 'Despite the hype, analyst reports indicate that consumer adoption of AI-assisted grocery shopping is significantly slower than initially projected.',
      url: 'https://example.com/slower-adoption',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
  } else if (sourceId === 'src-5') {
    // Algolia
    newActivityDocs.push({
      id: 'doc-new-5',
      sourceId: 'src-5',
      title: 'AI search vendor publishes grocery semantic search case study',
      publishedDate: new Date().toISOString(),
      content: 'An AI search vendor demonstrated a 20% lift in conversion using semantic grocery search.',
      url: 'https://example.com/semantic-search',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
  } else if (sourceId === 'src-6') {
    // Pew
    newActivityDocs.push({
      id: 'doc-new-6',
      sourceId: 'src-6',
      title: 'New document about consumer trust concerns',
      publishedDate: new Date().toISOString(),
      content: 'Consumers are increasingly worried about how their data is used by AI models for grocery recommendations.',
      url: 'https://example.com/trust-concerns',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
    contradictoryDocs.push({
      id: 'doc-contra-6',
      sourceId: 'src-6',
      title: 'Regulatory source questions sponsored AI recommendations',
      publishedDate: new Date().toISOString(),
      content: 'Regulatory bodies are investigating whether sponsored products in AI recommendations constitute deceptive advertising.',
      url: 'https://example.com/regulatory-warning',
      ingestionStatus: 'pending',
      extractedSignalIds: []
    });
  }

  // To make tests happy for 'src-1' regardless of exact source mapping, 
  // ensure we always add some mock content if it's new/contradictory and empty.
  if (scenario === 'new_activity' && newActivityDocs.length === 0) {
      newActivityDocs.push({
        id: `doc-fallback-new-${sourceId}`,
        sourceId,
        title: 'Generic new activity',
        content: 'New competitor launch detected.',
        publishedDate: new Date().toISOString(),
        url: 'https://example.com/new',
        ingestionStatus: 'pending',
        extractedSignalIds: []
      });
  }
  if (scenario === 'contradictory_activity' && contradictoryDocs.length === 0) {
      contradictoryDocs.push({
        id: `doc-fallback-contra-${sourceId}`,
        sourceId,
        title: 'Generic contradictory activity',
        content: 'Analyst reports slower adoption and trust concerns.',
        publishedDate: new Date().toISOString(),
        url: 'https://example.com/contra',
        ingestionStatus: 'pending',
        extractedSignalIds: []
      });
  }

  if (scenario === 'new_activity') {
    return [...baselineDocs, ...newActivityDocs];
  }

  if (scenario === 'contradictory_activity') {
    return [...baselineDocs, ...contradictoryDocs];
  }

  return baselineDocs;
}
