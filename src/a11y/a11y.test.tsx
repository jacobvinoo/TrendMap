// @ts-nocheck
/**
 * Step 18 – Accessibility & usability validation
 *
 * Tests:
 * - Forms have labels
 * - Colour is not the only status indicator (status shown as text)
 * - Score labels have text values (not just visual bars)
 * - Empty states have descriptive copy
 * - Cards are keyboard navigable
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import SourceLibrary from '../SourceLibrary';
import TrendReviewBoard from '../TrendReviewBoard';
import SignalsScreen from '../SignalsScreen';
import { resetMockData } from '../mockRepository';

describe('Accessibility – forms have labels', () => {
  beforeEach(() => resetMockData());

  test('SourceLibrary note input has aria-label', () => {
    render(<SourceLibrary />);
    const inputs = screen.getAllByLabelText(/add-note-/i);
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('SignalsScreen PESTLE filter has label', () => {
    render(<SignalsScreen />);
    const select = screen.getByLabelText(/pestle category/i);
    expect(select).toBeInTheDocument();
  });

  test('SignalsScreen min-confidence input has label', () => {
    render(<SignalsScreen />);
    const input = screen.getByLabelText(/min confidence/i);
    expect(input).toBeInTheDocument();
  });
});

describe('Accessibility – status shown as text, not colour only', () => {
  beforeEach(() => resetMockData());

  test('SourceLibrary shows status as text ("suggested"/"approved"/"rejected")', () => {
    render(<SourceLibrary />);
    // Initial state should show 'suggested' for all seeded sources
    const statusTexts = screen.getAllByText(/suggested|approved|rejected/i);
    expect(statusTexts.length).toBeGreaterThan(0);
  });

  test('TrendReviewBoard shows trend status as text via status-text span', async () => {

    const { saveTrends, saveSignals, addEvidence } = await import('../mockRepository');
    saveTrends([{ 
      id: 't1', name: 'Test Trend', summary: 'Summary', status: 'candidate',
      horizon: '12-24 months', likelihoodScore: 0.7, confidenceScore: 0.8,
      impactScore: 0.6, maturityStage: 'emerging', relatedSignalIds: ['s1'],
      drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [],
      monitoringQuestions: [], recommendedActions: [],
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }]);
    saveSignals([{
      id: 's1', documentId: 'doc-1', sourceId: 'src-1',
      title: 'S1', summary: '', signalType: 'AI-assisted shopping',
      pestleCategory: 'Technology', noveltyScore: 0.8,
      strengthScore: 0.8, confidenceScore: 0.8,
      evidenceDate: '2026-01-01', tags: [],
    }]);
    addEvidence({ id: 'ev1', trendId: 't1', signalId: 's1', documentId: 'doc-1', sourceId: 'src-1', quote: 'q', relevanceReason: 'r' });
    render(<TrendReviewBoard />);
    const statusEl = await screen.findByLabelText('trend-status');
    expect(statusEl).toHaveTextContent('candidate');
  });
});

describe('Accessibility – score labels have text values', () => {
  beforeEach(() => resetMockData());

  test('SourceLibrary renders credibility as a percentage string', () => {
    render(<SourceLibrary />);
    const credSpan = screen.getAllByTestId(/^credibility-/)[0];
    expect(credSpan.textContent).toMatch(/\d+%/);
  });
});

describe('Accessibility – empty states are descriptive', () => {
  beforeEach(() => resetMockData());

  test('SignalsScreen shows descriptive empty state text', () => {
    render(<SignalsScreen />);
    expect(screen.getByText(/no signals extracted yet/i)).toBeInTheDocument();
  });

  test('TrendReviewBoard shows descriptive empty state text', async () => {
    render(<TrendReviewBoard />);
    expect(await screen.findByText(/no candidate trends to review/i)).toBeInTheDocument();
  });
});

describe('Accessibility – cards are keyboard navigable', () => {
  beforeEach(() => resetMockData());


  test('TrendReviewBoard cards have tabIndex=0', async () => {
    const { saveTrends, saveSignals, addEvidence } = await import('../mockRepository');
    saveTrends([{ 
      id: 't2', name: 'Keyboard Trend', summary: 'Summary', status: 'candidate',
      horizon: '12-24 months', likelihoodScore: 0.7, confidenceScore: 0.8,
      impactScore: 0.6, maturityStage: 'emerging', relatedSignalIds: ['s2'],
      drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [],
      monitoringQuestions: [], recommendedActions: [],
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }]);
    saveSignals([{
      id: 's2', documentId: 'doc-1', sourceId: 'src-1',
      title: 'S2', summary: '', signalType: 'AI-assisted shopping',
      pestleCategory: 'Technology', noveltyScore: 0.8,
      strengthScore: 0.8, confidenceScore: 0.8,
      evidenceDate: '2026-01-01', tags: [],
    }]);
    addEvidence({ id: 'ev2', trendId: 't2', signalId: 's2', documentId: 'doc-1', sourceId: 'src-1', quote: 'q', relevanceReason: 'r' });
    render(<TrendReviewBoard />);
    const card = await screen.findByTestId('trend-card');
    expect(card).toHaveAttribute('tabindex', '0');
  });


  test('Enter key on TrendReviewBoard card opens detail panel', async () => {
    const { saveTrends, saveSignals, addEvidence } = await import('../mockRepository');
    saveTrends([{ 
      id: 't3', name: 'Enter Key Trend', summary: 'Summary', status: 'candidate',
      horizon: '12-24 months', likelihoodScore: 0.7, confidenceScore: 0.8,
      impactScore: 0.6, maturityStage: 'emerging', relatedSignalIds: ['s3'],
      drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [],
      monitoringQuestions: [], recommendedActions: [],
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }]);
    saveSignals([{
      id: 's3', documentId: 'doc-1', sourceId: 'src-1',
      title: 'S3', summary: '', signalType: 'AI-assisted shopping',
      pestleCategory: 'Technology', noveltyScore: 0.8,
      strengthScore: 0.8, confidenceScore: 0.8,
      evidenceDate: '2026-01-01', tags: [],
    }]);
    addEvidence({ id: 'ev3', trendId: 't3', signalId: 's3', documentId: 'doc-1', sourceId: 'src-1', quote: 'q', relevanceReason: 'r' });
    render(<TrendReviewBoard />);
    const card = await screen.findByTestId('trend-card');
    const user = userEvent.setup();
    await user.type(card, '{Enter}');
    // Detail panel heading should appear
    expect(screen.getByRole('heading', { name: /enter key trend/i })).toBeInTheDocument();
  });
});
