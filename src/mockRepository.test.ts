
import { describe, expect, test, beforeEach } from 'vitest';
import {
  getIndustryProfile,
  saveIndustryProfile,
  getSources,
  updateSourceStatus,
  getDocuments,
  getSignals,
  saveSignals,
  getTrends,
  saveTrends,
  updateTrendStatus,
  updateTrend,
  getEvidenceForTrend,
  resetMockData,
  addEvidence,
} from './mockRepository';
import type { IndustryProfile, Signal, TrendStatus, Trend, EvidenceLink } from './types';

beforeEach(() => {
  resetMockData();
});

describe('Industry Profile repository', () => {
  test('returns seeded industry profile', () => {
    const profile = getIndustryProfile();
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('Online Grocery');
  });
  test('saves updated industry profile', () => {
    const original = getIndustryProfile();
    const updated: IndustryProfile = { ...original!, name: 'New Industry' };
    saveIndustryProfile(updated);
    const after = getIndustryProfile();
    expect(after?.name).toBe('New Industry');
  });
});

describe('Source repository', () => {
  test('returns seeded sources', () => {
    const sources = getSources();
    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0].name).toContain('Retail');
  });
  test('updates source status', () => {
    const sourceId = getSources()[0].id;
    updateSourceStatus(sourceId, 'approved');
    const updated = getSources().find((s) => s.id === sourceId);
    expect(updated?.status).toBe('approved');
  });
});

describe('Document repository', () => {
  test('returns seeded documents', () => {
    const docs = getDocuments();
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].title).toBeDefined();
  });
});

describe('Signal repository', () => {
  test('starts empty and can save signals', () => {
    expect(getSignals()).toHaveLength(0);
    const sig: Signal = {
      id: 'sig-1',
      documentId: getDocuments()[0].id,
      sourceId: getSources()[0].id,
      title: 'Test Signal',
      summary: 'summary',
      signalType: 'type',
      pestleCategory: 'tech',
      noveltyScore: 0.5,
      strengthScore: 0.6,
      confidenceScore: 0.7,
      evidenceDate: '2026-01-01',
      tags: [],
    };
    saveSignals([sig]);
    const after = getSignals();
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe('sig-1');
  });
});

describe('Trend repository', () => {

  test('saves and retrieves trends', () => {
    const trend: Trend = { 
      id: 'tr-1',
      name: 'Test Trend',
      summary: 'summary',
      status: 'candidate' as TrendStatus,
      horizon: '12-24 months',
      likelihoodScore: 0.6,
      confidenceScore: 0.7,
      impactScore: 0.8,
      maturityStage: 'emerging',
      relatedSignalIds: [],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],
      recommendedActions: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    saveTrends([trend]);
    const fetched = getTrends();
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe('tr-1');

  });
  test('updates trend status', () => {
    const trend: Trend = { 
      id: 'tr-2',
      name: 'Another Trend',
      summary: 'summary',
      status: 'candidate' as TrendStatus,
      horizon: '6-12 months',
      likelihoodScore: 0.5,
      confidenceScore: 0.5,
      impactScore: 0.5,
      maturityStage: 'emerging',
      relatedSignalIds: [],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],
      recommendedActions: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    saveTrends([trend]);
    updateTrendStatus('tr-2', 'approved');
    const updated = getTrends().find((t) => t.id === 'tr-2');

    expect(updated?.status).toBe('approved');
  });
  test('patches trend fields', () => {
    const trend: Trend = { 
      id: 'tr-3',
      name: 'Patch Trend',
      summary: 'summary',
      status: 'candidate' as TrendStatus,
      horizon: '6-12 months',
      likelihoodScore: 0.5,
      confidenceScore: 0.5,
      impactScore: 0.5,
      maturityStage: 'emerging',
      relatedSignalIds: [],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],
      recommendedActions: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    saveTrends([trend]);
    updateTrend('tr-3', { name: 'Patched Name', horizon: '12-24 months' });
    const patched = getTrends().find((t) => t.id === 'tr-3');
    expect(patched?.name).toBe('Patched Name');
    expect(patched?.horizon).toBe('12-24 months');
  });
});

describe('Evidence repository', () => {
  test('retrieves evidence for a trend', () => {
    const evidence: EvidenceLink = {
      id: 'ev-1',
      trendId: 'tr-4',
      signalId: 'sig-2',
      documentId: 'doc-1',
      sourceId: 'src-1',
      quote: 'example',
      relevanceReason: 'support',
    };
    const trend = {
      id: 'tr-4',
      name: 'Evidence Trend',
      summary: 'summary',
      status: 'candidate' as TrendStatus,
      horizon: '6-12 months',
      likelihoodScore: 0.5,
      confidenceScore: 0.5,
      impactScore: 0.5,
      maturityStage: 'emerging',
      relatedSignalIds: [],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],

      recommendedActions: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    saveTrends([trend]); 
    addEvidence(evidence);
    const result = getEvidenceForTrend('tr-4');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ev-1');
  });
});

// --- Phase 2 Monitoring Repository Tests ---

