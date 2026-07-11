import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initPredictionAgent } from './predictionAgent';
import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

vi.mock('../repository', () => ({
  repository: {
    logAgentActivity: vi.fn(),
    getDebates: vi.fn(),
    saveDebate: vi.fn(),
    savePrediction: vi.fn(),
    addKGNode: vi.fn(),
    addKGEdge: vi.fn(),
  }
}));

describe('predictionAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clearListeners();
  });

  it('handles EVIDENCE_CONTRADICTED', async () => {
    initPredictionAgent();
    const debate = {
      id: 'd3',
      messages: [],
      status: 'active',
      topic: 'test',
    };
    // @ts-ignore
    repository.getDebates.mockResolvedValue([debate]);

    await eventBus.publish(EventTypes.EVIDENCE_CONTRADICTED, { debateId: 'd3' }, 'System');

    
    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'PredictionAgent',
      taskType: 'Forecasting',
      status: 'running'
    }));

    expect(repository.saveDebate).toHaveBeenCalled();
    expect(debate.messages.length).toBe(1);
    expect(debate.messages[0].agentRole).toBe('PredictionAgent');

    expect(repository.savePrediction).toHaveBeenCalledWith(expect.objectContaining({
      trendId: 'autonomous-basket-planning',
      confidenceScore: 0.63
    }));

    expect(repository.addKGNode).toHaveBeenCalledTimes(2);
    expect(repository.addKGEdge).toHaveBeenCalledTimes(1);

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'PredictionAgent',
      taskType: 'Forecasting',
      status: 'completed'
    }));
  });
});
