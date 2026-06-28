import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let assumptions: any[] = [];
  let indicators: any[] = [];
  return {
    ...actual,
    getAssumptions: vi.fn(() => [...assumptions]),
    getLeadingIndicators: vi.fn(() => [...indicators]),
    updateLeadingIndicator: vi.fn((id: string, patch: any) => {
      const idx = indicators.findIndex((li: any) => li.id === id);
      if (idx !== -1) indicators[idx] = { ...indicators[idx], ...patch };
    }),
    __set: (a: any[], li: any[]) => { assumptions = a; indicators = li; },
  };
});

const { __set } = vi.mocked(await import('./mockRepository')) as any;

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

  it('renders the monitoring panel heading', () => {
    render(<AssumptionMonitorPanel />);
    expect(screen.getByRole('heading', { name: /assumption monitoring/i })).toBeInTheDocument();
  });

  it('shows empty state when no indicators', () => {
    render(<AssumptionMonitorPanel />);
    expect(screen.getByText(/no indicators/i)).toBeInTheDocument();
  });

  it('renders an indicator card with its monitoring question', () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    expect(screen.getByText(/how many retailers/i)).toBeInTheDocument();
  });

  it('shows the indicator threshold', () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    expect(screen.getByText(/3\+ retailers/i)).toBeInTheDocument();
  });

  it('shows the current status badge', () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    const matches = screen.getAllByText(/not started/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('user can update indicator status to emerging', async () => {
    __set([MOCK_ASSUMPTION], [MOCK_INDICATOR]);
    render(<AssumptionMonitorPanel />);
    const select = screen.getByRole('combobox', { name: /update status for li1/i });
    fireEvent.change(select, { target: { value: 'emerging' } });
    const { updateLeadingIndicator } = vi.mocked(await import('./mockRepository'));
    expect(updateLeadingIndicator).toHaveBeenCalledWith('li1', { currentStatus: 'emerging' });
  });
});
