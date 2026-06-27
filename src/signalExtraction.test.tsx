import { extractSignalsFromDocument } from './signalExtraction';
import type { Document } from './types';

// Helper to create a document with given content and optional sourceId
function makeDoc(id: string, sourceId: string, content: string, title = 'Test Doc'): Document {
  return {
    id,
    sourceId,
    title,
    publishedDate: '2026-01-01',
    content,
    url: 'http://example.com',
    ingestionStatus: 'pending',
    extractedSignalIds: [],
  };
}

describe('extractSignalsFromDocument deterministic service', () => {
  test('AI assistant document creates AI‑assisted shopping signal', () => {
    const doc = makeDoc('doc-1', 'src-1', 'The AI assistant helps with conversational shopping and chat features.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    const sig = signals[0];
    expect(sig.signalType).toBe('AI-assisted shopping');
    expect(sig.pestleCategory).toBe('Technology');
    expect(sig.documentId).toBe(doc.id);
    expect(sig.sourceId).toBe(doc.sourceId);
    expect(sig.evidenceDate).toBe(doc.publishedDate);
    // Scores between 0 and 1
    expect(sig.noveltyScore).toBeGreaterThanOrEqual(0);
    expect(sig.noveltyScore).toBeLessThanOrEqual(1);
  });

  test('Sponsored placement document creates Retail media signal', () => {
    const doc = makeDoc('doc-2', 'src-2', 'Retail media is adding sponsored ad placement to results.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    expect(signals[0].signalType).toBe('Retail media influence');
  });

  test('Zero result document creates Search relevance signal', () => {
    const doc = makeDoc('doc-3', 'src-3', 'Users experience zero result queries and no results, affecting relevance.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    expect(signals[0].signalType).toBe('Search relevance');
  });

  test('Recipe document creates Recipe‑to‑cart signal', () => {
    const doc = makeDoc('doc-4', 'src-4', 'A recipe for meal planning helps fill the basket quickly.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    expect(signals[0].signalType).toBe('Recipe-to-cart');
  });

  test('Trust document creates Transparency signal', () => {
    const doc = makeDoc('doc-5', 'src-5', 'Transparency and trust are crucial for explainability of AI recommendations.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    expect(signals[0].signalType).toBe('Trust in AI recommendations');
  });

  test('Irrelevant document creates no signal', () => {
    const doc = makeDoc('doc-6', 'src-6', 'This content talks about unrelated topics such as gardening.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(0);
  });

  test('Signal IDs are deterministic based on document and type', () => {
    const doc = makeDoc('doc-7', 'src-7', 'AI assistant helps with chat.');
    const signals = extractSignalsFromDocument(doc);
    expect(signals).toHaveLength(1);
    const expectedId = `${doc.id}-ai-assisted-shopping`;
    expect(signals[0].id).toBe(expectedId);
  });
});
