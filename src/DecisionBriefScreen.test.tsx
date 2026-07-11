import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DecisionBriefScreen from './DecisionBriefScreen';
import { repository } from './repository';
import * as decisionBriefEngine from './decisionBriefEngine';

vi.mock('./repository', () => ({
  repository: {
    getDecisionBriefs: vi.fn(),
    getStrategicContext: vi.fn(),
    getStrategicImplications: vi.fn(),
    getStrategicOptions: vi.fn(),
    getAssumptions: vi.fn(),
    getLeadingIndicators: vi.fn(),
    saveDecisionBrief: vi.fn(),
  },
}));

vi.mock('./decisionBriefEngine', () => ({
  generateDecisionBrief: vi.fn(),
}));

describe('DecisionBriefScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and then empty state if no briefs', async () => {
    // @ts-ignore
    repository.getDecisionBriefs.mockResolvedValue([]);

    await act(async () => {
      render(<DecisionBriefScreen />);
    });

    expect(screen.getByText('No decision brief yet')).toBeInTheDocument();
  });

  it('renders latest brief when available', async () => {
    // @ts-ignore
    repository.getDecisionBriefs.mockResolvedValue([
      {
        id: '1',
        headline: 'Test Headline',
        executiveSummary: 'Test Summary',
        topOpportunities: ['O1'],
        topThreats: ['T1'],
        recommendedOptions: ['Opt1'],
        assumptionsToTest: ['A1'],
        indicatorsToMonitor: ['I1'],
        evidenceIds: ['E1'],
        generatedAt: '2026-07-01T12:00:00Z',
      }
    ]);

    await act(async () => {
      render(<DecisionBriefScreen />);
    });

    expect(screen.getByText('Test Headline')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
    expect(screen.getByText('1', { selector: '.text-green-400' })).toBeInTheDocument(); // 1 Opportunity
  });

  it('handles Generate Brief button click', async () => {
    // @ts-ignore
    repository.getDecisionBriefs.mockResolvedValue([]);
    // @ts-ignore
    repository.getStrategicContext.mockResolvedValue({});
    // @ts-ignore
    repository.getStrategicImplications.mockResolvedValue([]);
    // @ts-ignore
    repository.getStrategicOptions.mockResolvedValue([]);
    // @ts-ignore
    repository.getAssumptions.mockResolvedValue([]);
    // @ts-ignore
    repository.getLeadingIndicators.mockResolvedValue([]);

    const mockGeneratedBrief = {
      id: '2',
      headline: 'New Headline',
      executiveSummary: 'New Summary',
      topOpportunities: [],
      topThreats: [],
      recommendedOptions: [],
      assumptionsToTest: [],
      indicatorsToMonitor: [],
      evidenceIds: [],
      generatedAt: '2026-07-02T12:00:00Z',
    };
    
    // @ts-ignore
    decisionBriefEngine.generateDecisionBrief.mockReturnValue(mockGeneratedBrief);

    await act(async () => {
      render(<DecisionBriefScreen />);
    });

    const btn = screen.getByRole('button', { name: /Generate Brief/i });
    
    // Setup refresh mock to return the new brief
    // @ts-ignore
    repository.getDecisionBriefs.mockResolvedValue([mockGeneratedBrief]);

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(decisionBriefEngine.generateDecisionBrief).toHaveBeenCalled();
    expect(repository.saveDecisionBrief).toHaveBeenCalledWith(mockGeneratedBrief);
    expect(screen.getByText('New Headline')).toBeInTheDocument();
  });
});
