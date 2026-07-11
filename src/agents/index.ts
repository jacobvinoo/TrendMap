import { initDiscoveryAgent } from './discoveryAgent';
import { initValidationAgent } from './validationAgent';
import { initPredictionAgent } from './predictionAgent';
import { initExecutiveAgent } from './executiveAgent';

let initialized = false;

export function bootAgents() {
  if (initialized) return;
  
  initDiscoveryAgent();
  initValidationAgent();
  initPredictionAgent();
  initExecutiveAgent();
  
  initialized = true;
  console.log('AI Intelligence Team Booted.');
}
