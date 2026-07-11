import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

export function initDiscoveryAgent() {
  eventBus.subscribe('START_DISCOVERY_CYCLE', async (payload = {}) => {
    const industry = await repository.getIndustryProfile();
    if (!industry) {
      throw new Error('Industry profile is required before source discovery can run.');
    }
    const industryName = industry?.name || 'the configured industry';

    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'DiscoveryAgent',
      taskType: 'Source Scanning',
      status: 'running',
      message: `Scanning credible source candidates for ${industryName}...`,
      timestamp: new Date().toISOString()
    });

    try {
      const newSources = await repository.discoverSources(industry.id);

      await repository.logAgentActivity({
        id: crypto.randomUUID(),
        agentRole: 'DiscoveryAgent',
        taskType: 'Source Scanning',
        status: 'completed',
        message: `Discovered ${newSources.length} sources for review.`,
        timestamp: new Date().toISOString()
      });

      for (const src of newSources) {
        await eventBus.publish(EventTypes.SOURCE_DISCOVERED, {
          sourceName: src.name,
          sourceType: (src as any).sourceType ?? (src as any).source_type,
          authorityScore: (src as any).credibilityScore ?? (src as any).credibility_score,
          sourceId: src.id
        }, 'DiscoveryAgent');
      }

      await eventBus.publish('DISCOVERY_CYCLE_COMPLETED', { success: true, count: newSources.length }, 'DiscoveryAgent');

      if (payload.scope === 'global') {
        await eventBus.publish('START_ANALYSIS_CYCLE', {}, 'DiscoveryAgent');
      }
    } catch (e) {
      await repository.logAgentActivity({
        id: crypto.randomUUID(),
        agentRole: 'DiscoveryAgent',
        taskType: 'Source Scanning',
        status: 'failed',
        message: `Failed to discover sources: ${e}`,
        timestamp: new Date().toISOString()
      });
      await eventBus.publish('DISCOVERY_CYCLE_COMPLETED', { success: false, error: String(e) }, 'DiscoveryAgent');
      throw e;
    }
  });
}
