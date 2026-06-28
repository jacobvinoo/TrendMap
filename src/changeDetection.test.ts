// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { detectChanges } from './changeDetection';
import type { SourceSnapshot } from './types'; 

describe('Change Detection Service', () => {
  const prev: SourceSnapshot = {
    id: 'snap-1',
    sourceId: 'src-1',
    capturedAt: '2026-01-01',
    rawMetadata: {},
    documentFingerprints: [
      { documentId: 'doc-1', url: '', titleHash: 't1', contentHash: 'c1', publishedDate: '', lastSeenAt: '' },
      { documentId: 'doc-2', url: '', titleHash: 't2', contentHash: 'c2', publishedDate: '', lastSeenAt: '' },
      { documentId: 'doc-3', url: '', titleHash: 't3', contentHash: 'c3', publishedDate: '', lastSeenAt: '' }
    ]
  };

  it('detects new document', () => {
    const curr: SourceSnapshot = {
      ...prev,
      id: 'snap-2',
      documentFingerprints: [
        ...prev.documentFingerprints,
        { documentId: 'doc-new', url: '', titleHash: 't-new', contentHash: 'c-new', publishedDate: '', lastSeenAt: '' }
      ]
    };
    const changes = detectChanges(prev, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('new_document');
    expect(changes[0].documentId).toBe('doc-new');
    expect(changes[0].previousSnapshotId).toBe('snap-1');
    expect(changes[0].currentSnapshotId).toBe('snap-2');
    expect(changes[0].summary).toBeDefined();
  });

  it('detects updated content hash', () => {
    const curr: SourceSnapshot = {
      ...prev,
      id: 'snap-2',
      documentFingerprints: prev.documentFingerprints.map(f =>  
        f.documentId === 'doc-2' ? { ...f, contentHash: 'c2-changed' } : f
      )
    };
    const changes = detectChanges(prev, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('updated_document');
    expect(changes[0].documentId).toBe('doc-2');
  });

  it('detects changed title hash as metadata_change', () => {
    const curr: SourceSnapshot = {
      ...prev,
      id: 'snap-2',
      documentFingerprints: prev.documentFingerprints.map(f =>  
        f.documentId === 'doc-2' ? { ...f, titleHash: 't2-changed' } : f
      )
    };
    const changes = detectChanges(prev, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('metadata_change');
    expect(changes[0].documentId).toBe('doc-2');
  });

  it('detects removed document', () => {
    const curr: SourceSnapshot = {
      ...prev,
      id: 'snap-2',
      documentFingerprints: prev.documentFingerprints.filter(f => f.documentId !== 'doc-1') 
    };
    const changes = detectChanges(prev, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('removed_document');
    expect(changes[0].documentId).toBe('doc-1');
  });

  it('returns empty array if no changes', () => {
    const curr: SourceSnapshot = { ...prev, id: 'snap-2' };
    const changes = detectChanges(prev, curr);
    expect(changes).toHaveLength(0);
  });

  it('handles null previous snapshot as all new documents', () => {
    const changes = detectChanges(null, prev);
    expect(changes).toHaveLength(3);
    expect(changes.every(c => c.changeType === 'new_document')).toBe(true);
    expect(changes[0].previousSnapshotId).toBeUndefined();
  });
});
