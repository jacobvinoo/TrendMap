import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StrategicActionsScreen from './StrategicActionsScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getTrends: vi.fn(),
    getStrategicOptions: vi.fn(),
    getRoadmapItems: vi.fn(),
    getEvidenceForTrend: vi.fn(),
    saveStrategicOptions: vi.fn(),
    updateStrategicOption: vi.fn(),
    saveRoadmapItems: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

const trend = {
  id: 'trend-ai-search',
  name: 'AI-assisted grocery discovery',
  summary: 'AI is changing grocery search.',
  status: 'approved' as const,
  horizon: '2027',
  likelihoodScore: 0.7,
  confidenceScore: 0.7,
  impactScore: 0.8,
  maturityStage: 'emerging',
  relatedSignalIds: [],
  drivers: ['Search conversion can improve.'],
  blockers: [],
  whatNeedsToBeTrue: ['Customers trust guided discovery.'],
  leadingIndicators: [],
  monitoringQuestions: [],
  recommendedActions: ['Run an AI search pilot.'],
  createdAt: '2026-07-01',
  updatedAt: '2026-07-01',
};

const option = {
  id: 'option-from-trend-ai-search',
  title: 'Pilot response to AI-assisted grocery discovery',
  description: 'Option',
  optionType: 'experiment' as const,
  linkedTrendIds: ['trend-ai-search'],
  linkedScenarioIds: [],
  linkedAssumptionIds: [],
  expectedBenefits: ['Customers trust guided discovery.'],
  keyRisks: [],
  requiredCapabilities: [],
  estimatedEffort: 'medium' as const,
  timeToValue: '6_months' as const,
  impactScore: 0.8,
  feasibilityScore: 0.8,
  urgencyScore: 0.8,
  confidenceScore: 0.7,
  priorityScore: 0.77,
  recommendedNextStep: 'Run an AI search pilot.',
  status: 'proposed' as const,
};

describe('StrategicActionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    mockRepository.getTrends.mockResolvedValue([trend]);
    mockRepository.getStrategicOptions.mockResolvedValue([]);
    mockRepository.getRoadmapItems.mockResolvedValue([]);
    mockRepository.getEvidenceForTrend.mockResolvedValue([{ id: 'ev-1' } as any]);
    mockRepository.saveStrategicOptions.mockResolvedValue(undefined);
    mockRepository.updateStrategicOption.mockResolvedValue(undefined);
    mockRepository.saveRoadmapItems.mockResolvedValue(undefined);
  });

  it('shows approved trends that need strategic options', async () => {
    render(<StrategicActionsScreen />);

    expect(await screen.findByRole('heading', { name: /strategic actions/i })).toBeInTheDocument();
    expect(screen.getByText('AI-assisted grocery discovery')).toBeInTheDocument();
    expect(screen.getByText('Needs option')).toBeInTheDocument();
    expect(screen.getByText('Evidence: 1')).toBeInTheDocument();
  });

  it('creates a strategic option for an approved trend', async () => {
    render(<StrategicActionsScreen />);
    await screen.findByText('Needs option');

    fireEvent.click(screen.getByRole('button', { name: /create option/i }));

    await waitFor(() => {
      expect(mockRepository.saveStrategicOptions).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'option-from-trend-ai-search',
          linkedTrendIds: ['trend-ai-search'],
        }),
      ]);
    });
  });

  it('accepts an existing option and creates a roadmap item', async () => {
    mockRepository.getStrategicOptions.mockResolvedValue([option]);

    render(<StrategicActionsScreen />);
    await screen.findByText('Option proposed');

    fireEvent.click(screen.getByRole('button', { name: /accept for roadmap/i }));

    await waitFor(() => {
      expect(mockRepository.updateStrategicOption).toHaveBeenCalledWith(option.id, { status: 'accepted' });
      expect(mockRepository.saveRoadmapItems).toHaveBeenCalledWith([
        expect.objectContaining({
          strategicOptionId: option.id,
          title: option.title,
        }),
      ]);
    });
  });

  it('links to roadmap and options pages', async () => {
    render(<StrategicActionsScreen />);
    await screen.findByRole('heading', { name: /strategic actions/i });

    fireEvent.click(screen.getByRole('button', { name: /open roadmap/i }));
    expect(window.location.hash).toBe('#roadmap');
  });
});
