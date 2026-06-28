import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let items: any[] = [];
  let options: any[] = [];
  return {
    ...actual,
    getRoadmapItems: vi.fn(() => [...items]),
    saveRoadmapItems: vi.fn((r: any[]) => { items = [...items, ...r]; }),
    updateRoadmapItem: vi.fn((id: string, patch: any) => {
      const idx = items.findIndex((r: any) => r.id === id);
      if (idx !== -1) items[idx] = { ...items[idx], ...patch };
    }),
    getStrategicOptions: vi.fn(() => [...options]),
    __set: (i: any[], o: any[]) => { items = i; options = o; },
  };
});

const { __set } = vi.mocked(await import('./mockRepository')) as any;

import RoadmapScreen from './RoadmapScreen';

const MOCK_OPTION = {
  id: 'opt-1', title: 'Pilot AI search', description: 'Run experiment',
  optionType: 'experiment', linkedTrendIds: ['t1'], linkedScenarioIds: [],
  linkedAssumptionIds: [], expectedBenefits: ['Better conversion'],
  keyRisks: [], requiredCapabilities: [], estimatedEffort: 'medium',
  timeToValue: '3_months', impactScore: 0.9, feasibilityScore: 0.7,
  urgencyScore: 0.8, confidenceScore: 0.75, priorityScore: 0.82,
  recommendedNextStep: 'Define pilot scope', status: 'accepted',
};

const MOCK_ITEM = {
  id: 'roadmap-opt-1', strategicOptionId: 'opt-1', title: 'Pilot AI search',
  horizon: 'now', owner: '', status: 'proposed',
  successMetric: 'Validate: Better conversion', linkedIndicatorIds: [],
};

describe('RoadmapScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __set([], []);
  });

  it('renders the Strategic Roadmap heading', () => {
    render(<RoadmapScreen />);
    expect(screen.getByRole('heading', { name: /strategic roadmap/i })).toBeInTheDocument();
  });

  it('shows empty state when no roadmap items exist', () => {
    render(<RoadmapScreen />);
    expect(screen.getByText(/no roadmap items/i)).toBeInTheDocument();
  });

  it('shows a generate button', () => {
    render(<RoadmapScreen />);
    expect(screen.getByRole('button', { name: /generate roadmap/i })).toBeInTheDocument();
  });

  it('renders roadmap items when they exist', () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect(screen.getByText(/pilot ai search/i)).toBeInTheDocument();
  });

  it('shows the Now horizon column', () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect(screen.getByText(/now/i)).toBeInTheDocument();
  });

  it('shows the success metric for each item', () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect(screen.getByText(/validate: better conversion/i)).toBeInTheDocument();
  });

  it('user can update item status to in_progress', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    const select = screen.getByRole('combobox', { name: /status for roadmap-opt-1/i });
    fireEvent.change(select, { target: { value: 'in_progress' } });
    const { updateRoadmapItem } = vi.mocked(await import('./mockRepository'));
    expect(updateRoadmapItem).toHaveBeenCalledWith('roadmap-opt-1', { status: 'in_progress' });
  });

  it('shows Next and Later horizon columns', () => {
    const nextItem = { ...MOCK_ITEM, id: 'roadmap-opt-2', horizon: 'next', title: 'Defend retail' };
    const laterItem = { ...MOCK_ITEM, id: 'roadmap-opt-3', horizon: 'later', title: 'Quantum pilot' };
    __set([MOCK_ITEM, nextItem, laterItem], []);
    render(<RoadmapScreen />);
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText(/later/i)).toBeInTheDocument();
  });
});
