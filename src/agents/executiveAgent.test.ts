import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initExecutiveAgent } from './executiveAgent';
import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

vi.mock('../repository', () => ({
  repository: {
    logAgentActivity: vi.fn(),
    getDebates: vi.fn(),
    saveDebate: vi.fn(),
  }
}));

describe('executiveAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clearListeners();
  });

  it('initializes and subscribes to PREDICTION_GENERATED', async () => {
    initExecutiveAgent();
    // Simulate event
    const debate = {
      id: 'd1',
      messages: [],
      status: 'active',
      topic: 'test',
    };
    // @ts-ignore
    repository.getDebates.mockResolvedValue([debate]);
    
    await eventBus.publish(EventTypes.PREDICTION_GENERATED, { debateId: 'd1' }, 'System');
    
    
    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'ExecutiveAgent',
      taskType: 'Strategic Review',
      status: 'running'
    }));

    expect(repository.saveDebate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'd1',
      status: 'consensus_reached',
      consensusSummary: expect.any(String),
      confidenceDelta: -0.19
    }));

    expect(debate.messages.length).toBe(2);
    expect(debate.messages[0].agentRole).toBe('ExecutiveAgent');
    expect(debate.messages[1].agentRole).toBe('RecommendationAgent');

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'ExecutiveAgent',
      taskType: 'Strategic Review',
      status: 'completed'
    }));
  });
});
