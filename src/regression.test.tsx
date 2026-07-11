// @ts-nocheck

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsScreen from './InsightsScreen';
import { repository } from './repository';
import type { Trend } from './types';

// Mock the repository module
vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  return {
    ...actual,
    repository: {
      getTrends: vi.fn(),
      getIndustryProfile: vi.fn(() => ({ })),
      getInsightSummary: vi.fn(),
    }
  };
});

describe('Phase 1 Regression: InsightsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only approved trends in the Insights Summary, excluding rejected or candidate trends', async () => {
    const mockTrends: Trend[] = [
      { id: 't1', name: 'Approved Trend', 
        summary: 'This should appear',
        status: 'approved',
        horizon: '0-1 year',
        likelihoodScore: 0.9,
        confidenceScore: 0.8,
        impactScore: 0.9,
        maturityStage: 'Emerging',
        relatedSignalIds: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      { id: 't2', name: 'Rejected Trend', 
        summary: 'This should NOT appear',
        status: 'rejected',
        horizon: '1-3 years',
        likelihoodScore: 0.5,
        confidenceScore: 0.5,
        impactScore: 0.5,
        maturityStage: 'Emerging',
        relatedSignalIds: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      { id: 't3', name: 'Candidate Trend', 
        summary: 'This should NOT appear',
        status: 'candidate',
        horizon: '3-5 years',
        likelihoodScore: 0.5,
        confidenceScore: 0.5,
        impactScore: 0.5,
        maturityStage: 'Emerging',
        relatedSignalIds: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      }
    ];

    vi.mocked(repository.getInsightSummary).mockResolvedValue({
      id: 'summary-1',
      industryProfileId: 'profile-1',
      generatedAt: '2025-01-01',
      aiSummary: '',
      keyTrends: [mockTrends[0]],
      watchItems: [],
      emergingRisks: [],
      opportunities: []
    } as any);

    render(<InsightsScreen />);

    // Approved trend should be visible
    expect(await screen.findByText('Approved Trend')).toBeInTheDocument();
    
    // Rejected and candidate should not
    expect(screen.queryByText('Rejected Trend')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Trend')).not.toBeInTheDocument();
  });
});
