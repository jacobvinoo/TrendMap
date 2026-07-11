// @ts-nocheck

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import TrendReviewBoard from './TrendReviewBoard';
import { resetMockData, getTrends, saveTrends, addEvidence, saveTrendScoreSnapshot, saveSources, saveDocuments } from './mockRepository';

describe('TrendReviewBoard', () => {
  beforeEach(() => {
    resetMockData();
    saveSources([{
      id: 'src-1',
      name: 'Retail Technology News',
      url: 'https://example.com/source',
      sourceType: 'news',
      credibilityScore: 0.8,
      relevanceScore: 0.8,
      freshnessScore: 0.8,
      status: 'approved',
      notes: '',
      createdAt: '2026-02-03T10:00:00Z',
      updatedAt: '2026-02-03T10:00:00Z',
    }]);
    saveDocuments([{
      id: 'd-test-1',
      sourceId: 'src-1',
      title: 'AI grocery discovery evidence brief',
      publishedDate: '2026-01-01',
      content: 'Evidence content',
      url: 'https://example.com/doc',
      ingestionStatus: 'extracted',
      extractedSignalIds: [],
    }]);
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
      document: 'd-test-1',
      source: 'src-1',
      quote: 'This is a test quote',
      relevanceReason: 'Test relevance reason'
    } as any);
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
    
    await waitFor(() => {
      expect(screen.getByText('Approved Trends')).toBeInTheDocument();
      expect(screen.getAllByText('Testing Trend').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('trend-status')).toHaveTextContent('approved');
      expect(screen.getByText('Impact Timeline and Opportunity Matrix')).toBeInTheDocument();
    });

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(String(currentYear))).toBeInTheDocument();
    expect(screen.getByText(String(currentYear + 4))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /10 years/i }));
    expect(await screen.findByText(String(currentYear + 9))).toBeInTheDocument();
    const impactBubble = screen.getAllByLabelText(/testing trend projected impact/i)[0];
    expect(impactBubble).toHaveStyle({ background: '#38bdf8' });
    expect(impactBubble).not.toHaveStyle({ opacity: '0.65' });
    fireEvent.mouseEnter(impactBubble);
    const dialog = await screen.findByRole('dialog', { name: /testing trend/i });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveStyle({ zIndex: '10000' });
    expect(dialog).toHaveTextContent('Source');
    expect(dialog).toHaveTextContent('Retail Technology News');
    expect(dialog).toHaveTextContent('Retrieved');
    expect(dialog).toHaveTextContent('2026-02-03');
    expect(dialog).toHaveTextContent('Document');
    expect(dialog).toHaveTextContent('AI grocery discovery evidence brief');
    expect(dialog).toHaveTextContent('Snippet');
    expect(dialog).toHaveTextContent('This is a test quote');
    expect(dialog.querySelectorAll('em').length).toBeGreaterThanOrEqual(4);
    expect(dialog).not.toHaveTextContent('Unknown source');
    expect(dialog).not.toHaveTextContent('Unknown document');
    fireEvent.click(screen.getByRole('button', { name: /close reference details/i }));
    expect(screen.queryByRole('dialog', { name: /testing trend/i })).not.toBeInTheDocument();

    expect(getTrends().find(t => t.id === 't1')?.status).toBe('approved');
  });

  it('calculates per-trend market sizing from business inputs', async () => {
    render(<TrendReviewBoard />);
    const approveBtns = await screen.findAllByRole('button', { name: /approve/i });
    fireEvent.click(approveBtns[0]);

    const trendSizing = await screen.findByText('Size this trend');
    fireEvent.click(trendSizing);
    expect(await screen.findByText('Business inputs for Testing Trend')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Online grocery revenue'), { target: { value: '100000000' } });
    fireEvent.change(screen.getByLabelText('Search-to-cart conversion'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Recommendation-attributed sales'), { target: { value: '8000000' } });
    fireEvent.change(screen.getByLabelText('Substitution rate'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Churn rate'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Complaints / refunds'), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText('Retail media revenue'), { target: { value: '2000000' } });

    expect(await screen.findByText(/directional annual opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/Addressable base/i)).toBeInTheDocument();
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
