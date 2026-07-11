import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initValidationAgent } from './validationAgent';
import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

vi.mock('../repository', () => ({
  repository: {
    getDocuments: vi.fn(),
    logAgentActivity: vi.fn(),
    getDebates: vi.fn(),
    saveDebate: vi.fn(),
  }
}));

describe('validationAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clearListeners();
    
    // Mock fetch for the agent calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ name: 'Test Trend' }]
    });

    // @ts-ignore
    repository.getDebates.mockResolvedValue([]);
    // @ts-ignore
    repository.saveDebate.mockResolvedValue({});
  });

  it('handles START_ANALYSIS_CYCLE', async () => {
    // @ts-ignore
    repository.getDocuments.mockResolvedValue([
      { id: 'doc1', ingestionStatus: 'raw' }
    ]);

    initValidationAgent();
    await eventBus.publish('START_ANALYSIS_CYCLE', {});

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/agents/extract/doc1'), expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/agents/analyze'), expect.any(Object));

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      taskType: 'Document Extraction',
      status: 'running'
    }));

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      taskType: 'Trend Clustering',
      status: 'completed'
    }));
  });

  it('handles TREND_CANDIDATE_IDENTIFIED', async () => {
    initValidationAgent();
    
    const debate = {
      id: 'd2',
      messages: [],
      status: 'active',
      topic: 'test',
    };
    
    // @ts-ignore
    repository.getDebates.mockResolvedValue([debate]);
    repository.saveDebate.mockImplementation((d: any) => {
      debate.id = d.id; // capture generated id
      return Promise.resolve();
    });

    await eventBus.publish(EventTypes.TREND_CANDIDATE_IDENTIFIED, { trendName: 'Test Trend' }, 'System');

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'ValidationAgent',
      taskType: 'Evidence Stress-Testing',
      status: 'running'
    }));

    expect(repository.saveDebate).toHaveBeenCalled();
    expect(debate.messages.length).toBeGreaterThan(0);
    expect(debate.messages[debate.messages.length - 1].agentRole).toBe('ValidationAgent');
    expect(debate.messages[debate.messages.length - 1].content).toContain('WARNING: Found contradictory evidence');

    expect(repository.logAgentActivity).toHaveBeenCalledWith(expect.objectContaining({
      agentRole: 'ValidationAgent',
      taskType: 'Evidence Stress-Testing',
      status: 'completed'
    }));
  });
});
