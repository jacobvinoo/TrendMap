// Mock in‑memory repository for Phase 1 data
// Provides deterministic CRUD operations used by tests and services.
// Uses a global shared state object to ensure consistency across imports.

import type { IndustryProfile, Source, Document, Signal, Trend, EvidenceLink, SourceStatus, TrendStatus } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __mockRepoState: {
    industryProfile: IndustryProfile | null;
    sources: Source[];
    documents: Document[];
    signals: Signal[];
    trends: Trend[];
    evidences: EvidenceLink[];
  } | undefined;
}

function initState() {
  if (!globalThis.__mockRepoState) {
    globalThis.__mockRepoState = {
      industryProfile: null,
      sources: [],
      documents: [],
      signals: [],
      trends: [],
      evidences: [],
    };
  }
}

initState();

function seedData() {
  const state = globalThis.__mockRepoState!;
  // Industry profile mock
  state.industryProfile = {
    id: 'ind-1',
    name: 'Online Grocery',
    geography: 'Global',
    description: 'Mock industry for Phase 1',
    strategicPriorities: [],
    customerSegments: [],
    competitors: [],
    timeHorizons: [],
  };

  // Sources mock
  state.sources = [
    {
      id: 'src-1',
      name: 'Retail Technology News',
      url: 'https://example.com/tech',
      sourceType: 'news',
      credibilityScore: 0.8,
      relevanceScore: 0.7,
      freshnessScore: 0.9,
      status: 'approved' as SourceStatus,
      notes: 'Good tech source',
    },
    {
      id: 'src-2',
      name: 'Grocery Industry Publication',
      url: 'https://example.com/grocery',
      sourceType: 'publication',
      credibilityScore: 0.85,
      relevanceScore: 0.75,
      freshnessScore: 0.85,
      status: 'rejected' as SourceStatus,
      notes: 'Too narrow',
    },
    {
      id: 'src-3',
      name: 'Journal of AI Research',
      url: 'https://example.com/ai-research',
      sourceType: 'academic',
      credibilityScore: 0.95,
      relevanceScore: 0.6,
      freshnessScore: 0.7,
      status: 'approved' as SourceStatus,
      notes: 'High credibility',
    },
    {
      id: 'src-4',
      name: 'Consumer Insights Quarterly',
      url: 'https://example.com/consumer',
      sourceType: 'report',
      credibilityScore: 0.8,
      relevanceScore: 0.9,
      freshnessScore: 0.8,
      status: 'approved' as SourceStatus,
      notes: '',
    },
    {
      id: 'src-5',
      name: 'Competitor PR Hub',
      url: 'https://example.com/pr',
      sourceType: 'pr',
      credibilityScore: 0.5,
      relevanceScore: 0.8,
      freshnessScore: 0.9,
      status: 'suggested' as SourceStatus,
      notes: 'Review for bias',
    },
    {
      id: 'src-6',
      name: 'Global Retail Analytics',
      url: 'https://example.com/analytics',
      sourceType: 'research',
      credibilityScore: 0.9,
      relevanceScore: 0.85,
      freshnessScore: 0.8,
      status: 'approved' as SourceStatus,
      notes: '',
    },
  ];

  // Documents mock
  state.documents = [
    {
      id: 'doc-1',
      sourceId: 'src-1',
      title: 'AI‑assisted grocery search',
      publishedDate: '2026-01-10',
      content: 'An AI assistant is being integrated into grocery search engines to enable conversational commerce.',
      url: 'https://example.com/doc1',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    },
    {
      id: 'doc-2',
      sourceId: 'src-2',
      title: 'Retail media sponsored placements',
      publishedDate: '2026-01-12',
      content: 'Retail media platforms are adding sponsored placements to search results.',
      url: 'https://example.com/doc2',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    },
    {
      id: 'doc-3',
      sourceId: 'src-1',
      title: 'Already Extracted Doc',
      publishedDate: '2026-01-14',
      content: 'This document has already been processed and lacks meaningful signals.',
      url: 'https://example.com/doc3',
      ingestionStatus: 'extracted',
      extractedSignalIds: ['sig-1'],
    },
    {
      id: 'doc-4',
      sourceId: 'src-3',
      title: 'Trust in Algorithmic Sorting',
      publishedDate: '2026-01-15',
      content: 'Transparency and trust are essential for consumer adoption of explainability in AI recommendations.',
      url: 'https://example.com/doc4',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    },
    {
      id: 'doc-5',
      sourceId: 'src-4',
      title: 'Combating Zero Results',
      publishedDate: '2026-01-18',
      content: 'Brands are focusing on reducing zero result queries to improve relevance and retention.',
      url: 'https://example.com/doc5',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    },
    {
      id: 'doc-6',
      sourceId: 'src-5',
      title: 'New Hyper-Personalization Engine',
      publishedDate: '2026-01-20',
      content: 'Our competitor launched a hyper-personalized storefront with tailored offerings.',
      url: 'https://example.com/doc6',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    },
    {
      id: 'doc-7',
      sourceId: 'src-6',
      title: 'Rise of Recipe-to-Cart',
      publishedDate: '2026-01-22',
      content: 'Shoppers increasingly use recipe meal planning tools to fill their basket seamlessly.',
      url: 'https://example.com/doc7',
      ingestionStatus: 'pending',
      extractedSignalIds: [],
    }
  ];

  // Empty collections for dynamic data
  state.signals = [];
  state.trends = [];
  state.evidences = [];
}

