// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { getMockFeedSnapshot, createSourceSnapshotFromDocuments } from './monitoringFeed';
import type { Document } from './types';

describe('Mock Feed and Snapshot Service', () => {
  it('returns deterministic documents for baseline', () => {
    const docs = getMockFeedSnapshot('src-1', 'baseline');
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].sourceId).toBe('src-1');
    expect(docs[0].id).toBeDefined();
  });

  it('returns additional documents for new_activity', () => {
    const baseline = getMockFeedSnapshot('src-1', 'baseline');
    const newActivity = getMockFeedSnapshot('src-1', 'new_activity');
    expect(newActivity.length).toBeGreaterThan(baseline.length);
  });

  it('returns cooling/contradictory documents for contradictory_activity', () => {
    const docs = getMockFeedSnapshot('src-1', 'contradictory_activity');
    // Ensure we have some content referencing trust, pauses, or slowdowns based on fixtures
    const hasContradictory = docs.some(d => 
      d.content.toLowerCase().includes('trust') || 
      d.content.toLowerCase().includes('pause') ||
      d.content.toLowerCase().includes('slower')
    );
    expect(hasContradictory).toBe(true);
  });

  it('creates a SourceSnapshot with document fingerprints', () => {
    const docs: Document[] = [
      {
        id: 'mock-doc-1',
        sourceId: 'src-1',
        title: 'Mock Title',
        content: 'Mock content',
        publishedDate: '2026-01-01T00:00:00Z',
        url: 'http://example.com',
        ingestionStatus: 'pending',
        extractedSignalIds: []
      }
    ];

    const snapshot = createSourceSnapshotFromDocuments('src-1', docs);
    expect(snapshot.sourceId).toBe('src-1');
    expect(snapshot.documentFingerprints).toHaveLength(1);
    expect(snapshot.documentFingerprints[0].documentId).toBe('mock-doc-1');
    expect(snapshot.documentFingerprints[0].titleHash).toBeDefined();
    expect(snapshot.documentFingerprints[0].contentHash).toBeDefined();
  });

  it('generates consistent hashes for identical documents', () => {
    const doc: Document = {
      id: 'doc', sourceId: 'src', title: 'A', content: 'B', publishedDate: '2026', url: 'u', ingestionStatus: 'pending', extractedSignalIds: []
    };
    const snap1 = createSourceSnapshotFromDocuments('src', [doc]);
    const snap2 = createSourceSnapshotFromDocuments('src', [doc]);
    
    expect(snap1.documentFingerprints[0].contentHash).toBe(snap2.documentFingerprints[0].contentHash);
  });

  it('generates different hashes when content changes', () => {
    const doc1: Document = {
      id: 'doc', sourceId: 'src', title: 'A', content: 'B', publishedDate: '2026', url: 'u', ingestionStatus: 'pending', extractedSignalIds: []
    };
    const doc2: Document = { ...doc1, content: 'Changed' };

    const snap1 = createSourceSnapshotFromDocuments('src', [doc1]);
    const snap2 = createSourceSnapshotFromDocuments('src', [doc2]);
    
    expect(snap1.documentFingerprints[0].contentHash).not.toBe(snap2.documentFingerprints[0].contentHash);
  });
});
