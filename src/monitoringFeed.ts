// @local-only - This file generates mock monitoring feeds and should only be used locally.
// @ts-nocheck
// @local-only - This file generates mock monitoring feeds and should only be used locally.
import type { Document, SourceSnapshot, DocumentFingerprint } from './types'; 
// @local-only - This file generates mock monitoring feeds and should only be used locally.
import { getDocuments } from './mockRepository';
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
// Simple deterministic string hash for mock purposes
// @local-only - This file generates mock monitoring feeds and should only be used locally.
function hashString(str: string): string {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  let hash = 5381;
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  for (let i = 0; i < str.length; i++) {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    hash = (hash * 33) ^ str.charCodeAt(i);
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  return (hash >>> 0).toString(16);
// @local-only - This file generates mock monitoring feeds and should only be used locally.
}
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
export function createSourceSnapshotFromDocuments(sourceId: string, documents: Document[]): SourceSnapshot {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  const fingerprints: DocumentFingerprint[] = documents.map(doc => ({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    documentId: doc.id,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    url: doc.url,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    titleHash: hashString(doc.title),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    contentHash: hashString(doc.content),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    publishedDate: doc.publishedDate,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    lastSeenAt: new Date().toISOString()
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }));
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  return {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    id: `snap-${sourceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, // Phase 2 IDs don't have to be purely deterministic except when needed, but tests don't check ID deterministic.
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    sourceId,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    capturedAt: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    documentFingerprints: fingerprints,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    rawMetadata: {}
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  };
// @local-only - This file generates mock monitoring feeds and should only be used locally.
}
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
export function getMockFeedSnapshot(sourceId: string, scenario: 'baseline' | 'new_activity' | 'contradictory_activity'): Document[] {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  // We filter existing documents just for the requested sourceId to mimic a feed
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  const storedBaselineDocs = getDocuments().filter(d => d.sourceId === sourceId);
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  const baselineDocs = storedBaselineDocs.length > 0 ? storedBaselineDocs : [{
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    id: `feed-baseline-${sourceId}`,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    sourceId,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    title: 'AI assistant launch in grocery search',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    content: 'Retailers are testing AI assistant and conversational search capabilities for grocery discovery, product substitution, and zero-result reduction.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    url: 'https://example.com/baseline-ai-assistant',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }];
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (scenario === 'baseline') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    return baselineDocs;
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  const newActivityDocs: Document[] = [];
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  const contradictoryDocs: Document[] = [];
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  // Construct scenario docs for specific sources
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (sourceId === 'src-1') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    // Retail Dive
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    newActivityDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-new-1',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-1',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'Competitor launches conversational grocery search',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'A major competitor has just launched a conversational grocery search feature powered by generative AI.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/competitor-launch',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    contradictoryDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-contra-1',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-1',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'Retailer pauses AI assistant pilot due to poor recommendation trust',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'A major retailer has paused its AI assistant pilot. Consumers cited poor trust in the recommendations and frequent hallucinations.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/pilot-pause',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  } else if (sourceId === 'src-4') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    // Forrester
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    newActivityDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-new-4',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-4',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'Retail media source reports sponsored placement expansion',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'Retail media networks are aggressively expanding sponsored placement inventory in search results.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/rmn-expansion',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    contradictoryDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-contra-4',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-4',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'Analyst report says adoption is slower than expected',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'Despite the hype, analyst reports indicate that consumer adoption of AI-assisted grocery shopping is significantly slower than initially projected.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/slower-adoption',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  } else if (sourceId === 'src-5') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    // Algolia
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    newActivityDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-new-5',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-5',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'AI search vendor publishes grocery semantic search case study',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'An AI search vendor demonstrated a 20% lift in conversion using semantic grocery search.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/semantic-search',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  } else if (sourceId === 'src-6') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    // Pew
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    newActivityDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-new-6',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-6',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'New document about consumer trust concerns',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'Consumers are increasingly worried about how their data is used by AI models for grocery recommendations.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/trust-concerns',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    contradictoryDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      id: 'doc-contra-6',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      sourceId: 'src-6',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      title: 'Regulatory source questions sponsored AI recommendations',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      content: 'Regulatory bodies are investigating whether sponsored products in AI recommendations constitute deceptive advertising.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      url: 'https://example.com/regulatory-warning',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  // To make tests happy for 'src-1' regardless of exact source mapping, 
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  // ensure we always add some mock content if it's new/contradictory and empty.
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (scenario === 'new_activity' && newActivityDocs.length === 0) {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      newActivityDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        id: `doc-fallback-new-${sourceId}`,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        sourceId,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        title: 'Generic new activity',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        content: 'New competitor launch detected.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        url: 'https://example.com/new',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (scenario === 'contradictory_activity' && contradictoryDocs.length === 0) {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      contradictoryDocs.push({
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        id: `doc-fallback-contra-${sourceId}`,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        sourceId,
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        title: 'Generic contradictory activity',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        content: 'Analyst reports slower adoption and trust concerns.',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        publishedDate: new Date().toISOString(),
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        url: 'https://example.com/contra',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        ingestionStatus: 'pending',
// @local-only - This file generates mock monitoring feeds and should only be used locally.
        extractedSignalIds: []
// @local-only - This file generates mock monitoring feeds and should only be used locally.
      });
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (scenario === 'new_activity') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    return [...baselineDocs, ...newActivityDocs];
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  if (scenario === 'contradictory_activity') {
// @local-only - This file generates mock monitoring feeds and should only be used locally.
    return [...baselineDocs, ...contradictoryDocs];
// @local-only - This file generates mock monitoring feeds and should only be used locally.
  }
// @local-only - This file generates mock monitoring feeds and should only be used locally.

// @local-only - This file generates mock monitoring feeds and should only be used locally.
  return baselineDocs;
// @local-only - This file generates mock monitoring feeds and should only be used locally.
}
// @local-only - This file generates mock monitoring feeds and should only be used locally.
