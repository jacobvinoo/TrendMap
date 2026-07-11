import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScenariosScreen from './ScenariosScreen';
import { repository } from './repository';
import * as scenarioEngine from './scenarioEngine';

vi.mock('./repository', () => ({
  repository: {
    getScenarios: vi.fn(),
    getStrategicContext: vi.fn(),
    getStrategicImplications: vi.fn(),
    getAssumptions: vi.fn(),
    getLeadingIndicators: vi.fn(),
    saveScenarios: vi.fn(),
  },
}));

vi.mock('./scenarioEngine', () => ({
  generateScenarios: vi.fn(),
}));

describe('ScenariosScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state', async () => {
    // @ts-ignore
    repository.getScenarios.mockResolvedValue([]);

    await act(async () => {
      render(<ScenariosScreen />);
    });

    expect(screen.getByText('No scenarios yet')).toBeInTheDocument();
  });

  it('renders scenarios properly ordered', async () => {
    // @ts-ignore
    repository.getScenarios.mockResolvedValue([
      {
        id: '2', name: 'Base Scenario', scenarioType: 'base_case', summary: 'Base Summary',
        probabilityScore: 0.7, impactScore: 0.5, triggerConditions: ['C2'], earlyWarningIndicators: ['I2']
      },
      {
        id: '1', name: 'Upside Scenario', scenarioType: 'upside', summary: 'Upside Summary',
        probabilityScore: 0.2, impactScore: 0.8, triggerConditions: ['C1'], earlyWarningIndicators: []
      },
    ]);

    await act(async () => {
      render(<ScenariosScreen />);
    });

    // Should appear in ORDER: upside, base_case, downside, wildcard
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Upside Scenario');
    expect(headings[1]).toHaveTextContent('Base Scenario');

    expect(screen.getByText('70%')).toBeInTheDocument(); // Base case prob
    expect(screen.getByText('20%')).toBeInTheDocument(); // Upside prob
    expect(screen.getByText('Upside')).toBeInTheDocument();
  });

  it('handles Generate Scenarios button click', async () => {
    // @ts-ignore
    repository.getScenarios.mockResolvedValue([]);
    // @ts-ignore
    repository.getStrategicContext.mockResolvedValue({});
    // @ts-ignore
    repository.getStrategicImplications.mockResolvedValue([]);
    // @ts-ignore
    repository.getAssumptions.mockResolvedValue([]);
    // @ts-ignore
    repository.getLeadingIndicators.mockResolvedValue([]);

    const mockGenerated = [
      {
        id: '3', name: 'Generated Downside', scenarioType: 'downside', summary: 'Downside Summary',
        probabilityScore: 0.4, impactScore: 0.9, triggerConditions: ['C3'], earlyWarningIndicators: ['I3']
      }
    ];
    
    // @ts-ignore
    scenarioEngine.generateScenarios.mockReturnValue(mockGenerated);

    await act(async () => {
      render(<ScenariosScreen />);
    });

    const btn = screen.getByRole('button', { name: /Generate Scenarios/i });
    
    // Setup refresh mock
    // @ts-ignore
    repository.getScenarios.mockResolvedValue(mockGenerated);

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(scenarioEngine.generateScenarios).toHaveBeenCalled();
    expect(repository.saveScenarios).toHaveBeenCalledWith(mockGenerated);
    expect(screen.getByText('Generated Downside')).toBeInTheDocument();
    expect(screen.getByText('Downside Summary')).toBeInTheDocument();
  });
});
