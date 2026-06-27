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
