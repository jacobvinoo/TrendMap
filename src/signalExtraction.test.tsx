// @ts-nocheck

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
});

// --- Phase 2 Monitoring Signal Extraction Tests ---

describe('Phase 2: Signal Extraction Scenarios', () => {
  it('extracts positive signal for competitor launch', () => {
    const doc: Document = {
      id: 'doc-new-1', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'Competitor launches conversational grocery search',
      content: 'A major competitor has just launched a conversational grocery search feature powered by generative AI.'
    };
    const signals = extractSignalsFromDocument(doc);
    const launchSignal = signals.find(s => s.signalType === 'Competitor Launch')!;
    expect(launchSignal).toBeDefined();
    expect(launchSignal.polarity).toBe('positive'); 
    expect(launchSignal.strengthScore).toBeGreaterThanOrEqual(0.7);
    expect(launchSignal.summary).toContain('launch');
  });

  it('extracts negative signal for pilot pause', () => {
    const doc: Document = {
      id: 'doc-contra-1', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'Retailer pauses AI assistant pilot due to poor recommendation trust',
      content: 'A major retailer has paused its AI assistant pilot. Consumers cited poor trust in the recommendations and frequent hallucinations.'
    };
    const signals = extractSignalsFromDocument(doc);
    const pauseSignal = signals.find(s => s.signalType === 'Adoption Blocker')!;
    expect(pauseSignal).toBeDefined();
    expect(pauseSignal.polarity).toBe('negative'); 
    expect(pauseSignal.pestleCategory).toBe('social');
  });

  it('extracts positive signal for vendor case study', () => {
    const doc: Document = {
      id: 'doc-vendor', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'AI search vendor publishes grocery semantic search case study',
      content: 'An AI search vendor demonstrated a 20% lift in conversion using semantic grocery search.'
    };
    const signals = extractSignalsFromDocument(doc);
    const vendorSignal = signals.find(s => s.signalType === 'Adoption Evidence')!;
    expect(vendorSignal).toBeDefined();
    expect(vendorSignal.polarity).toBe('positive'); 
  });

  it('extracts positive signal for retail media expansion', () => {
    const doc: Document = {
      id: 'doc-media', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'Retail media source reports sponsored placement expansion',
      content: 'Retail media networks are aggressively expanding sponsored placement inventory in search results.'
    };
    const signals = extractSignalsFromDocument(doc);
    const mediaSignal = signals.find(s => s.signalType === 'Commercial Influence')!;
    expect(mediaSignal).toBeDefined();
    expect(mediaSignal.polarity).toBe('positive'); 
  });

  it('extracts negative signal for regulatory warning', () => {
    const doc: Document = {
      id: 'doc-reg', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'Regulatory source questions sponsored AI recommendations',
      content: 'Regulatory bodies are investigating whether sponsored products in AI recommendations constitute deceptive advertising.'
    };
    const signals = extractSignalsFromDocument(doc);
    const regSignal = signals.find(s => s.signalType === 'Regulatory Risk')!;
    expect(regSignal).toBeDefined();
    expect(regSignal.polarity).toBe('negative'); 
    expect(regSignal.pestleCategory).toBe('legal');
  });

  it('extracts negative signal for adoption slowdown', () => {
    const doc: Document = {
      id: 'doc-slow', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'Analyst report says adoption is slower than expected',
      content: 'Despite the hype, analyst reports indicate that consumer adoption of AI-assisted grocery shopping is significantly slower than initially projected.'
    };
    const signals = extractSignalsFromDocument(doc);
    const slowSignal = signals.find(s => s.signalType === 'Negative Momentum')!;
    expect(slowSignal).toBeDefined();
    expect(slowSignal.polarity).toBe('negative'); 
  });

  it('extracts negative signal for trust concerns', () => {
    const doc: Document = {
      id: 'doc-trust', sourceId: 'src-1', url: '', publishedDate: '2026-01-01', ingestionStatus: 'pending', extractedSignalIds: [],
      title: 'New document about consumer trust concerns',
      content: 'Consumers are increasingly worried about how their data is used by AI models for grocery recommendations.'
    };
    const signals = extractSignalsFromDocument(doc);
    const trustSignal = signals.find(s => s.signalType === 'Trust Concerns')!;
    expect(trustSignal).toBeDefined();
    expect(trustSignal.polarity).toBe('negative'); 
  });
});

describe('Additional tests', () => {
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
