import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  let items: any[] = [];
  let options: any[] = [];
  return {
    ...actual,
    repository: {
    getRoadmapItems: vi.fn(() => [...items]),
    saveRoadmapItems: vi.fn((r: any[]) => { items = [...items, ...r]; }),
    updateRoadmapItem: vi.fn((id: string, patch: any) => {
      const idx = items.findIndex((r: any) => r.id === id);
      if (idx !== -1) items[idx] = { ...items[idx], ...patch };
    }),
    getStrategicOptions: vi.fn(() => [...options]),
  },
    __set: (i: any[], o: any[]) => { items = i; options = o; },
  };
});

const { __set } = vi.mocked(await import('./repository')) as any;

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
  targetDate: '', progressPercent: 0, progressNote: '',
};

const TRACKED_ITEM = {
  ...MOCK_ITEM,
  owner: 'Search Product Lead',
  targetDate: '2026-07-01',
  progressPercent: 25,
  progressNote: 'Behind plan',
};

describe('RoadmapScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __set([], []);
  });

  it('renders the Strategic Roadmap heading', async () => {
    render(<RoadmapScreen />);
    expect(await screen.findByRole('heading', { name: /strategic roadmap/i })).toBeInTheDocument();
  });

  it('shows empty state when no roadmap items exist', async () => {
    render(<RoadmapScreen />);
    expect(await screen.findByText(/no roadmap items/i)).toBeInTheDocument();
  });

  it('shows a generate button', async () => {
    render(<RoadmapScreen />);
    expect(await screen.findByRole('button', { name: /generate roadmap/i })).toBeInTheDocument();
  });

  it('only generates roadmap items from accepted options', async () => {
    const proposed = { ...MOCK_OPTION, id: 'opt-proposed', title: 'Proposed option', status: 'proposed' };
    __set([], [MOCK_OPTION, proposed]);

    render(<RoadmapScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /generate roadmap/i }));

    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    expect(mockRepoObj.saveRoadmapItems).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'roadmap-opt-1',
        strategicOptionId: 'opt-1',
        title: 'Pilot AI search',
      }),
    ]);
  });

  it('explains that options must be accepted before roadmap generation', async () => {
    const proposed = { ...MOCK_OPTION, id: 'opt-proposed', title: 'Proposed option', status: 'proposed' };
    __set([], [proposed]);

    render(<RoadmapScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /generate roadmap/i }));

    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    expect(mockRepoObj.saveRoadmapItems).not.toHaveBeenCalled();
    expect(await screen.findByText(/accept strategic options before generating roadmap/i)).toBeInTheDocument();
  });

  it("renders roadmap items when they exist", async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect((await screen.findAllByText(/pilot ai search/i)).length).toBeGreaterThan(0);
  });

  it('shows the Now horizon column', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect(await screen.findByText(/now/i)).toBeInTheDocument();
  });

  it('shows the success metric for each item', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    expect(await screen.findByText(/validate: better conversion/i)).toBeInTheDocument();
  });

  it('shows readiness gaps when roadmap execution details are missing', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);

    expect(await screen.findByText(/needs owner and target date/i)).toBeInTheDocument();
  });

  it('shows execution health and attention items for operating review', async () => {
    const blocked = {
      ...TRACKED_ITEM,
      id: 'roadmap-blocked',
      title: 'Blocked supplier pilot',
      status: 'blocked',
      targetDate: '2026-08-15',
      progressPercent: 10,
    };
    const dueSoon = {
      ...TRACKED_ITEM,
      id: 'roadmap-soon',
      title: 'Due soon launch',
      targetDate: '2026-07-30',
      progressPercent: 50,
    };
    __set([TRACKED_ITEM, blocked, dueSoon], [MOCK_OPTION]);

    render(<RoadmapScreen />);

    expect(await screen.findByText(/execution health/i)).toBeInTheDocument();
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/blocked/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/due next 30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/needs attention/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pilot ai search/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/blocked supplier pilot/i).length).toBeGreaterThan(0);
  });

  it('lets users mark roadmap items as blocked or completed', async () => {
    __set([TRACKED_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);

    const select = await screen.findByRole('combobox', { name: /status for roadmap-opt-1/i });
    expect(screen.getByRole('option', { name: /blocked/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /completed/i })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'blocked' } });

    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    expect(mockRepoObj.updateRoadmapItem).toHaveBeenCalledWith('roadmap-opt-1', { status: 'blocked' });
  });

  it('saves owner, target date, progress, and progress note for a roadmap item', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);

    fireEvent.change(await screen.findByLabelText(/owner for roadmap-opt-1/i), { target: { value: 'Search Product Lead' } });
    fireEvent.change(screen.getByLabelText(/target date for roadmap-opt-1/i), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText(/progress percent for roadmap-opt-1/i), { target: { value: '35' } });
    fireEvent.change(screen.getByLabelText(/progress note for roadmap-opt-1/i), { target: { value: 'Pilot scope agreed with merchandising.' } });
    fireEvent.click(screen.getByRole('button', { name: /save execution details for roadmap-opt-1/i }));

    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    await waitFor(() => {
      expect(mockRepoObj.updateRoadmapItem).toHaveBeenCalledWith('roadmap-opt-1', {
        owner: 'Search Product Lead',
        targetDate: '2026-09-30',
        progressPercent: 35,
        progressNote: 'Pilot scope agreed with merchandising.',
        lastReviewedAt: expect.any(String),
      });
      expect(screen.getByText(/execution details saved/i)).toBeInTheDocument();
    });
  });

  it('user can update item status to in_progress', async () => {
    __set([MOCK_ITEM], [MOCK_OPTION]);
    render(<RoadmapScreen />);
    const select = await screen.findByRole('combobox', { name: /status for roadmap-opt-1/i });
    fireEvent.change(select, { target: { value: 'in_progress' } });
    const { repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
    expect(mockRepoObj.updateRoadmapItem).toHaveBeenCalledWith('roadmap-opt-1', { status: 'in_progress' });
  });

  it('shows Next and Later horizon columns', async () => {
    const nextItem = { ...MOCK_ITEM, id: 'roadmap-opt-2', horizon: 'next', title: 'Defend retail' };
    const laterItem = { ...MOCK_ITEM, id: 'roadmap-opt-3', horizon: 'later', title: 'Quantum pilot' };
    __set([MOCK_ITEM, nextItem, laterItem], []);
    render(<RoadmapScreen />);
    expect(await screen.findByText(/^Next$/i)).toBeInTheDocument();
    expect(await screen.findByText(/^Later$/i)).toBeInTheDocument();
  });
});
