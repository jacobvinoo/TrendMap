// @ts-nocheck
import type { SourceSnapshot, ChangeEvent } from './types'; 

export function detectChanges(previousSnapshot: SourceSnapshot | null, currentSnapshot: SourceSnapshot): ChangeEvent[] {
  const events: ChangeEvent[] = [];
  const now = new Date().toISOString();

  const prevDocs = new Map(previousSnapshot?.documentFingerprints.map(f => [f.documentId, f]) || []); 
  const currDocs = new Map(currentSnapshot.documentFingerprints.map(f => [f.documentId, f])); 

  // Check for new, updated, and metadata changes
  for (const [docId, currDoc] of currDocs.entries()) {
    const prevDoc = prevDocs.get(docId);

    if (!prevDoc) {
      events.push({
        id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sourceId: currentSnapshot.sourceId,
        documentId: docId,
        changeType: 'new_document',
        detectedAt: now,
        previousSnapshotId: previousSnapshot?.id,
        currentSnapshotId: currentSnapshot.id,
        summary: `New document detected: ${docId}`
      });
    } else {
      if (currDoc.contentHash !== prevDoc.contentHash) { 
        events.push({
          id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceId: currentSnapshot.sourceId,
          documentId: docId,
          changeType: 'updated_document',
          detectedAt: now,
          previousSnapshotId: previousSnapshot!.id,
          currentSnapshotId: currentSnapshot.id,
          summary: `Document content updated: ${docId}`
        });
      } else if (currDoc.titleHash !== prevDoc.titleHash) { 
        events.push({
          id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceId: currentSnapshot.sourceId,
          documentId: docId,
          changeType: 'metadata_change',
          detectedAt: now,
          previousSnapshotId: previousSnapshot!.id,
          currentSnapshotId: currentSnapshot.id,
          summary: `Document metadata changed: ${docId}`
        });
      }
    }
  }

  // Check for removed documents
  if (previousSnapshot) {
    for (const docId of prevDocs.keys()) {
      if (!currDocs.has(docId)) {
        events.push({
          id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceId: currentSnapshot.sourceId,
          documentId: docId,
          changeType: 'removed_document',
          detectedAt: now,
          previousSnapshotId: previousSnapshot.id,
          currentSnapshotId: currentSnapshot.id,
          summary: `Document removed: ${docId}`
        });
      }
    }
  }

  return events;
}
