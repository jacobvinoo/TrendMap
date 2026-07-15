import { describe, expect, it } from 'vitest';
import { buildTrendTimeline } from './trendTimeline';
import type { Trend } from './types';

const trend: Trend = {
  id: 'trend-ai-search',
  name: 'AI-assisted grocery discovery',
  summary: 'AI is changing grocery search.',
  status: 'approved',
  horizon: '2027',
  likelihoodScore: 0.7,
  confidenceScore: 0.6,
  impactScore: 0.55,
  maturityStage: 'emerging',
  relatedSignalIds: ['sig-1'],
  drivers: [],
  blockers: [],
  whatNeedsToBeTrue: [],
  leadingIndicators: [],
  monitoringQuestions: [],
  recommendedActions: [],
  createdAt: '2026-07-01',
  updatedAt: '2026-07-02',
};

describe('buildTrendTimeline', () => {
  it('combines score changes, evidence, snapshots, and decisions in reverse date order', () => {
    const summary = buildTrendTimeline({
      trend,
      documents: [{
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Retail AI report',
        publishedDate: '2026-07-08',
        content: 'Retailers are using AI to improve grocery discovery and reduce failed searches.',
        url: 'https://example.com/report',
        ingestionStatus: 'extracted',
        extractedSignalIds: ['sig-1'],
      }],
      sources: [{
        id: 'src-1',
        name: 'Retail Research',
        url: 'https://example.com',
        sourceType: 'research',
        credibilityScore: 0.9,
        relevanceScore: 0.9,
        freshnessScore: 0.8,
        status: 'approved',
        notes: '',
      }],
      evidence: [{
        id: 'ev-1',
        trendId: trend.id,
        signalId: 'sig-1',
        documentId: 'doc-1',
        sourceId: 'src-1',
        quote: 'AI search reduces failed grocery searches.',
        relevanceReason: 'Shows clear operating impact.',
      }],
      snapshots: [
        { id: 'snap-1', trendId: trend.id, capturedAt: '2026-07-05', likelihoodScore: 0.6, confidenceScore: 0.6, impactScore: 0.5, horizon: '2027', maturityStage: 'emerging', evidenceCount: 1, signalCount: 1, sourceDiversity: 1, reason: 'Baseline' },
        { id: 'snap-2', trendId: trend.id, capturedAt: '2026-07-10', likelihoodScore: 0.7, confidenceScore: 0.7, impactScore: 0.7, horizon: '2027', maturityStage: 'emerging', evidenceCount: 2, signalCount: 2, sourceDiversity: 1, reason: 'More evidence' },
      ],
      changes: [{
        id: 'change-1',
        trendId: trend.id,
        previousSnapshotId: 'snap-1',
        currentSnapshotId: 'snap-2',
        changedAt: '2026-07-10',
        likelihoodDelta: 0.1,
        confidenceDelta: 0.1,
        impactDelta: 0.2,
        horizonChanged: false,
        maturityChanged: false,
        reason: 'Evidence strength improved.',
        relatedSignalIds: ['sig-1'],
      }],
      auditEvents: [{
        id: 'audit-1',
        action: 'trend.status.approved',
        entity_type: 'trend',
        entity_id: trend.id,
        user_id: 'user-strategist',
        details: '{}',
        created_at: '2026-07-11',
      }],
    });

    expect(summary.evidenceCount).toBe(1);
    expect(summary.sourceCount).toBe(1);
    expect(summary.latestImpactScore).toBe(0.7);
    expect(summary.entries[0].title).toBe('Trend approved');
    expect(summary.entries.map((entry) => entry.type)).toContain('score_change');
    expect(summary.entries.map((entry) => entry.type)).toContain('evidence');
    expect(summary.entries.find((entry) => entry.type === 'evidence')?.sourceName).toBe('Retail Research');
  });
});
