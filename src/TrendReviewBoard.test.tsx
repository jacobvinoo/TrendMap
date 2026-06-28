// @ts-nocheck

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import TrendReviewBoard from './TrendReviewBoard';
import { resetMockData, getTrends, saveTrends, addEvidence, saveTrendScoreSnapshot } from './mockRepository';

describe('TrendReviewBoard', () => {
  beforeEach(() => {
    resetMockData();
    saveTrends([{ id: 't1', name: 'Testing Trend', 
        summary: 'A candidate trend for testing',
        status: 'candidate',
        horizon: '2-3 years',
        likelihoodScore: 0.8,
        confidenceScore: 0.7,
        impactScore: 0.9,
        maturityStage: 'emerging',
        relatedSignalIds: [],
        drivers: ['Test Driver'],
        blockers: ['Test Blocker'],
        whatNeedsToBeTrue: ['Test What Needs To Be True'],
        leadingIndicators: ['Test Leading Indicator'],
        monitoringQuestions: ['Test Monitoring Question'],
        recommendedActions: ['Test Recommended Action'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
    ]);
    addEvidence({
      id: 'e-test-1',
      trendId: 't1',
      signalId: 's-test-1',
      documentId: 'd-test-1',
      sourceId: 'src-1',
      quote: 'This is a test quote',
      relevanceReason: 'Test relevance reason'
    });
    saveTrendScoreSnapshot({ 
      id: 'snap-1',
      trendId: 't1',
      capturedAt: '2026-01-01T12:00:00Z',
      confidenceScore: 0.7,
      momentumScore: 0.5,
      impactScore: 0.9
    } as any);
  });

  it('renders candidate trends', async () => {
    render(<TrendReviewBoard />);
    expect(await screen.findByText('Trend Review Board')).toBeInTheDocument();
    
    // Check that we render cards for candidate trends
    const cards = await screen.findAllByTestId('trend-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('approves a trend and updates status', async () => {
    render(<TrendReviewBoard />);
    
    // Wait for the board to load
    const approveBtns = await screen.findAllByRole('button', { name: /approve/i });
    expect(approveBtns.length).toBeGreaterThan(0);
    
    fireEvent.click(approveBtns[0]);
    
    // Status should be updated, and the candidate might disappear or remain depending on loadData filtering
    // In our code, loadData filters to 'candidate' only, so the length should decrease
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId('trend-card');
      expect(remainingCards.length).toBeLessThan(approveBtns.length);
    });
  });

  it('rejects a trend and removes from board', async () => {
    render(<TrendReviewBoard />);
    
    const rejectBtns = await screen.findAllByRole('button', { name: /reject/i });
    expect(rejectBtns.length).toBeGreaterThan(0);
    
    fireEvent.click(rejectBtns[0]);
    
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId('trend-card');
      expect(remainingCards.length).toBeLessThan(rejectBtns.length);
    });
  });

  it('shows detailed strategic fields and evidence on Details click', async () => {
    render(<TrendReviewBoard />);
    
    const detailsBtns = await screen.findAllByRole('button', { name: /details/i });
    fireEvent.click(detailsBtns[0]);

    // Check strategic analysis sections
    expect(await screen.findByText('Strategic Analysis')).toBeInTheDocument();
    expect(screen.getByText('What Needs To Be True')).toBeInTheDocument();
    expect(screen.getByText('Leading Indicators')).toBeInTheDocument();
    expect(screen.getByText('Why this trend exists (Evidence)')).toBeInTheDocument();
  });

  it('displays the Trend Score Timeline in details view', async () => {
    render(<TrendReviewBoard />);
    
    const detailsBtns = await screen.findAllByRole('button', { name: /details/i });
    fireEvent.click(detailsBtns[0]);

    expect(await screen.findByText('Score History Timeline')).toBeInTheDocument();
    // Since text is split into a span and text node, we just check for the percentages or use a custom function
    expect(screen.getAllByText(/70%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/50%/i).length).toBeGreaterThan(0);
  });

  it('allows inline editing of trend name', async () => {
    render(<TrendReviewBoard />);
    
    const detailsBtns = await screen.findAllByRole('button', { name: /details/i });
    fireEvent.click(detailsBtns[0]);

    // Go into edit mode
    const editBtn = await screen.findByRole('button', { name: 'Edit' });
    fireEvent.click(editBtn);

    // Find the input field
    const nameInput = screen.getByLabelText('Edit trend name');
    expect(nameInput).toBeInTheDocument();

    // Type a new name
    fireEvent.change(nameInput, { target: { value: 'Updated Executive Trend Name' } });
    
    // Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Verify UI updated
    expect(await screen.findByText('Updated Executive Trend Name')).toBeInTheDocument();
    
    // Verify repository updated
    const trends = getTrends();
    const updatedTrend = trends.find(t => t.name === 'Updated Executive Trend Name');
    expect(updatedTrend).toBeDefined();
  });
});
