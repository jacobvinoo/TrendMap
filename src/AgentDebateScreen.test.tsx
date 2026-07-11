import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentDebateScreen from './AgentDebateScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    getDebates: vi.fn(),
  },
}));

describe('AgentDebateScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no debates exist', async () => {
    // @ts-ignore
    repository.getDebates.mockResolvedValue([]);

    await act(async () => {
      render(<AgentDebateScreen />);
    });

    expect(screen.getByText('No active debates. Trigger an analysis cycle to begin.')).toBeInTheDocument();
  });

  it('renders debate list properly', async () => {
    // @ts-ignore
    repository.getDebates.mockResolvedValue([
      {
        id: '1',
        topic: 'Trend Validation',
        status: 'resolved',
        consensusSummary: 'Approved',
        messages: [
          { id: 'm1', agentRole: 'ValidationAgent', content: 'Is this accurate?', timestamp: '2026-07-01T12:00:00Z' },
          { id: 'm2', agentRole: 'ExecutiveAgent', content: 'Yes it is.', timestamp: '2026-07-01T12:01:00Z' }
        ]
      },
      {
        id: '2',
        topic: 'Source Credibility',
        status: 'active',
        messages: []
      }
    ]);

    await act(async () => {
      render(<AgentDebateScreen />);
    });

    expect(screen.getByText('Trend Validation')).toBeInTheDocument();
    expect(screen.getByText('Source Credibility')).toBeInTheDocument();
    expect(screen.getByText('Is this accurate?')).toBeInTheDocument();
    expect(screen.getByText('ValidationAgent')).toBeInTheDocument();
    expect(screen.getByText('ExecutiveAgent')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument(); // consensusSummary
  });
});
