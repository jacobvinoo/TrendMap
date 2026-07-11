// src/eventBus.ts

type EventCallback = (payload: any) => void | Promise<void>;

export interface EventMessage {
  type: string;
  payload: any;
  timestamp: string;
  sourceAgent?: string;
}

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};
  private history: EventMessage[] = [];

  subscribe(eventType: string, callback: EventCallback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
    };
  }

  async publish(eventType: string, payload: any, sourceAgent?: string) {
    const event: EventMessage = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      sourceAgent
    };
    
    this.history.push(event);
    
    // Simulate slight network/queue delay for realism in UI
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const eventListeners = this.listeners[eventType] || [];
    
    // Execute listeners and let user actions await visible workflow completion.
    await Promise.all(eventListeners.map(cb => {
      try {
        return cb(payload);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    }));
  }

  getHistory(): EventMessage[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  clearListeners() {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();

// Standard Phase 4 Event Types
export const EventTypes = {
  // Discovery & Monitoring
  SOURCE_DISCOVERED: 'SOURCE_DISCOVERED',
  DOCUMENT_INGESTED: 'DOCUMENT_INGESTED',
  
  // Analysis
  SIGNAL_EXTRACTED: 'SIGNAL_EXTRACTED',
  NOISE_REJECTED: 'NOISE_REJECTED',
  
  // Validation & Trends
  TREND_CANDIDATE_IDENTIFIED: 'TREND_CANDIDATE_IDENTIFIED',
  EVIDENCE_CONTRADICTED: 'EVIDENCE_CONTRADICTED',
  EVIDENCE_CONFIRMED: 'EVIDENCE_CONFIRMED',
  CONFIDENCE_CALIBRATED: 'CONFIDENCE_CALIBRATED',
  
  // Prediction & Strategy
  PREDICTION_GENERATED: 'PREDICTION_GENERATED',
  RECOMMENDATION_CREATED: 'RECOMMENDATION_CREATED',
  
  // Debates
  DEBATE_STARTED: 'DEBATE_STARTED',
  DEBATE_MESSAGE_ADDED: 'DEBATE_MESSAGE_ADDED',
  DEBATE_CONSENSUS_REACHED: 'DEBATE_CONSENSUS_REACHED',
  
  // Graph
  KNOWLEDGE_NODE_ADDED: 'KNOWLEDGE_NODE_ADDED',
  KNOWLEDGE_EDGE_ADDED: 'KNOWLEDGE_EDGE_ADDED',
  
  // System
  AGENT_ACTIVITY_LOGGED: 'AGENT_ACTIVITY_LOGGED',
};
