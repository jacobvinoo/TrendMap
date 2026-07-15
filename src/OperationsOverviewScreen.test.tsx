import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OperationsOverviewScreen from './OperationsOverviewScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getWorkspaceReadiness: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

describe('OperationsOverviewScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    mockRepository.getWorkspaceReadiness.mockResolvedValue({
      workspaceId: 'ws-search',
      workspaceName: 'Search Workspace',
      status: 'needs_review',
      headline: 'Workspace has review decisions waiting.',
      recommendedRoute: 'findings',
      recommendedActionLabel: 'Review findings',
      counts: {
        approvedThemes: 2,
        candidateThemes: 1,
        approvedSources: 4,
        suggestedSources: 1,
        documents: 3,
        extractedDocuments: 2,
        signals: 8,
        candidateTrends: 2,
        approvedTrends: 1,
        newFindings: 5,
        alerts: 0,
        monitoringRules: 1,
        workspaceMembers: 2,
      },
      items: [
        {
          id: 'findings',
          label: 'New findings queue',
          state: 'attention',
          detail: '5 findings need review.',
          route: 'findings',
          actionLabel: 'Review findings',
        },
        {
          id: 'sources',
          label: 'Source coverage',
          state: 'complete',
          detail: '4 approved sources.',
          route: 'sources',
          actionLabel: 'Review sources',
        },
      ],
    });
  });

  it('shows readiness, counts, and checklist items', async () => {
    render(<OperationsOverviewScreen />);

    expect(await screen.findByRole('heading', { name: /operations overview/i })).toBeInTheDocument();
    expect(screen.getByText('Search Workspace')).toBeInTheDocument();
    expect(screen.getByText('Workspace has review decisions waiting.')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('New findings queue')).toBeInTheDocument();
    expect(screen.getByText('Source coverage')).toBeInTheDocument();
  });

  it('sends the user to the recommended next step', async () => {
    render(<OperationsOverviewScreen />);
    await screen.findByText('Workspace has review decisions waiting.');

    fireEvent.click(screen.getAllByRole('button', { name: /review findings/i })[0]);

    expect(window.location.hash).toBe('#findings');
  });
});
