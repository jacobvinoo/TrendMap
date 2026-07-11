import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

export function initExecutiveAgent() {
  eventBus.subscribe(EventTypes.PREDICTION_GENERATED, async (payload) => {
    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'ExecutiveAgent',
      taskType: 'Strategic Review',
      status: 'running',
      message: 'Challenging prediction timelines and recommendation risks.',
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const debates = await repository.getDebates();
    const debate = debates.find(d => d.id === payload.debateId);
    if (debate) {
      debate.messages.push({
        id: crypto.randomUUID(),
        debateId: debate.id,
        agentRole: 'ExecutiveAgent',
        content: `What is our risk exposure if the EU proposal passes? I recommend we do not roll this out globally yet. Let's start with a limited opt-in pilot in a low-regulation market.`,
        timestamp: new Date().toISOString()
      });
      
      debate.messages.push({
        id: crypto.randomUUID(),
        debateId: debate.id,
        agentRole: 'RecommendationAgent',
        content: `Agreed. I will generate a strategic option for a 'Limited Pilot' rather than 'Full Integration'. Setting required capability to 'Compliance Auditing'.`,
        timestamp: new Date().toISOString()
      });

      debate.status = 'consensus_reached';
      debate.consensusSummary = 'Trend is real but constrained by regulation and adoption friction. Strategy shifts from full integration to limited pilot testing.';
      debate.confidenceDelta = -0.19; // 82% to 63%
      await repository.saveDebate(debate);
      
      await eventBus.publish(EventTypes.DEBATE_CONSENSUS_REACHED, { debateId: debate.id }, 'ExecutiveAgent');
    }

    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'ExecutiveAgent',
      taskType: 'Strategic Review',
      status: 'completed',
      message: 'Consensus reached. Strategy aligned to limited pilot.',
      timestamp: new Date().toISOString()
    });
  });
}
