import { generateEvidenceLinks } from './evidenceLinking';
import type { Trend, Signal, Document, Source } from './types';

// Helpers to create mock entities
function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'src-1',
    name: 'Approved Source',
    url: 'http://example.com',
    sourceType: 'news',
    credibilityScore: 0.9,
    relevanceScore: 0.9,
    freshnessScore: 0.9,
    status: 'approved',
    notes: '',
    ...overrides,
  };
}

function makeRejectedSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'src-2',
    name: 'Rejected Source',
    url: 'http://example.com',
    sourceType: 'news',
    credibilityScore: 0.5,
    relevanceScore: 0.5,
    freshnessScore: 0.5,
    status: 'rejected',
    notes: '',
    ...overrides,
  };
}

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    sourceId: 'src-1',
    title: 'Document One',
    publishedDate: '2026-01-01',
    content: 'This is the full content of the document used for evidence extraction.',
    url: 'http://example.com/doc1',
    ingestionStatus: 'pending',
    extractedSignalIds: [],
    ...overrides,
  };
}

function makeRejectedDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-2',
    sourceId: 'src-2',
    title: 'Rejected Document',
    publishedDate: '2026-01-02',
    content: 'Content from a rejected source should be ignored.',
    url: 'http://example.com/doc2',
    ingestionStatus: 'pending',
    extractedSignalIds: [],
    ...overrides,
  };
}

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 'sig-1',
    documentId: 'doc-1',
    sourceId: 'src-1',
    title: 'AI-assisted shopping',
    summary: 'Detected AI activity.',
    signalType: 'AI-assisted shopping',
    pestleCategory: 'Technology',
    noveltyScore: 0.9,
    strengthScore: 0.9,
    confidenceScore: 0.9,
    evidenceDate: '2026-01-01',
    tags: [],
    ...overrides,
  };
}

function makeRejectedSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 'sig-2',
    documentId: 'doc-2',
    sourceId: 'src-2',
    title: 'Retail media influence',
    summary: 'Detected retail media.',
    signalType: 'Retail media influence',
    pestleCategory: 'Economic',
    noveltyScore: 0.8,
    strengthScore: 0.7,
    confidenceScore: 0.8,
    evidenceDate: '2026-01-02',
    tags: [],
    ...overrides,
  };
}

function makeTrend(overrides: Partial<Trend> = {}): Trend {
  return {
    id: 'trend-1',
    name: 'AI-assisted grocery discovery',
    summary: 'Aggregated AI trend.',
    status: 'candidate',
    horizon: '6-12 months',
    likelihoodScore: 0.9,
    confidenceScore: 0.9,
    impactScore: 0.8,
    maturityStage: 'emerging',
    relatedSignalIds: ['sig-1'],
    drivers: [],
    blockers: [],
    whatNeedsToBeTrue: [],
    leadingIndicators: [],
    monitoringQuestions: [],
    recommendedActions: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('generateEvidenceLinks service', () => {
  test('each trend gets at least one evidence link', () => {
    const sources = [makeSource()];
    const documents = [makeDocument()];
    const signals = [makeSignal()];
    const trends = [makeTrend()];
    const evidence = generateEvidenceLinks(trends, signals, documents, sources);
    expect(evidence.length).toBeGreaterThanOrEqual(1);
    const link = evidence[0];
    expect(link.trendId).toBe(trends[0].id);
    expect(link.signalId).toBe(signals[0].id);
    expect(link.documentId).toBe(documents[0].id);
    expect(link.sourceId).toBe(sources[0].id);
    expect(link.quote).toBeDefined();
    expect(link.relevanceReason).toContain(trends[0].name);
  });

  test('evidence links reference valid ids and exclude rejected sources', () => {
    const sources = [makeSource(), makeRejectedSource()];
    const documents = [makeDocument(), makeRejectedDocument()];
    const signals = [makeSignal(), makeRejectedSignal()];
    const trends = [
      { ...makeTrend(), relatedSignalIds: ['sig-1', 'sig-2'] },
    ];
    const evidence = generateEvidenceLinks(trends, signals, documents, sources);
    // Should only contain link for approved source (sig-1)
    expect(evidence).toHaveLength(1);
    const link = evidence[0];
    expect(link.sourceId).toBe('src-1');
    expect(link.trendId).toBe('trend-1');
    expect(link.signalId).toBe('sig-1');
  });

  test('invalid references are not created', () => {
    const sources = [makeSource()];
    const documents = [makeDocument()];
    const signals = [
      // Signal refers to a non‑existent document
      makeSignal({ id: 'sig-3', documentId: 'nonexistent' }),
    ];
    const trends = [
      { ...makeTrend(), relatedSignalIds: ['sig-3'] },
    ];
    const evidence = generateEvidenceLinks(trends, signals, documents, sources);
    expect(evidence).toHaveLength(0);
  });
});
