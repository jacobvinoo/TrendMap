import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditTrailScreen from './AuditTrailScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getActiveWorkspace: vi.fn(),
    getAuditEvents: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

describe('AuditTrailScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.getActiveWorkspace.mockResolvedValue({
      id: 'ws-search',
      name: 'Search Workspace',
      currentUserRole: 'owner',
    });
    mockRepository.getAuditEvents.mockResolvedValue([
      {
        id: 'audit-source-1',
        action: 'source.status.approved',
        entity_type: 'source',
        entity_id: 'src-1',
        user_id: 'user-curator',
        details: JSON.stringify({
          workspaceId: 'ws-search',
          previousStatus: 'suggested',
          newStatus: 'approved',
        }),
        created_at: '2026-07-15T01:20:00Z',
      },
      {
        id: 'audit-clear-1',
        action: 'analysis_data.cleared',
        entity_type: 'workspace',
        entity_id: 'ws-search',
        user_id: 'user-owner',
        details: JSON.stringify({
          workspaceId: 'ws-search',
          deletedCounts: { documents: 2, signals: 5 },
        }),
        created_at: '2026-07-15T02:30:00Z',
      },
    ]);
  });

  it('shows workspace-scoped governed actions', async () => {
    render(<AuditTrailScreen />);

    expect(await screen.findByRole('heading', { name: /audit trail/i })).toBeInTheDocument();
    expect(screen.getByText(/active workspace:/i)).toBeInTheDocument();
    expect(screen.getByText('Search Workspace')).toBeInTheDocument();
    expect(screen.getByText('Source / Status / Approved')).toBeInTheDocument();
    expect(screen.getByText('Analysis data / Cleared')).toBeInTheDocument();
    expect(screen.getByText('Previous Status')).toBeInTheDocument();
    expect(screen.getByText('suggested')).toBeInTheDocument();
    expect(screen.getByText('Deleted Counts')).toBeInTheDocument();
    expect(screen.getByText('{"documents":2,"signals":5}')).toBeInTheDocument();
    expect(mockRepository.getAuditEvents).toHaveBeenCalledWith({ workspaceId: 'ws-search', entityType: undefined });
  });

  it('reloads events for the selected entity type', async () => {
    render(<AuditTrailScreen />);
    await screen.findByRole('heading', { name: /audit trail/i });

    fireEvent.change(screen.getByLabelText(/entity/i), { target: { value: 'trend' } });

    await waitFor(() => {
      expect(mockRepository.getAuditEvents).toHaveBeenLastCalledWith({ workspaceId: 'ws-search', entityType: 'trend' });
    });
  });

  it('filters visible events by search text', async () => {
    render(<AuditTrailScreen />);
    await screen.findByText('Source / Status / Approved');

    fireEvent.change(screen.getByPlaceholderText(/search by user/i), { target: { value: 'owner' } });

    expect(screen.queryByText('Source / Status / Approved')).not.toBeInTheDocument();
    expect(screen.getByText('Analysis data / Cleared')).toBeInTheDocument();
  });
});
