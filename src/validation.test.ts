import { describe, expect, test } from 'vitest';
import { isValidIndustryProfile, isValidSource, isValidDocument, isValidSignal, isValidTrend, isValidEvidenceLink } from './validation';

// Helper valid objects
const validIndustry = {
  id: 'ind-1',
  name: 'Online Grocery',
  geography: 'Global',
  description: 'Mock industry',
  strategicPriorities: [],
  customerSegments: [],
  competitors: [],
  timeHorizons: [],
};

const validSource = {
  id: 'src-1',
  name: 'Retail Tech News',
  url: 'https://example.com',
  sourceType: 'news',
  credibilityScore: 0.8,
  relevanceScore: 0.7,
  freshnessScore: 0.9,
  status: 'suggested' as const,
  notes: '',
};

const validDocument = {
  id: 'doc-1',
  sourceId: 'src-1',
  title: 'AI Shopping',
  publishedDate: '2026-01-01',
  content: 'sample',
  url: 'https://example.com/doc',
  ingestionStatus: 'pending',
  extractedSignalIds: [],
};

const validSignal = {
  id: 'sig-1',
  documentId: 'doc-1',
  sourceId: 'src-1',
  title: 'AI assisted shopping',
  summary: 'summary',
  signalType: 'technology',
  pestleCategory: 'technology',
  noveltyScore: 0.5,
  strengthScore: 0.6,
  confidenceScore: 0.7,
  evidenceDate: '2026-01-02',
  tags: [],
};

const validTrend = {
  id: 'tr-1',
  name: 'AI grocery',
  summary: 'summary',
  status: 'candidate' as const,
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

const validEvidence = {
  id: 'ev-1',
  trendId: 'tr-1',
  signalId: 'sig-1',
  documentId: 'doc-1',
  sourceId: 'src-1',
  quote: 'Relevant excerpt',
  relevanceReason: 'Supports trend',
};

describe('IndustryProfile validation', () => {
  test('valid object returns true', () => {
    expect(isValidIndustryProfile(validIndustry)).toBe(true);
  });
  test('missing required field returns false', () => {
    const { name, ...rest } = validIndustry;
    expect(isValidIndustryProfile({ ...rest } as any)).toBe(false);
  });
});

describe('Source validation', () => {
  test('valid object returns true', () => {
    expect(isValidSource(validSource)).toBe(true);
  });
  test('score outside 0-1 returns false', () => {
    const bad = { ...validSource, credibilityScore: 1.5 };
    expect(isValidSource(bad)).toBe(false);
  });
  test('invalid status enum returns false', () => {
    const bad = { ...validSource, status: 'unknown' } as any;
    expect(isValidSource(bad)).toBe(false);
  });
});

describe('Document validation', () => {
  test('valid object returns true', () => {
    expect(isValidDocument(validDocument)).toBe(true);
  });
  test('invalid date returns false', () => {
    const bad = { ...validDocument, publishedDate: 'invalid-date' };
    expect(isValidDocument(bad)).toBe(false);
  });
});

describe('Signal validation', () => {
  test('valid object returns true', () => {
    expect(isValidSignal(validSignal)).toBe(true);
  });
  test('score outside 0-1 returns false', () => {
    const bad = { ...validSignal, noveltyScore: -0.1 };
    expect(isValidSignal(bad)).toBe(false);
  });
});

describe('Trend validation', () => {
  test('valid object returns true', () => {
    expect(isValidTrend(validTrend)).toBe(true);
  });
  test('invalid status enum returns false', () => {
    const bad = { ...validTrend, status: 'unknown' } as any;
    expect(isValidTrend(bad)).toBe(false);
  });
  test('score out of range returns false', () => {
    const bad = { ...validTrend, likelihoodScore: 1.5 };
    expect(isValidTrend(bad)).toBe(false);
  });
});

describe('EvidenceLink validation', () => {
  test('valid object returns true', () => {
    expect(isValidEvidenceLink(validEvidence)).toBe(true);
  });
  test('empty quote returns false', () => {
    const bad = { ...validEvidence, quote: '' };
    expect(isValidEvidenceLink(bad)).toBe(false);
  });
});

// --- Phase 2 Monitoring Validation Tests ---

import {
  isValidMonitoringRule,
  isValidMonitoringRun,
  isValidSourceSnapshot,
  isValidChangeEvent,
  isValidTrendScoreSnapshot,
  isValidTrendScoreChange,
  isValidAlert,
  isValidWhatChangedSummary,
} from './validation';

describe('MonitoringRule validation', () => {
  const validRule = {
    id: 'rule-1',
    sourceId: 'src-1',
    industryProfileId: 'ind-1',
    frequency: 'weekly' as const,
    enabled: true,
    keywords: [],
    includePatterns: [],
    excludePatterns: [],
    lastRunAt: '2026-01-01T00:00:00Z',
    nextRunAt: '2026-01-08T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('valid object returns true', () => {
    expect(isValidMonitoringRule(validRule)).toBe(true);
  });

  test('invalid frequency returns false', () => {
    const bad = { ...validRule, frequency: 'hourly' };
    expect(isValidMonitoringRule(bad as any)).toBe(false);
  });
});

