// @ts-nocheck

import { vi, describe, it, expect, beforeEach } from 'vitest'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonitoringDashboard from './MonitoringDashboard';
import type { MonitoringRule } from './types'; 



vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  let mockRules: MonitoringRule[] = [];
  let mockSummaries: any[] = [];
  let mockRuns: any[] = [];
  return {
    ...actual,
    repository: {
      ...actual.repository,
      runMonitoringRule: vi.fn(async (ruleId: string) => { 
        return { id: 'run-1', status: 'completed' };
      }),
      getMonitoringRules: vi.fn(() => [...mockRules]),
      getWhatChangedSummaries: vi.fn(() => [...mockSummaries]),
      getMonitoringRuns: vi.fn(() => [...mockRuns]),
    },
    setMockRules: (rules: MonitoringRule[]) => { mockRules = rules; },
    setMockSummaries: (summaries: any[]) => { mockSummaries = summaries; },
    setMockRuns: (runs: any[]) => { mockRuns = runs; },
  };
});

const { setMockRules, setMockSummaries, setMockRuns, repository } = vi.mocked(await import('./repository')) as any;

describe('Monitoring Dashboard UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockRules([]);
    setMockSummaries([]);
    setMockRuns([]);
  });

  it('renders empty state when no active rules', async () => {
    render(<MonitoringDashboard />);
    expect(await screen.findByText(/No active monitoring rules/i)).toBeInTheDocument();
  });

  it('renders active rules and allows running a manual scan', async () => {
    setMockRules([
      { id: 'r1', sourceId: 'src1', industryProfileId: 'ind1', enabled: true, frequency: 'weekly', keywords: [], includePatterns: [], excludePatterns: [], createdAt: '', updatedAt: '' }
    ]);
    
    render(<MonitoringDashboard />);
    expect(await screen.findByText(/Active Rule for Source: src1/i)).toBeInTheDocument();

    const runBtn = screen.getByRole('button', { name: /Run Monitoring Now/i });
    fireEvent.click(runBtn);

    expect(repository.runMonitoringRule).toHaveBeenCalledWith('r1', 'new_activity');

    await waitFor(() => {
      // It should display a running state or completion (our mock returns immediately)
      expect(repository.runMonitoringRule).toHaveBeenCalled();
    });
  });

  it('displays the latest What Changed Summary', async () => {
    setMockSummaries([
      { id: 'sum1', monitoringRunId: 'run1', generatedAt: '2026-01-01', headline: 'Found 2 new signals', newSignals: [], changedTrends: [], newCandidateTrends: [], alerts: [], recommendedActions: ['Review trend X'] }
    ]);

    render(<MonitoringDashboard />);
    expect(await screen.findByText('Found 2 new signals')).toBeInTheDocument();
    expect(await screen.findByText('Review trend X')).toBeInTheDocument();
  });

  it('correctly tracks failed runs and explicitly displays them as red', async () => {
    const failedTime = new Date('2026-02-01T12:00:00Z').toISOString();
    setMockRuns([
      { id: 'run-fail', status: 'failed', startedAt: failedTime }
    ]);

    render(<MonitoringDashboard />);
    
    // System health should be 'failed' and explicitly styled red
    const healthStatus = await screen.findByText('failed');
    expect(healthStatus).toBeInTheDocument();
    expect(healthStatus.className).toContain('text-red-400');
    
    // The "Last Run" tile should fallback correctly to startedAt when completedAt isn't available
    const timeString = new Date(failedTime).toLocaleTimeString();
    expect(await screen.findByText(timeString)).toBeInTheDocument();
  });
});
