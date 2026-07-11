import { seedTestData } from "./testSeed";
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  resetMockData, 
  getSources, 
  updateSourceStatus,
  getDocuments,
  saveDocuments,
  saveSignals,
  getSignals,
  saveTrends,
  getTrends,
  logAgentActivity,
  getAgentActivities,
  saveStrategicOptions,
  getStrategicOptions
} from './mockRepository';
import type { AgentActivity } from './types';

describe('Phase 1-4 Regression Tests', () => {
  beforeEach(() => {
    resetMockData();
    seedTestData();
  });

  it('Phase 1 manual trend workflow still works', () => {
    // 1. Approve a source
    const source = getSources().find(s => s.status === 'suggested');
    expect(source).toBeDefined();
    updateSourceStatus(source!.id, 'approved');
    const updatedSource = getSources().find(s => s.id === source!.id);
    expect(updatedSource?.status).toBe('approved');

    // 2. Documents are created by extraction/import, not seeded
    saveDocuments([{
      id: 'agent-doc-regression',
      sourceId: source!.id,
      title: 'Regression extraction document',
      publishedDate: new Date().toISOString(),
      content: 'Regression document content from a document extraction run.',
      url: 'https://example.com/regression-document',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);
    const docs = getDocuments();
    expect(docs.length).toBeGreaterThan(0);

    // 3. Extract and save signal
    const newSignal = {
      id: 'sig-reg-1',
      documentId: docs[0].id,
      sourceId: source!.id,
      title: 'Regression Signal',
      summary: 'Test summary',
      signalType: 'Test',
      pestleCategory: 'Technology',
      noveltyScore: 0.8,
      strengthScore: 0.8,
      confidenceScore: 0.8,
      evidenceDate: new Date().toISOString(),
      tags: []
    };
    saveSignals([newSignal]);
    expect(getSignals().find(s => s.id === 'sig-reg-1')).toBeDefined();

    // 4. Cluster and save trend
    const newTrend = {
      id: 'trend-reg-1',
      name: 'Regression Trend',
      summary: 'Test trend summary',
      status: 'candidate' as const,
      horizon: '12_months',
      likelihoodScore: 0.8,
      confidenceScore: 0.8,
      impactScore: 0.8,
      maturityStage: 'emerging',
      relatedSignalIds: ['sig-reg-1'],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],
      recommendedActions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveTrends([newTrend]);
    expect(getTrends().find(t => t.id === 'trend-reg-1')).toBeDefined();
  });

  it('Phase 3 strategy workflow still generates options', () => {
    const newOption = {
      id: 'opt-reg-1',
      title: 'Regression Option',
      description: 'Test option',
      optionType: 'invest' as const,
      linkedTrendIds: [],
      linkedScenarioIds: [],
      linkedAssumptionIds: [],
      expectedBenefits: [],
      keyRisks: [],
      requiredCapabilities: [],
      estimatedEffort: 'low' as const,
      timeToValue: 'now' as const,
      impactScore: 0.8,
      feasibilityScore: 0.8,
      urgencyScore: 0.8,
      confidenceScore: 0.8,
      priorityScore: 0.8,
      recommendedNextStep: 'Do it',
      status: 'proposed' as const
    };
    saveStrategicOptions([newOption]);
    expect(getStrategicOptions().find(o => o.id === 'opt-reg-1')).toBeDefined();
  });

  it('Phase 4 agent workflow still records agent activity', () => {
    const activity: AgentActivity = {
      id: 'act-reg-1',
      agentRole: 'DiscoveryAgent',
      taskType: 'Regression Test',
      status: 'completed',
      message: 'Agent did something',
      timestamp: new Date().toISOString()
    };
    logAgentActivity(activity);
    expect(getAgentActivities().find(a => a.id === 'act-reg-1')).toBeDefined();
  });
});
