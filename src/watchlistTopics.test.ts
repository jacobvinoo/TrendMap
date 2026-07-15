import { describe, expect, it } from 'vitest';
import { buildWatchlistTopics } from './watchlistTopics';
import type { Source, TrendTheme } from './types';

const theme: TrendTheme = {
  id: 'theme-search',
  name: 'Digital grocery discovery',
  description: 'Search and recommendations',
  keywords: ['search', 'recommendations'],
  status: 'approved',
  origin: 'manual',
};

const source: Source = {
  id: 'src-1',
  name: 'Search Retail Research',
  url: 'https://example.com',
  sourceType: 'research',
  credibilityScore: 0.9,
  relevanceScore: 0.8,
  freshnessScore: 0.8,
  status: 'approved',
  notes: 'Covers grocery search and recommendations.',
  retrievedAt: '2026-07-10',
};

describe('buildWatchlistTopics', () => {
  it('groups approved themes with related evidence and active trends', () => {
    const topics = buildWatchlistTopics({
      themes: [theme],
      sources: [source],
      documents: [{
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Grocery search report',
        publishedDate: '2026-07-11',
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
        evidenceDate: '2026-07-11',
        tags: ['search'],
      }],
      trends: [{
        id: 'trend-1',
        name: 'AI-assisted grocery discovery',
        summary: 'Search and discovery are shifting.',
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
        createdAt: '2026-07-10',
        updatedAt: '2026-07-12',
      }],
    });

    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({
      state: 'active',
      sourceCount: 1,
      documentCount: 1,
      signalCount: 1,
      approvedTrendCount: 1,
      recommendedRoute: 'trend-timeline',
    });
  });

  it('marks a topic as needing sources when no approved source matches', () => {
    const topics = buildWatchlistTopics({
      themes: [theme],
      sources: [],
      documents: [],
      signals: [],
      trends: [],
    });

    expect(topics[0].state).toBe('needs_sources');
    expect(topics[0].recommendedRoute).toBe('sources');
  });
});
