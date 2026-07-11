import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initDiscoveryAgent } from './discoveryAgent';
import { eventBus } from '../eventBus';
import { repository } from '../repository';

// Mock dependencies
vi.mock('../repository', () => ({
  repository: {
    getIndustryProfile: vi.fn(),
    logAgentActivity: vi.fn(),
    discoverSources: vi.fn(),
  }
}));

// We'll reset the eventBus history and listeners
beforeEach(() => {
  eventBus.clearHistory();
  eventBus.clearListeners();
  vi.clearAllMocks();
});

describe('Discovery Agent', () => {
  it('discovers sources successfully and publishes events', async () => {
    // 1. Setup mocks
    (repository.getIndustryProfile as any).mockResolvedValue({ id: 'ind-test', name: 'Testing Industry' });
    (repository.discoverSources as any).mockResolvedValue([
      { id: 'src-1', name: 'Test Report', sourceType: 'report', credibilityScore: 0.95 }
    ]);

    // 2. Initialize the agent (registers event listeners)
    initDiscoveryAgent();

    // 3. Publish the trigger event
    await eventBus.publish('START_DISCOVERY_CYCLE', { scope: 'sources' }, 'User');

    // 4. Verify outputs
    expect(repository.discoverSources).toHaveBeenCalledWith('ind-test');

    // Should have logged starting and completing activities
    expect(repository.logAgentActivity).toHaveBeenCalledTimes(2);

    const history = eventBus.getHistory();
    // history includes START_DISCOVERY_CYCLE, SOURCE_DISCOVERED, and DISCOVERY_CYCLE_COMPLETED
    const discoveredEvents = history.filter(e => e.type === 'SOURCE_DISCOVERED');
    expect(discoveredEvents).toHaveLength(1);
    expect(discoveredEvents[0].payload.sourceName).toBe('Test Report');

    const completedEvents = history.filter(e => e.type === 'DISCOVERY_CYCLE_COMPLETED');
    expect(completedEvents).toHaveLength(1);
    expect(completedEvents[0].payload.success).toBe(true);
  });

  it('handles backend failures and throws error', async () => {
    // 1. Setup mocks
    (repository.getIndustryProfile as any).mockResolvedValue({ id: 'ind-test', name: 'Testing Industry' });
    (repository.discoverSources as any).mockRejectedValue(new Error('Backend error: Internal Server Error'));

    initDiscoveryAgent();

    // The publish should reject because the agent throws
    await expect(eventBus.publish('START_DISCOVERY_CYCLE', { scope: 'sources' }, 'User'))
      .rejects.toThrow('Backend error: Internal Server Error');

    // Should have logged starting and error activities
    expect(repository.logAgentActivity).toHaveBeenCalledTimes(2);

    const history = eventBus.getHistory();
    const completedEvents = history.filter(e => e.type === 'DISCOVERY_CYCLE_COMPLETED');
    expect(completedEvents).toHaveLength(1);
    expect(completedEvents[0].payload.success).toBe(false);
  });
});
