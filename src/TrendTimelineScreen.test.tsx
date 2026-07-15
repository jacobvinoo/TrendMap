import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TrendTimelineScreen from './TrendTimelineScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getTrends: vi.fn(),
    getDocuments: vi.fn(),
    getSources: vi.fn(),
    getEvidenceForTrend: vi.fn(),
    getScoreHistory: vi.fn(),
    getTrendHistory: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

describe('TrendTimelineScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    mockRepository.getTrends.mockResolvedValue([
      {
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
      },
    ]);
    mockRepository.getDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Retail AI report',
        publishedDate: '2026-07-08',
        content: 'Retailers are using AI to improve grocery discovery.',
        url: 'https://example.com/report',
        ingestionStatus: 'extracted',
        extractedSignalIds: ['sig-1'],
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
        notes: '',
      },
    ]);
    mockRepository.getEvidenceForTrend.mockResolvedValue([
      {
        id: 'ev-1',
        trendId: 'trend-ai-search',
        signalId: 'sig-1',
        documentId: 'doc-1',
        sourceId: 'src-1',
        quote: 'AI search reduces failed grocery searches.',
        relevanceReason: 'Shows clear operating impact.',
      },
    ]);
    mockRepository.getScoreHistory.mockResolvedValue({
      snapshots: [
        { id: 'snap-1', trendId: 'trend-ai-search', capturedAt: '2026-07-05', likelihoodScore: 0.6, confidenceScore: 0.6, impactScore: 0.5, horizon: '2027', maturityStage: 'emerging', evidenceCount: 1, signalCount: 1, sourceDiversity: 1, reason: 'Baseline' },
        { id: 'snap-2', trendId: 'trend-ai-search', capturedAt: '2026-07-10', likelihoodScore: 0.7, confidenceScore: 0.7, impactScore: 0.7, horizon: '2027', maturityStage: 'emerging', evidenceCount: 2, signalCount: 2, sourceDiversity: 1, reason: 'More evidence' },
      ],
      changes: [
        { id: 'change-1', trendId: 'trend-ai-search', previousSnapshotId: 'snap-1', currentSnapshotId: 'snap-2', changedAt: '2026-07-10', likelihoodDelta: 0.1, confidenceDelta: 0.1, impactDelta: 0.2, horizonChanged: false, maturityChanged: false, reason: 'Evidence strength improved.', relatedSignalIds: ['sig-1'] },
      ],
    });
    mockRepository.getTrendHistory.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'trend.status.approved',
        entity_type: 'trend',
        entity_id: 'trend-ai-search',
        user_id: 'user-strategist',
        details: '{}',
        created_at: '2026-07-11',
      },
    ]);
  });

  it('shows a trend timeline with score movement and evidence traceability', async () => {
    render(<TrendTimelineScreen />);

    expect(await screen.findByRole('heading', { name: /trend timeline/i })).toBeInTheDocument();
    expect(await screen.findByText('AI-assisted grocery discovery')).toBeInTheDocument();
    expect(screen.getByText('Importance increased')).toBeInTheDocument();
    expect(screen.getByText(/Impact moved up from 50% to 70%/i)).toBeInTheDocument();
    expect(screen.getByText('Evidence from Retail Research')).toBeInTheDocument();
    expect(screen.getByText(/AI search reduces failed grocery searches/i)).toBeInTheDocument();
    expect(screen.getByText('Trend approved')).toBeInTheDocument();
  });

  it('links back to trend review for decision work', async () => {
    render(<TrendTimelineScreen />);
    await screen.findByRole('heading', { name: /trend timeline/i });

    fireEvent.click(screen.getByRole('button', { name: /open trend review/i }));

    expect(window.location.hash).toBe('#trends');
  });

  it('shows an empty state when no trends exist', async () => {
    mockRepository.getTrends.mockResolvedValue([]);

    render(<TrendTimelineScreen />);

    expect(await screen.findByText(/No trends available for timeline review/i)).toBeInTheDocument();
  });
});
