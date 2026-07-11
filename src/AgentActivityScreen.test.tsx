import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentActivityScreen from './AgentActivityScreen';
import { repository } from './repository';
import { eventBus } from './eventBus';

vi.mock('./repository', () => ({
  repository: {
    getAgentActivities: vi.fn(),
  },
}));

vi.mock('./eventBus', () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

describe('AgentActivityScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activities from repository', async () => {
    // @ts-ignore
    repository.getAgentActivities.mockResolvedValue([
      { id: '1', agentRole: 'DiscoveryAgent', taskType: 'Scan', status: 'completed', message: 'Found 5 items', timestamp: '2026-07-01T12:00:00Z' }
    ]);

    await act(async () => {
      render(<AgentActivityScreen />);
    });

    expect(screen.getByText('Found 5 items')).toBeInTheDocument();
    expect(screen.getByText('@DiscoveryAgent')).toBeInTheDocument();
  });

  it('handles Trigger Global Cycle button click', async () => {
    // @ts-ignore
    repository.getAgentActivities.mockResolvedValue([]);

    await act(async () => {
      render(<AgentActivityScreen />);
    });

    const button = screen.getByRole('button', { name: /Trigger Global Cycle/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(eventBus.publish).toHaveBeenCalledWith('START_DISCOVERY_CYCLE', { scope: 'global' }, 'User');
    expect(screen.getByText('Global cycle completed. Review the latest activity, debate, and prediction timeline.')).toBeInTheDocument();
  });

  it('displays failed message if trigger fails', async () => {
    // @ts-ignore
    repository.getAgentActivities.mockResolvedValue([]);
    // @ts-ignore
    eventBus.publish.mockRejectedValue(new Error('Network Error'));

    await act(async () => {
      render(<AgentActivityScreen />);
    });

    const button = screen.getByRole('button', { name: /Trigger Global Cycle/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Global cycle failed. Check the activity log for details.')).toBeInTheDocument();
  });
});
