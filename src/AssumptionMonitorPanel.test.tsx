import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  let assumptions: any[] = [];
  let indicators: any[] = [];
  return {
    ...actual,
    repository: {
      getAssumptions: vi.fn(() => [...assumptions]),
      getLeadingIndicators: vi.fn(() => [...indicators]),
      updateLeadingIndicator: vi.fn((id: string, patch: any) => {
        const idx = indicators.findIndex((li: any) => li.id === id);
        if (idx !== -1) indicators[idx] = { ...indicators[idx], ...patch };
      }),
    },
    __set: (a: any[], li: any[]) => { assumptions = a; indicators = li; },
  };
});

const { __set } = vi.mocked(await import('./repository')) as any;

import AssumptionMonitorPanel from './AssumptionMonitorPanel';

const MOCK_ASSUMPTION = {
  id: 'a1', trendId: 't1', statement: 'Customers will adopt AI search',
  assumptionType: 'customer_behaviour', confidenceScore: 0.65,
  importanceScore: 0.8, status: 'untested', relatedSignalIds: [],
  relatedIndicatorIds: [], evidenceSummary: '',
};

const MOCK_INDICATOR = {
  id: 'li1', assumptionId: 'a1', name: 'AI search adoption rate',
  description: 'How many retailers deploy AI search', indicatorType: 'customer',
  currentStatus: 'not_started', threshold: '3+ retailers',
  monitoringQuestion: 'How many retailers?', relatedSourceIds: [],
};

describe('AssumptionMonitorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __set([], []);
  });

  it('renders the monitoring panel heading', async () => {
    render(<AssumptionMonitorPanel />);
    expect(await screen.findByRole('heading', { name: /assumption monitoring/i })).toBeInTheDocument();
  });

  it('shows empty state when no indicators', async () => {
    render(<AssumptionMonitorPanel />);
    expect(await screen.findByText(/no indicators/i)).toBeInTheDocument();
  });

  it('renders an indicator card with its monitoring question', async () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    expect(await screen.findByText(/how many retailers/i)).toBeInTheDocument();
  });

  it('shows the indicator threshold', async () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    expect(await screen.findByText(/3\+ retailers/i)).toBeInTheDocument();
  });

  it('shows the current status badge', async () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    const matches = await screen.findAllByText(/not started/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('user can update indicator status to emerging', async () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    const select = await screen.findByRole('combobox', { name: /update status for li1/i });
    fireEvent.change(select, { target: { value: 'emerging' } });
    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    expect(mockRepoObj.updateLeadingIndicator).toHaveBeenCalledWith('li1', { currentStatus: 'emerging' });
  });
});