// Seed on first load
seedData();

// ----- Exported reset for test isolation -----
export function resetMockData() {
  // Re‑initialize the shared state and reseed
  globalThis.__mockRepoState = undefined;
  initState();
  seedData();
}

// ----- Industry -----
export function getIndustryProfile(): IndustryProfile | null {
  return globalThis.__mockRepoState!.industryProfile;
}

export function saveIndustryProfile(profile: IndustryProfile): void {
  globalThis.__mockRepoState!.industryProfile = profile;
}

// ----- Sources -----
export function getSources(): Source[] {
  return [...globalThis.__mockRepoState!.sources];
}

export function updateSourceStatus(sourceId: string, status: SourceStatus): void {
  const idx = globalThis.__mockRepoState!.sources.findIndex((s) => s.id === sourceId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.sources[idx] = { ...globalThis.__mockRepoState!.sources[idx], status };
  }
}

export function updateSourceNote(sourceId: string, note: string): void {
  const idx = globalThis.__mockRepoState!.sources.findIndex((s) => s.id === sourceId);
  if (idx !== -1) {
    const existing = globalThis.__mockRepoState!.sources[idx].notes ?? '';
    globalThis.__mockRepoState!.sources[idx] = { ...globalThis.__mockRepoState!.sources[idx], notes: existing ? `${existing}\n${note}` : note };
  }
}

// ----- Documents -----
export function getDocuments(): Document[] {
  return [...globalThis.__mockRepoState!.documents];
}

export function updateDocumentIngestionStatus(documentId: string, status: string): void {
  const idx = globalThis.__mockRepoState!.documents.findIndex((d) => d.id === documentId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.documents[idx] = { ...globalThis.__mockRepoState!.documents[idx], ingestionStatus: status };
  }
}

export function updateDocumentExtractedSignals(documentId: string, signalIds: string[]): void {
  const idx = globalThis.__mockRepoState!.documents.findIndex((d) => d.id === documentId);
  if (idx !== -1) {
    const existing = globalThis.__mockRepoState!.documents[idx].extractedSignalIds || [];
    // Only push new signal IDs avoiding duplicates
    const uniqueNewIds = Array.from(new Set([...existing, ...signalIds]));
    globalThis.__mockRepoState!.documents[idx] = { 
      ...globalThis.__mockRepoState!.documents[idx], 
      extractedSignalIds: uniqueNewIds 
    };
  }
}

// ----- Signals -----
export function getSignals(): Signal[] {
  return [...globalThis.__mockRepoState!.signals];
}

export function saveSignals(newSignals: Signal[]): void {
  const current = globalThis.__mockRepoState!.signals;
  for (const s of newSignals) {
    const idx = current.findIndex(existing => existing.id === s.id);
    if (idx !== -1) current[idx] = s;
    else current.push(s);
  }
}

// ----- Trends -----
export function getTrends(): Trend[] {
  return [...globalThis.__mockRepoState!.trends];
}

export function getTrendById(id: string): Trend | null {
  return globalThis.__mockRepoState!.trends.find((t) => t.id === id) || null;
}

export function saveTrends(newTrends: Trend[]): void {
  const current = globalThis.__mockRepoState!.trends;
  for (const t of newTrends) {
    const idx = current.findIndex(existing => existing.id === t.id);
    if (idx !== -1) {
      // Preserve existing human-reviewed state (name, summary, status, etc)
      // Only merge in new related signal IDs to maintain traceability
      const existing = current[idx];
      const mergedSignalIds = Array.from(new Set([...existing.relatedSignalIds, ...t.relatedSignalIds]));
      current[idx] = { ...existing, relatedSignalIds: mergedSignalIds };
    } else {
      current.push(t);
    }
  }
}

export function updateTrendStatus(trendId: string, status: TrendStatus): void {
  const idx = globalThis.__mockRepoState!.trends.findIndex((t) => t.id === trendId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.trends[idx] = { ...globalThis.__mockRepoState!.trends[idx], status };
  }
}

export function updateTrend(trendId: string, patch: Partial<Trend>): void {
  const idx = globalThis.__mockRepoState!.trends.findIndex((t) => t.id === trendId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.trends[idx] = { ...globalThis.__mockRepoState!.trends[idx], ...patch } as Trend;
  }
}

// ----- Evidence -----
export function getEvidenceForTrend(trendId: string): EvidenceLink[] {
  return globalThis.__mockRepoState!.evidences.filter((e) => e.trendId === trendId);
}

export function addEvidence(e: EvidenceLink): void {
  const current = globalThis.__mockRepoState!.evidences;
  const exists = current.some(existing => existing.id === e.id);
  if (!exists) {
    current.push(e);
  }
}

export type { SourceStatus, TrendStatus };
