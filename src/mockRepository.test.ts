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
