import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PredictionTimelineScreen from './PredictionTimelineScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getPredictions: vi.fn(),
  },
}));

describe('PredictionTimelineScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no predictions exist', async () => {
    // @ts-ignore
    repository.getPredictions.mockResolvedValue([]);

    await act(async () => {
      render(<PredictionTimelineScreen />);
    });

    expect(screen.getByText('No predictions generated yet. Run the autonomous team cycle.')).toBeInTheDocument();
  });

  it('renders predictions list', async () => {
    // @ts-ignore
    repository.getPredictions.mockResolvedValue([
      {
        id: '1',
        trendId: 'AI-Adoption-Surge',
        name: 'AI Adoption Surge',
        description: 'Significant increase in AI adoption in retail',
        timeframe: '12-24 months',
        confidenceScore: 0.85,
        status: 'active',
        justification: 'Strong signal density from recent reports.',
        triggerConditions: ['Retail earnings report > 5% AI investment']
      }
    ]);

    await act(async () => {
      render(<PredictionTimelineScreen />);
    });

    expect(screen.getByText('AI Adoption Surge')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});
