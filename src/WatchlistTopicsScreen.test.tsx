import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WatchlistTopicsScreen from './WatchlistTopicsScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getTrendThemes: vi.fn(),
    getSources: vi.fn(),
    getDocuments: vi.fn(),
    getSignals: vi.fn(),
    getTrends: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

describe('WatchlistTopicsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    mockRepository.getTrendThemes.mockResolvedValue([
      {
        id: 'theme-search',
        name: 'Digital grocery discovery',
        description: 'Search and recommendations.',
        keywords: ['search', 'recommendations'],
        status: 'approved',
        origin: 'manual',
      },
    ]);
    mockRepository.getSources.mockResolvedValue([
      {
        id: 'src-1',
        name: 'Search Retail Research',
        url: 'https://example.com',
        sourceType: 'research',
        credibilityScore: 0.9,
        relevanceScore: 0.9,
        freshnessScore: 0.8,
        status: 'approved',
        notes: 'Covers grocery search.',
      },
    ]);
    mockRepository.getDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Search report',
        publishedDate: '2026-07-10',
        content: 'AI search improves discovery.',
        url: 'https://example.com/doc',
        ingestionStatus: 'extracted',
        extractedSignalIds: ['sig-1'],
      },
    ]);
    mockRepository.getSignals.mockResolvedValue([
      {
        id: 'sig-1',
        documentId: 'doc-1',
        sourceId: 'src-1',
        title: 'AI search adoption',
        summary: 'Grocery search is changing.',
        signalType: 'technology',
        pestleCategory: 'technology',
        noveltyScore: 0.7,
        strengthScore: 0.8,
        confidenceScore: 0.8,
        evidenceDate: '2026-07-10',
        tags: ['search'],
      },
    ]);
    mockRepository.getTrends.mockResolvedValue([
      {
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
        createdAt: '2026-07-10',
        updatedAt: '2026-07-11',
      },
    ]);
  });

  it('shows approved watchlist topics with coverage counts', async () => {
    render(<WatchlistTopicsScreen />);

    expect(await screen.findByRole('heading', { name: /watchlist topics/i })).toBeInTheDocument();
    expect(screen.getByText('Digital grocery discovery')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
  });

  it('navigates to the recommended route for the topic', async () => {
    render(<WatchlistTopicsScreen />);
    await screen.findByText('Digital grocery discovery');

    fireEvent.click(screen.getByRole('button', { name: /monitor timeline and strategic actions/i }));

    expect(window.location.hash).toBe('#trend-timeline');
  });

  it('shows an empty state when no approved themes exist', async () => {
    mockRepository.getTrendThemes.mockResolvedValue([]);

    render(<WatchlistTopicsScreen />);

    expect(await screen.findByText(/No approved watchlist topics/i)).toBeInTheDocument();
  });
});
