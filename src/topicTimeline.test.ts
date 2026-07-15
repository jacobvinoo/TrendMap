import { describe, expect, it } from 'vitest';
import { buildTopicTimeline } from './topicTimeline';
import type { WatchlistTopicSummary } from './types';

const topic: WatchlistTopicSummary = {
  theme: {
    id: 'theme-search',
    name: 'Digital grocery discovery',
    description: 'Search and recommendations',
    keywords: ['search'],
    status: 'approved',
    origin: 'manual',
  },
  state: 'active',
  sourceCount: 1,
  documentCount: 1,
  signalCount: 1,
  candidateTrendCount: 0,
  approvedTrendCount: 1,
  relatedSourceIds: ['src-1'],
  relatedDocumentIds: ['doc-1'],
  relatedSignalIds: ['sig-1'],
  relatedTrendIds: ['trend-1'],
  recommendedAction: 'Monitor timeline and strategic actions for this topic.',
  recommendedRoute: 'trend-timeline',
};

describe('buildTopicTimeline', () => {
  it('creates dated topic entries from related source, document, signal, and trend ids', () => {
    const timeline = buildTopicTimeline({
      topic,
      sources: [{
        id: 'src-1',
        name: 'Retail Research',
        url: 'https://example.com',
        sourceType: 'research',
        credibilityScore: 0.9,
        relevanceScore: 0.9,
        freshnessScore: 0.8,
        status: 'approved',
        notes: 'Useful search coverage.',
        retrievedAt: '2026-07-01',
      }],
      documents: [{
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Search report',
        publishedDate: '2026-07-03',
        content: 'AI search is changing digital grocery discovery.',
        url: 'https://example.com/doc',
        ingestionStatus: 'extracted',
        extractedSignalIds: ['sig-1'],
      }],
      signals: [{
        id: 'sig-1',
        documentId: 'doc-1',
        sourceId: 'src-1',
        title: 'AI search adoption',
        summary: 'Retailers are improving grocery search.',
        signalType: 'technology',
        pestleCategory: 'technology',
        noveltyScore: 0.7,
        strengthScore: 0.8,
        confidenceScore: 0.8,
        evidenceDate: '2026-07-04',
        tags: ['search'],
      }],
      trends: [{
        id: 'trend-1',
        name: 'AI-assisted grocery discovery',
        summary: 'Search is becoming guided.',
        status: 'approved',
        horizon: '2027',
        likelihoodScore: 0.7,
        confidenceScore: 0.8,
        impactScore: 0.7,
        maturityStage: 'emerging',
        relatedSignalIds: ['sig-1'],
        drivers: [],
        blockers: [],
        whatNeedsToBeTrue: [],
        leadingIndicators: [],
        monitoringQuestions: [],
        recommendedActions: [],
        createdAt: '2026-07-05',
        updatedAt: '2026-07-06',
      }],
    });

    expect(timeline.entries.map((entry) => entry.type)).toEqual(['trend', 'signal', 'document', 'source']);
    expect(timeline.entries[0].title).toBe('AI-assisted grocery discovery');
    expect(timeline.entries.find((entry) => entry.type === 'signal')?.documentTitle).toBe('Search report');
  });
});
