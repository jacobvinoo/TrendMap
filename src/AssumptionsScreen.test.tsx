import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let assumptions: any[] = [];
  return {
    ...actual,
    getAssumptions: vi.fn(() => [...assumptions]),
    saveAssumptions: vi.fn((a: any[]) => { assumptions = [...assumptions, ...a]; }),
    updateAssumption: vi.fn((id: string, patch: any) => {
      const idx = assumptions.findIndex(a => a.id === id);
      if (idx !== -1) assumptions[idx] = { ...assumptions[idx], ...patch };
    }),
    getTrends: vi.fn(() => [
      { id: 't1', name: 'AI-assisted grocery discovery', status: 'approved', confidenceScore: 0.8, impactScore: 0.9, momentumScore: 0.7, likelihoodScore: 0.75, horizon: 'short', maturityStage: 'emerging', summary: '', relatedSignalIds: [], drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [], createdAt: '', updatedAt: '' },
    ]),
    getStrategicContext: vi.fn(() => ({
      id: 'ctx1', companyName: 'Woolworths NZ', riskAppetite: 'medium',
      strategicGoals: ['Improve search'], businessModel: 'Online grocery',
      targetCustomers: ['Shoppers'], currentCapabilities: ['Search'],
      constraints: [], planningHorizons: ['12 months'], industryProfileId: 'ind-1',
    })),
    __setAssumptions: (a: any[]) => { assumptions = a; },
  };
});

const { __setAssumptions } = vi.mocked(await import('./mockRepository')) as any;

import AssumptionsScreen from './AssumptionsScreen';

const MOCK_ASSUMPTION = {
  id: 'assumption-t1-customer_behaviour',
  trendId: 't1',
  statement: 'Customers will adopt AI search',
  assumptionType: 'customer_behaviour',
  confidenceScore: 0.65,
  importanceScore: 0.8,
  status: 'untested',
  relatedSignalIds: ['sig1'],
  relatedIndicatorIds: [],
  evidenceSummary: 'Based on survey data',
};

describe('AssumptionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setAssumptions([]);
  });

  it('renders the Assumptions heading', () => {
    render(<AssumptionsScreen />);
    expect(screen.getByRole('heading', { name: /assumptions/i })).toBeInTheDocument();
  });

  it('shows empty state when no assumptions exist', () => {
    render(<AssumptionsScreen />);
    expect(screen.getByText(/no assumptions/i)).toBeInTheDocument();
  });

  it('shows a generate button', () => {
    render(<AssumptionsScreen />);
    expect(screen.getByRole('button', { name: /generate assumptions/i })).toBeInTheDocument();
  });

  it('renders a list of assumptions when they exist', () => {
    __setAssumptions([MOCK_ASSUMPTION]);
    render(<AssumptionsScreen />);
    expect(screen.getByText(/customers will adopt ai search/i)).toBeInTheDocument();
  });

  it('shows assumption type label', () => {
    __setAssumptions([MOCK_ASSUMPTION]);
    render(<AssumptionsScreen />);
    // The type label appears in both the card badge and the filter dropdown option
    const matches = screen.getAllByText(/customer behaviour/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows assumption status', () => {
    __setAssumptions([MOCK_ASSUMPTION]);
    render(<AssumptionsScreen />);
    expect(screen.getByText(/untested/i)).toBeInTheDocument();
  });

  it('user can mark an assumption as supported', async () => {
    __setAssumptions([MOCK_ASSUMPTION]);
    render(<AssumptionsScreen />);
    const supported = screen.getByRole('button', { name: /mark supported/i });
    fireEvent.click(supported);
    const { updateAssumption } = vi.mocked(await import('./mockRepository'));
    expect(updateAssumption).toHaveBeenCalledWith('assumption-t1-customer_behaviour', { status: 'supported' });
  });

  it('user can filter by assumption type', () => {
    __setAssumptions([
      MOCK_ASSUMPTION,
      { ...MOCK_ASSUMPTION, id: 'assumption-t1-economics', assumptionType: 'economics', statement: 'ROI will be positive' },
    ]);
    render(<AssumptionsScreen />);
    const filter = screen.getByRole('combobox', { name: /filter by type/i });
    fireEvent.change(filter, { target: { value: 'economics' } });
    expect(screen.getByText(/roi will be positive/i)).toBeInTheDocument();
    expect(screen.queryByText(/customers will adopt ai search/i)).not.toBeInTheDocument();
  });
});
