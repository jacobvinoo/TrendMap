import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopicTimelineScreen from './TopicTimelineScreen';
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

describe('TopicTimelineScreen', () => {
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
        name: 'Retail Research',
        url: 'https://example.com',
        sourceType: 'research',
        credibilityScore: 0.9,
        relevanceScore: 0.9,
        freshnessScore: 0.8,
        status: 'approved',
        notes: 'Covers grocery search.',
        retrievedAt: '2026-07-01',
      },
    ]);
    mockRepository.getDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Search report',
        publishedDate: '2026-07-03',
        content: 'AI search improves digital grocery discovery.',
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
        summary: 'Retailers are improving grocery search.',
        signalType: 'technology',
        pestleCategory: 'technology',
        noveltyScore: 0.7,
        strengthScore: 0.8,
        confidenceScore: 0.8,
        evidenceDate: '2026-07-04',
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
        createdAt: '2026-07-05',
        updatedAt: '2026-07-06',
      },
    ]);
  });

  it('shows a chronological topic timeline with developments', async () => {
    render(<TopicTimelineScreen />);

    expect(await screen.findByRole('heading', { name: /topic timeline/i })).toBeInTheDocument();
    expect(within(screen.getByRole('heading', { name: 'Digital grocery discovery' })).getByText('Digital grocery discovery')).toBeInTheDocument();
    expect(screen.getByText('AI-assisted grocery discovery')).toBeInTheDocument();
    expect(screen.getByText('AI search adoption')).toBeInTheDocument();
    expect(screen.getByText('Search report')).toBeInTheDocument();
    expect(screen.getByText('Source approved: Retail Research')).toBeInTheDocument();
  });

  it('navigates to the related screen for a timeline entry', async () => {
    render(<TopicTimelineScreen />);
    await screen.findByText('AI-assisted grocery discovery');

    fireEvent.click(screen.getAllByRole('button', { name: /open related screen/i })[0]);

    expect(window.location.hash).toBe('#trend-timeline');
  });

  it('shows empty state when no approved watchlist topics exist', async () => {
    mockRepository.getTrendThemes.mockResolvedValue([]);

    render(<TopicTimelineScreen />);

    expect(await screen.findByText(/No approved watchlist topics/i)).toBeInTheDocument();
  });
});
