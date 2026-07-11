import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

export function initPredictionAgent() {
  eventBus.subscribe(EventTypes.EVIDENCE_CONTRADICTED, async (payload) => {
    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'PredictionAgent',
      taskType: 'Forecasting',
      status: 'running',
      message: 'Recalculating adoption timelines based on new regulatory hurdles.',
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const debates = await repository.getDebates();
    const debate = debates.find(d => d.id === payload.debateId);
    if (debate) {
      debate.messages.push({
        id: crypto.randomUUID(),
        debateId: debate.id,
        agentRole: 'PredictionAgent',
        content: `Factoring in the 60% adoption drop-off and potential EU restrictions, wide adoption is unlikely in the next 12 months. Revised timeline: 24-36 months. Confidence lowered from 82% to 63%.`,
        timestamp: new Date().toISOString()
      });
      await repository.saveDebate(debate);
      await eventBus.publish(EventTypes.DEBATE_MESSAGE_ADDED, { debateId: debate.id }, 'PredictionAgent');
    }

    // Save Prediction
    const predId = crypto.randomUUID();
    await repository.savePrediction({
      id: predId,
      trendId: 'autonomous-basket-planning', // Mock ID
      predictionStatement: 'Autonomous basket planning adoption is more likely on a 24-month horizon than within 12 months.',
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 730).toISOString(),
      impact: 'medium',
      confidenceScore: 0.63,
      assumptions: JSON.stringify(['Consumers will allow AI to auto-substitute preferred items.']),
      indicators: JSON.stringify(['Increase in pilot program retention rates.']),
      evidenceIds: JSON.stringify([]),
      status: 'active',
      timestamp: new Date().toISOString()
    });

    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'PredictionAgent',
      taskType: 'Forecasting',
      status: 'completed',
      message: 'Generated 24-month horizon prediction with 63% confidence.',
      timestamp: new Date().toISOString()
    });
    
    // Knowledge Graph updates
    const trendNodeId = `trend-${crypto.randomUUID()}`;
    await repository.addKGNode({ entity_id: trendNodeId, node_type: 'Trend', label: 'Autonomous Basket Planning', properties: { confidence: 0.63 } });
    const techNodeId = `tech-${crypto.randomUUID()}`;
    await repository.addKGNode({ entity_id: techNodeId, node_type: 'Technology', label: 'Predictive Shopping AI', properties: {} });
    
    await repository.addKGEdge({
      id: crypto.randomUUID(),
      source_id: trendNodeId,
      target_id: techNodeId,
      relationship_type: 'depends_on',
      confidence_score: 0.9
    });
    
    await eventBus.publish(EventTypes.PREDICTION_GENERATED, { debateId: debate?.id }, 'PredictionAgent');
  });
}