describe('MonitoringRun validation', () => {
  const validRun = {
    id: 'run-1',
    ruleId: 'rule-1',
    sourceId: 'src-1',
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T00:05:00Z',
    status: 'completed' as const,
    documentsScanned: 10,
    newDocumentsFound: 2,
    updatedDocumentsFound: 0,
    newSignalsFound: 1,
    affectedTrendIds: [],
    alertIds: [],
    errorMessage: '',
  };

  test('valid object returns true', () => {
    expect(isValidMonitoringRun(validRun)).toBe(true);
  });

  test('invalid status returns false', () => {
    const bad = { ...validRun, status: 'unknown' };
    expect(isValidMonitoringRun(bad as any)).toBe(false);
  });
});

describe('SourceSnapshot validation', () => {
  const validSnapshot = {
    id: 'snap-1',
    sourceId: 'src-1',
    capturedAt: '2026-01-01T00:00:00Z',
    documentFingerprints: [],
    rawMetadata: {},
  };

  test('valid object returns true', () => {
    expect(isValidSourceSnapshot(validSnapshot)).toBe(true);
  });
});

describe('ChangeEvent validation', () => {
  const validChange = {
    id: 'change-1',
    sourceId: 'src-1',
    documentId: 'doc-1',
    changeType: 'new_document' as const,
    detectedAt: '2026-01-01T00:00:00Z',
    previousSnapshotId: 'snap-1',
    currentSnapshotId: 'snap-2',
    summary: 'New document found',
  };

  test('valid object returns true', () => {
    expect(isValidChangeEvent(validChange)).toBe(true);
  });
});

describe('TrendScoreSnapshot validation', () => {
  const validScoreSnap = {
    id: 'tsnap-1',
    trendId: 'tr-1',
    capturedAt: '2026-01-01T00:00:00Z',
    likelihoodScore: 0.5,
    confidenceScore: 0.5,
    impactScore: 0.5,
    horizon: '1-3 years',
    maturityStage: 'emerging',
    evidenceCount: 1,
    signalCount: 1,
    sourceDiversity: 1,
    reason: 'Initial state',
  };

  test('valid object returns true', () => {
    expect(isValidTrendScoreSnapshot(validScoreSnap)).toBe(true);
  });

  test('invalid score returns false', () => {
    const bad = { ...validScoreSnap, likelihoodScore: -0.1 };
    expect(isValidTrendScoreSnapshot(bad)).toBe(false);
  });
});

describe('TrendScoreChange validation', () => {
  const validScoreChange = {
    id: 'tchange-1',
    trendId: 'tr-1',
    previousSnapshotId: 'tsnap-1',
    currentSnapshotId: 'tsnap-2',
    changedAt: '2026-01-01T00:00:00Z',
    likelihoodDelta: 0.1,
    confidenceDelta: 0,
    impactDelta: 0,
    horizonChanged: false,
    maturityChanged: false,
    reason: 'Score increased',
    relatedSignalIds: [],
  };

  test('valid object returns true', () => {
    expect(isValidTrendScoreChange(validScoreChange)).toBe(true);
  });

  test('missing previous snapshot id returns false', () => {
    const bad = { ...validScoreChange, previousSnapshotId: '' };
    expect(isValidTrendScoreChange(bad)).toBe(false);
  });
});

describe('Alert validation', () => {
  const validAlert = {
    id: 'alert-1',
    trendId: 'tr-1',
    alertType: 'new_candidate_trend' as const,
    severity: 'medium' as const,
    title: 'New Trend',
    summary: 'Detected new candidate',
    createdAt: '2026-01-01T00:00:00Z',
    acknowledged: false,
    relatedSignalIds: [],
    relatedDocumentIds: [],
    relatedSourceIds: [],
  };

  test('valid object returns true', () => {
    expect(isValidAlert(validAlert)).toBe(true);
  });

  test('empty title returns false', () => {
    const bad = { ...validAlert, title: '' };
    expect(isValidAlert(bad)).toBe(false);
  });

  test('invalid severity returns false', () => {
    const bad = { ...validAlert, severity: 'invalid_severity' };
    expect(isValidAlert(bad as any)).toBe(false);
  });
});

describe('WhatChangedSummary validation', () => {
  const validSummary = {
    id: 'what-1',
    monitoringRunId: 'run-1',
    generatedAt: '2026-01-01T00:00:00Z',
    headline: 'Changes detected',
    newSignals: [],
    changedTrends: [],
    newCandidateTrends: [],
    alerts: [],
    recommendedActions: [],
  };

  test('valid object returns true', () => {
    expect(isValidWhatChangedSummary(validSummary)).toBe(true);
  });
});