import {
  getMonitoringRules,
  saveMonitoringRule,
  updateMonitoringRule,
  getMonitoringRuns,
  saveMonitoringRun,
  updateMonitoringRun,
  getSourceSnapshots,
  saveSourceSnapshot,
  getChangeEvents,
  saveChangeEvents,
  getTrendScoreSnapshots,
  saveTrendScoreSnapshot,
  getTrendScoreChanges,
  saveTrendScoreChange,
  getAlerts,
  saveAlerts,
  acknowledgeAlert,
  getWhatChangedSummaries,
  saveWhatChangedSummary
} from './mockRepository';
import type { MonitoringRule, MonitoringRun, SourceSnapshot, ChangeEvent, TrendScoreSnapshot, TrendScoreChange, Alert, WhatChangedSummary } from './types'; 

describe('Phase 2 Repository Functions', () => {
  beforeEach(() => {
    // Reset state before each test
    globalThis.__mockRepoState = {
      industryProfile: null,
      sources: [],
      documents: [],
      signals: [],
      trends: [],
      evidences: [],
      rules: [],
      runs: [],
      snapshots: [],
      changeEvents: [],
      trendScoreSnapshots: [],
      trendScoreChanges: [],
      alerts: [],
      summaries: [],
      strategicContext: null,
      assumptions: [],
      leadingIndicators: [],
      strategicImplications: [],
      scenarios: [],
      strategicOptions: [],
      decisionBriefs: [],
      roadmapItems: [],
    };
  });

  test('rules CRUD', () => {
    const rule: MonitoringRule = { id: 'r1', sourceId: 's1', industryProfileId: 'ind', frequency: 'weekly', enabled: true, keywords: [], includePatterns: [], excludePatterns: [], createdAt: '', updatedAt: '' };
    saveMonitoringRule(rule);
    expect(getMonitoringRules().length).toBe(1);
    updateMonitoringRule('r1', { enabled: false });
    expect(getMonitoringRules()[0].enabled).toBe(false);
  });

  test('runs CRUD', () => {
    const run: MonitoringRun = { id: 'run1', ruleId: 'r1', sourceId: 's1', startedAt: '', status: 'pending', documentsScanned: 0, newDocumentsFound: 0, updatedDocumentsFound: 0, newSignalsFound: 0, affectedTrendIds: [], alertIds: [] };
    saveMonitoringRun(run);
    expect(getMonitoringRuns().length).toBe(1);
    updateMonitoringRun('run1', { status: 'completed' });
    expect(getMonitoringRuns()[0].status).toBe('completed');
  });

  test('snapshots CRUD', () => {
    const snap: SourceSnapshot = { id: 'snap1', sourceId: 's1', capturedAt: '', documentFingerprints: [], rawMetadata: {} };
    saveSourceSnapshot(snap);
    expect(getSourceSnapshots('s1').length).toBe(1);
  });

  test('change events CRUD', () => {
    const event: ChangeEvent = { id: 'c1', sourceId: 's1', documentId: 'd1', changeType: 'new_document', detectedAt: '', currentSnapshotId: 'snap1', summary: '' };

    saveChangeEvents([event]);
    expect(getChangeEvents().length).toBe(1);
  });

  test('trend score snapshots CRUD', () => {
    const snap: TrendScoreSnapshot = { id: 'ts1', trendId: 't1', capturedAt: '', likelihoodScore: 0, confidenceScore: 0, impactScore: 0, horizon: '', maturityStage: '', evidenceCount: 0, signalCount: 0, sourceDiversity: 0, reason: '' };
    saveTrendScoreSnapshot(snap);
    expect(getTrendScoreSnapshots('t1').length).toBe(1);
  });

  test('trend score changes CRUD', () => {
    const change: TrendScoreChange = { id: 'tc1', trendId: 't1', previousSnapshotId: 'ts1', currentSnapshotId: 'ts2', changedAt: '', likelihoodDelta: 0, confidenceDelta: 0, impactDelta: 0, horizonChanged: false, maturityChanged: false, reason: '', relatedSignalIds: [] };
    saveTrendScoreChange(change);
    expect(getTrendScoreChanges('t1').length).toBe(1);
  });

  test('alerts CRUD', () => {
    const alert: Alert = { id: 'a1', trendId: 't1', alertType: 'new_candidate_trend', severity: 'medium', title: '', summary: '', createdAt: '', acknowledged: false, relatedSignalIds: [], relatedDocumentIds: [], relatedSourceIds: [] } as any;
    saveAlerts([alert]);
    expect(getAlerts().length).toBe(1);
    acknowledgeAlert('a1');
    expect(getAlerts()[0].acknowledged).toBe(true);
  });

  test('what changed summaries CRUD', () => {
    const summary: WhatChangedSummary = { id: 'wc1', monitoringRunId: 'run1', generatedAt: '', headline: '', newSignals: [], changedTrends: [], newCandidateTrends: [], alerts: [], recommendedActions: [] };
    saveWhatChangedSummary(summary);
    expect(getWhatChangedSummaries().length).toBe(1);
  });
});
