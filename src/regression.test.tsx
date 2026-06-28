// @ts-nocheck

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsScreen from './InsightsScreen';
import { getTrends } from './mockRepository';
import type { Trend } from './types';

// Mock the repository module
vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  return {
    ...actual,
    getTrends: vi.fn(),
    getIndustryProfile: vi.fn(() => ({ })),
  };
});

describe('Phase 1 Regression: InsightsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only approved trends in the Insights Summary, excluding rejected or candidate trends', () => {
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

    vi.mocked(getTrends).mockReturnValue(mockTrends);

    render(<InsightsScreen />);

    // Approved trend should be visible
    expect(screen.getByText('Approved Trend')).toBeInTheDocument();
    
    // Rejected and candidate should not
    expect(screen.queryByText('Rejected Trend')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Trend')).not.toBeInTheDocument();
  });
});
