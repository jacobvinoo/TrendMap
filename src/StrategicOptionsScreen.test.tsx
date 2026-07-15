import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  let options: any[] = [];
  let roadmapItems: any[] = [];
  const repository = {
    getStrategicOptions: vi.fn(async () => [...options]),
    updateStrategicOption: vi.fn(async (id: string, patch: any) => {
      const index = options.findIndex((option) => option.id === id);
      if (index >= 0) options[index] = { ...options[index], ...patch };
    }),
    getRoadmapItems: vi.fn(async () => [...roadmapItems]),
    saveRoadmapItems: vi.fn(async (items: any[]) => {
      roadmapItems = [...roadmapItems, ...items];
    }),
    getStrategicContext: vi.fn(async () => null),
    getStrategicImplications: vi.fn(async () => []),
    getScenarios: vi.fn(async () => []),
    getAssumptions: vi.fn(async () => []),
    saveStrategicOptions: vi.fn(async (incoming: any[]) => {
      options = [...options, ...incoming];
    }),
  };
  return {
    ...actual,
    repository,
    __set: (nextOptions: any[], nextRoadmapItems: any[] = []) => {
      options = nextOptions;
      roadmapItems = nextRoadmapItems;
    },
    __getRoadmapItems: () => roadmapItems,
  };
});

const repoModule = vi.mocked(await import('./repository')) as any;
const { __set, __getRoadmapItems } = repoModule;

import StrategicOptionsScreen from './StrategicOptionsScreen';

const PROPOSED_OPTION = {
  id: 'option-ai-search',
  title: 'Pilot AI search',
  description: 'Run a bounded AI search experiment',
  optionType: 'experiment',
  linkedTrendIds: ['trend-ai-search'],
  linkedScenarioIds: [],
  linkedAssumptionIds: [],
  expectedBenefits: ['Improve search-to-cart conversion'],
  keyRisks: ['Product data quality'],
  requiredCapabilities: ['Search analytics'],
  estimatedEffort: 'medium',
  timeToValue: '3_months',
  impactScore: 0.88,
  feasibilityScore: 0.72,
  urgencyScore: 0.81,
  confidenceScore: 0.76,
  priorityScore: 0.8,
  recommendedNextStep: 'Define pilot scope',
  status: 'proposed',
};

describe('StrategicOptionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __set([]);
  });

  it('accepts a proposed option and creates one roadmap item for it', async () => {
    __set([PROPOSED_OPTION]);

    render(<StrategicOptionsScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /accept for roadmap/i }));

    await waitFor(() => {
      expect(repoModule.repository.updateStrategicOption).toHaveBeenCalledWith('option-ai-search', { status: 'accepted' });
      expect(repoModule.repository.saveRoadmapItems).toHaveBeenCalledTimes(1);
      expect(__getRoadmapItems()[0]).toMatchObject({
        id: 'roadmap-option-ai-search',
        strategicOptionId: 'option-ai-search',
        title: 'Pilot AI search',
        horizon: 'now',
        status: 'proposed',
      });
      expect(screen.getByText(/added to roadmap/i)).toBeInTheDocument();
    });
  });

  it('does not create duplicate roadmap items when accepting an option twice', async () => {
    __set([PROPOSED_OPTION], [{
      id: 'roadmap-option-ai-search',
      strategicOptionId: 'option-ai-search',
      title: 'Pilot AI search',
      horizon: 'now',
      owner: '',
      status: 'proposed',
      successMetric: 'Validate: Improve search-to-cart conversion',
      linkedIndicatorIds: [],
    }]);

    render(<StrategicOptionsScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /accept for roadmap/i }));

    await waitFor(() => {
      expect(repoModule.repository.saveRoadmapItems).not.toHaveBeenCalled();
      expect(screen.getByText(/already on the roadmap/i)).toBeInTheDocument();
    });
  });
});
