import { seedTestData } from "./testSeed";
// @ts-nocheck

/**
 * Step 17 – Evidence traceability validation
 *
 * Validates the complete chain: Trend → Signal → Document → Source
 *
 * Test cases:
 * - No orphan trend-signal links
 * - No orphan signal-document links
 * - No orphan document-source links
 * - No evidence from rejected source (by default)
 * - Every approved trend has at least one evidence item
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { validateTraceability } from './traceabilityValidation';
import { resetMockData, clearDynamicData, saveTrends, saveSignals, addEvidence, updateSourceStatus, saveDocuments } from './mockRepository';
import type { Document, Trend, Signal, EvidenceLink } from './types';

function makeTrend(overrides: Partial<Trend> = {}): Trend {
  return { 
    id: 'trace-t1', name: 'Trace Trend', summary: 'Trace summary',
    status: 'approved', horizon: '6-12 months',
    likelihoodScore: 0.9, confidenceScore: 0.9, impactScore: 0.8,
    maturityStage: 'emerging', relatedSignalIds: ['trace-sig-1'],
    drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [],
    monitoringQuestions: [], recommendedActions: [],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    ...overrides,
  };
}

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 'trace-sig-1', documentId: 'doc-1', sourceId: 'src-1',
    title: 'Trace Signal', summary: 'Trace signal summary.',
    signalType: 'AI-assisted shopping', pestleCategory: 'Technology',
    noveltyScore: 0.8, strengthScore: 0.8, confidenceScore: 0.9,
    evidenceDate: '2026-01-01', tags: [],
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<EvidenceLink> = {}): EvidenceLink {
  return {
    id: 'trace-ev-1', trendId: 'trace-t1', signalId: 'trace-sig-1',
    documentId: 'doc-1', sourceId: 'src-1',
    quote: 'Trace quote.', relevanceReason: 'Supports trace test.',
    ...overrides,
  };
}

function saveTraceDocument(): void {
  const document: Document = {
    id: 'doc-1',
    sourceId: 'src-1',
    title: 'Trace document',
    publishedDate: '2026-01-01',
    content: 'Trace document content.',
    url: 'https://example.com/trace',
    ingestionStatus: 'raw',
    extractedSignalIds: [],
  };
  saveDocuments([document]);
}

describe('Traceability health – integration', () => {
  beforeEach(() => { resetMockData();
    seedTestData(); clearDynamicData(); });

  test('no orphan links in clean data', async () => {
    const trend = makeTrend();
    const signal = makeSignal();
    const evidence = makeEvidence();
    saveTraceDocument();
    saveTrends([trend]);
    saveSignals([signal]);
    addEvidence(evidence);

    const report = await validateTraceability();
    expect(report).toHaveLength(0);
  });

  test('orphan trend-signal link detected (signal missing)', async () => {
    // Trend references sig-missing which doesn't exist
    const trend = makeTrend({ relatedSignalIds: ['sig-missing'] });
    saveTrends([trend]);
    // No signal seeded
    const report = await validateTraceability();
    const orphan = report.find((r) => r.type === 'trend' && r.message.includes('sig-missing'));
    expect(orphan).toBeDefined();
  });

  test('orphan signal-document link detected (document missing)', async () => {
    const signal = makeSignal({ documentId: 'doc-missing' });
    saveSignals([signal]);
    const report = await validateTraceability();
    const orphan = report.find((r) => r.type === 'signal' && r.message.includes('doc-missing'));
    expect(orphan).toBeDefined();
  });

  test('orphan signal-source link detected (source missing)', async () => {
    const signal = makeSignal({ sourceId: 'src-missing' });
    saveSignals([signal]);
    const report = await validateTraceability();
    const orphan = report.find((r) => r.type === 'signal' && r.message.includes('src-missing'));
    expect(orphan).toBeDefined();
  });

  test('evidence from rejected source is flagged', async () => {
    const trend = makeTrend();
    const signal = makeSignal();
    const evidence = makeEvidence();
    saveTraceDocument();
    saveTrends([trend]);
    saveSignals([signal]);
    addEvidence(evidence);
    // Reject the source after seeding evidence
    updateSourceStatus('src-1', 'rejected');

    const report = await validateTraceability();
    const rejectedFlag = report.find((r) => r.type === 'evidence' && r.message.includes('rejected source'));
    expect(rejectedFlag).toBeDefined();
  });

  test('approved trend without evidence is flagged', async () => {
    const trend = makeTrend({ relatedSignalIds: [] });
    saveTrends([trend]);
    // No evidence added
    const report = await validateTraceability();
    const noEvidence = report.find((r) => r.type === 'trend' && r.message.includes('no evidence'));
    expect(noEvidence).toBeDefined();
  });

  test('complete chain Trend→Signal→Document→Source passes clean', async () => {
    const trend = makeTrend();
    const signal = makeSignal();
    const evidence = makeEvidence();
    saveTraceDocument();
    saveTrends([trend]);
    saveSignals([signal]);
    addEvidence(evidence);

    const report = await validateTraceability();
    // doc-1 → src-1 exists in test-created data; no orphans expected
    expect(report.filter((r) => r.type !== 'evidence' || !r.message.includes('rejected')))
      .toHaveLength(0);
  });
});
