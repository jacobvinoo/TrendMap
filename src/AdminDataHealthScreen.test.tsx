import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDataHealthScreen from './AdminDataHealthScreen';
import { repository } from './repository';

// Mock repository
vi.mock('./repository', () => ({
  repository: {
    getActiveWorkspace: vi.fn(),
    runDataHealthCheck: vi.fn(),
    clearAnalysisData: vi.fn(),
  },
}));

describe('AdminDataHealthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    repository.getActiveWorkspace.mockResolvedValue({
      id: 'workspace-default',
      name: 'Company-wide Trends',
      currentUserRole: 'owner',
    });
  });

  it('renders loading state initially and fetches health summary', async () => {
    const mockSummary = {
      status: 'healthy',
      latestChecks: [
        { id: '1', component: 'Database Connection', status: 'pass', latencyMs: 15, timestamp: new Date().toISOString() },
        { id: '2', component: 'Cache Layer', status: 'pass', latencyMs: 2, timestamp: new Date().toISOString() },
      ],
      issues: []
    };
    
    // @ts-ignore
    repository.runDataHealthCheck.mockResolvedValue(mockSummary);

    await act(async () => {
      render(<AdminDataHealthScreen />);
    });

    expect(repository.runDataHealthCheck).toHaveBeenCalledTimes(1);
    
    // Check if the status is rendered
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('Database Connection')).toBeInTheDocument();
    expect(screen.getByText('Cache Layer')).toBeInTheDocument();
  });

  it('handles error or unhealthy state gracefully', async () => {
    const mockSummary = {
      status: 'unhealthy',
      latestChecks: [
        { id: '1', component: 'Database Connection', status: 'fail', error: 'Connection timeout', timestamp: new Date().toISOString() },
      ],
      issues: [
        { entityType: 'system', entityId: 'db', severity: 'high', message: 'Connection timeout' }
      ]
    };
    
    // @ts-ignore
    repository.runDataHealthCheck.mockResolvedValue(mockSummary);

    await act(async () => {
      render(<AdminDataHealthScreen />);
    });

    expect(screen.getByText('unhealthy')).toBeInTheDocument();
    expect(screen.getByText('Database Connection')).toBeInTheDocument();
    expect(screen.getByText('Connection timeout')).toBeInTheDocument();
  });

  it('re-runs check when button is clicked', async () => {
    const mockSummary = {
      status: 'healthy',
      latestChecks: [],
      issues: [],
      latestChecks: []
    };
    
    // @ts-ignore
    repository.runDataHealthCheck.mockResolvedValue(mockSummary);

    await act(async () => {
      render(<AdminDataHealthScreen />);
    });

    expect(repository.runDataHealthCheck).toHaveBeenCalledTimes(1);

    const runCheckButton = screen.getByRole('button', { name: /Run Check/i });
    
    await act(async () => {
      fireEvent.click(runCheckButton);
    });

    expect(repository.runDataHealthCheck).toHaveBeenCalledTimes(2);
  });

  it('clears generated data after confirmation', async () => {
    const mockSummary = {
      status: 'healthy',
      checksRun: 1,
      issueCount: 0,
      latestChecks: [],
      issues: []
    };

    // @ts-ignore
    repository.runDataHealthCheck.mockResolvedValue(mockSummary);
    // @ts-ignore
    repository.clearAnalysisData.mockResolvedValue({
      status: 'cleared',
      deletedCounts: { documents: 2, signals: 3, trends: 1, evidence_links: 4 },
      message: 'Generated analysis data was cleared.'
    });

    await act(async () => {
      render(<AdminDataHealthScreen />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /clear generated data/i }));
    });

    expect(repository.clearAnalysisData).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /confirm clear/i })).toBeInTheDocument();
    expect(screen.getByText(/remove generated documents, signals, trends, evidence, and insights for the active workspace/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm clear/i }));
    });

    expect(repository.clearAnalysisData).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Removed 10 generated rows/i)).toBeInTheDocument();
  });

  it('disables generated data clearing for non-admin workspace roles', async () => {
    const mockSummary = {
      status: 'healthy',
      checksRun: 1,
      issueCount: 0,
      latestChecks: [],
      issues: []
    };
    // @ts-ignore
    repository.getActiveWorkspace.mockResolvedValue({
      id: 'ws-search',
      name: 'Search',
      currentUserRole: 'analyst',
    });
    // @ts-ignore
    repository.runDataHealthCheck.mockResolvedValue(mockSummary);

    await act(async () => {
      render(<AdminDataHealthScreen />);
    });

    expect(screen.getByRole('button', { name: /clear generated data/i })).toBeDisabled();
    expect(screen.getByText(/Only workspace owners or admins can clear generated data/i)).toBeInTheDocument();
    expect(repository.clearAnalysisData).not.toHaveBeenCalled();
  });
});
