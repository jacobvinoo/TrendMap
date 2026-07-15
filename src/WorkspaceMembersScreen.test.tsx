import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkspaceMembersScreen from './WorkspaceMembersScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getActiveWorkspace: vi.fn(),
    getWorkspaceMembers: vi.fn(),
    upsertWorkspaceMember: vi.fn(),
    removeWorkspaceMember: vi.fn(),
  },
}));

const mockRepository = vi.mocked(repository);

describe('WorkspaceMembersScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.getActiveWorkspace.mockResolvedValue({
      id: 'ws-search',
      name: 'Search Workspace',
      currentUserRole: 'owner',
    });
    mockRepository.getWorkspaceMembers.mockResolvedValue([
      { id: 'mem-owner', workspaceId: 'ws-search', userId: 'user-owner', role: 'owner' },
      { id: 'mem-analyst', workspaceId: 'ws-search', userId: 'user-analyst', role: 'analyst' },
    ]);
    mockRepository.upsertWorkspaceMember.mockResolvedValue({
      id: 'mem-new',
      workspaceId: 'ws-search',
      userId: 'user-strategist',
      role: 'strategist',
    });
    mockRepository.removeWorkspaceMember.mockResolvedValue(undefined);
  });

  it('shows members for the active workspace', async () => {
    render(<WorkspaceMembersScreen />);

    expect(await screen.findByRole('heading', { name: /workspace members/i })).toBeInTheDocument();
    expect(screen.getByText('Search Workspace')).toBeInTheDocument();
    expect(screen.getByText('user-owner')).toBeInTheDocument();
    expect(screen.getByText('user-analyst')).toBeInTheDocument();
    expect(mockRepository.getWorkspaceMembers).toHaveBeenCalledWith('ws-search');
  });

  it('adds a member and reloads the list', async () => {
    render(<WorkspaceMembersScreen />);
    await screen.findByText('user-owner');

    fireEvent.change(screen.getByPlaceholderText(/user-strategist/i), { target: { value: 'user-strategist' } });
    fireEvent.change(screen.getByLabelText(/^Role$/i), { target: { value: 'strategist' } });
    fireEvent.click(screen.getByRole('button', { name: /add member/i }));

    await waitFor(() => {
      expect(mockRepository.upsertWorkspaceMember).toHaveBeenCalledWith('ws-search', {
        userId: 'user-strategist',
        role: 'strategist',
      });
    });
    expect(mockRepository.getWorkspaceMembers).toHaveBeenCalledTimes(2);
  });

  it('updates a member role and removes a member', async () => {
    render(<WorkspaceMembersScreen />);
    await screen.findByText('user-analyst');

    fireEvent.change(screen.getByLabelText(/role for user-analyst/i), { target: { value: 'source_curator' } });

    await waitFor(() => {
      expect(mockRepository.upsertWorkspaceMember).toHaveBeenCalledWith('ws-search', {
        userId: 'user-analyst',
        role: 'source_curator',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /remove user-analyst/i }));

    await waitFor(() => {
      expect(mockRepository.removeWorkspaceMember).toHaveBeenCalledWith('ws-search', 'user-analyst');
    });
  });

  it('disables management for non-admin workspace roles', async () => {
    mockRepository.getActiveWorkspace.mockResolvedValue({
      id: 'ws-search',
      name: 'Search Workspace',
      currentUserRole: 'analyst',
    });

    render(<WorkspaceMembersScreen />);

    expect(await screen.findByText(/only workspace owners or admins/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add member/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /remove user-analyst/i })).toBeDisabled();
  });
});
