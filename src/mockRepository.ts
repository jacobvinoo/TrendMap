
// Mock in‑memory repository for Phase 1 data
// Provides deterministic CRUD operations used by tests and services.
// Uses a global shared state object to ensure consistency across imports.

import type { 
  IndustryProfile, 
  Source, 
  Document, 
  Signal, 
  Trend, 
  EvidenceLink, 
  SourceStatus,
  TrendStatus,
  MonitoringRule, 
  MonitoringRun, 
  SourceSnapshot, 
  ChangeEvent, 
  TrendScoreSnapshot, 
  TrendScoreChange, 
  Alert, 
  WhatChangedSummary,
  StrategicContext,
  Assumption,
  LeadingIndicator,
  StrategicImplication,
  Scenario,
  StrategicOption,
  DecisionBrief,
  RoadmapItem,
} from './types';

declare global {
  // eslint-disable-next-line no-var
  var __mockRepoState: {
    industryProfile: IndustryProfile | null;
    sources: Source[];
    documents: Document[];
    signals: Signal[];
    trends: Trend[];
    evidences: EvidenceLink[];
    rules: MonitoringRule[];
    runs: MonitoringRun[];
    snapshots: SourceSnapshot[];
    changeEvents: ChangeEvent[];
    trendScoreSnapshots: TrendScoreSnapshot[];
    trendScoreChanges: TrendScoreChange[];
    alerts: Alert[];
    summaries: WhatChangedSummary[];
    // Phase 3
    strategicContext: StrategicContext | null;
    assumptions: Assumption[];
    leadingIndicators: LeadingIndicator[];
    strategicImplications: StrategicImplication[];
    scenarios: Scenario[];
    strategicOptions: StrategicOption[];
    decisionBriefs: DecisionBrief[];
    roadmapItems: RoadmapItem[];
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
      rules: [],
      runs: [],
      snapshots: [],
      changeEvents: [],
      trendScoreSnapshots: [],
      trendScoreChanges: [],
      alerts: [],
      summaries: [],
      // Phase 3
      strategicContext: null,
      assumptions: [],
      leadingIndicators: [],
      strategicImplications: [],
      scenarios: [],
      strategicOptions: [],
      decisionBriefs: [],
      roadmapItems: [],
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

  // Seed signals — traceable back to seeded documents and sources
  state.signals = [
    {
      id: 'sig-1', documentId: 'doc-1', sourceId: 'src-1',
      title: 'Retailers deploying AI-powered grocery search',
      summary: 'Multiple grocery retailers piloting natural language search to reduce zero-result rates.',
      signalType: 'technology', pestleCategory: 'Technology',
      polarity: 'positive', noveltyScore: 0.85, strengthScore: 0.8, confidenceScore: 0.82, momentumScore: 0.78,
      evidenceDate: '2026-01-10', tags: ['AI', 'search', 'grocery', 'natural-language'],
    },
    {
      id: 'sig-2', documentId: 'doc-2', sourceId: 'src-2',
      title: 'Consumer adoption of AI grocery assistants accelerating',
      summary: 'Survey shows 34% of online grocery shoppers have used an AI assistant for product discovery.',
      signalType: 'consumer', pestleCategory: 'Social',
      polarity: 'positive', noveltyScore: 0.78, strengthScore: 0.75, confidenceScore: 0.8, momentumScore: 0.82,
      evidenceDate: '2026-01-12', tags: ['AI', 'consumer', 'adoption', 'grocery'],
    },
    {
      id: 'sig-3', documentId: 'doc-3', sourceId: 'src-3',
      title: 'Conversational shopping interfaces emerging in e-commerce',
      summary: 'Chat-based shopping interfaces reducing basket abandonment in early pilots.',
      signalType: 'technology', pestleCategory: 'Technology',
      polarity: 'positive', noveltyScore: 0.72, strengthScore: 0.65, confidenceScore: 0.7, momentumScore: 0.6,
      evidenceDate: '2026-01-14', tags: ['conversational', 'commerce', 'chat', 'search'],
    },
    {
      id: 'sig-4', documentId: 'doc-4', sourceId: 'src-4',
      title: 'Retail media ad revenue surpassing traditional digital in grocery',
      summary: 'Retail media networks now account for 12% of total grocery digital ad spend — up 40% YoY.',
      signalType: 'economic', pestleCategory: 'Economic',
      polarity: 'positive', noveltyScore: 0.7, strengthScore: 0.85, confidenceScore: 0.88, momentumScore: 0.75,
      evidenceDate: '2026-01-15', tags: ['retail-media', 'advertising', 'revenue', 'grocery'],
    },
    {
      id: 'sig-5', documentId: 'doc-5', sourceId: 'src-4',
      title: 'Sponsored placements degrading search relevance in some markets',
      summary: 'Consumer trust declining when sponsored products dominate zero-click search results.',
      signalType: 'risk', pestleCategory: 'Social',
      polarity: 'negative', noveltyScore: 0.65, strengthScore: 0.7, confidenceScore: 0.72, momentumScore: 0.55,
      evidenceDate: '2026-01-16', tags: ['retail-media', 'trust', 'relevance', 'sponsored'],
    },
    {
      id: 'sig-6', documentId: 'doc-6', sourceId: 'src-5',
      title: 'Hyper-personalisation driving 18% basket size uplift in pilots',
      summary: 'AI-driven personalised recommendations producing measurable basket uplift in controlled trials.',
      signalType: 'technology', pestleCategory: 'Technology',
      polarity: 'positive', noveltyScore: 0.8, strengthScore: 0.75, confidenceScore: 0.76, momentumScore: 0.7,
      evidenceDate: '2026-01-20', tags: ['personalisation', 'recommendations', 'basket', 'AI'],
    },
    {
      id: 'sig-7', documentId: 'doc-7', sourceId: 'src-6',
      title: 'Recipe-to-cart reducing planning friction for weekly shoppers',
      summary: 'Recipe-driven shopping tools increasing average session value for engaged users.',
      signalType: 'consumer', pestleCategory: 'Social',
      polarity: 'positive', noveltyScore: 0.62, strengthScore: 0.6, confidenceScore: 0.65, momentumScore: 0.5,
      evidenceDate: '2026-01-22', tags: ['recipe', 'cart', 'meal-planning', 'personalisation'],
    },
  ];

  // Seed four approved trends — the canonical Online Grocery / Retail Search mock trends
  // These are required for Phase 3 strategic analysis to work on fresh load.
  state.trends = [
    {
      id: 'trend-ai-grocery-search',
      name: 'AI-assisted grocery discovery',
      status: 'approved',
      summary: 'Retailers are deploying AI-powered natural language search to help shoppers discover products faster, reduce zero-result rates, and increase basket conversion. Consumer adoption is accelerating with 34%+ of online grocery users having tried an AI assistant.',
      horizon: 'short',
      likelihoodScore: 0.82,
      confidenceScore: 0.85,
      momentumScore: 0.80,
      impactScore: 0.92,
      maturityStage: 'emerging',
      relatedSignalIds: ['sig-1', 'sig-2'],
      drivers: ['Improving NLP model quality', 'Consumer comfort with AI tools', 'Competitive pressure from pure-play e-commerce'],
      blockers: ['Data quality and catalogue coverage', 'Customer trust in AI recommendations', 'Integration complexity'],
      whatNeedsToBeTrue: ['NLP accuracy >90% on grocery queries', 'Shopper willingness to use conversational interfaces', 'Internal data pipelines ready for real-time inference'],
      leadingIndicators: ['Number of retailers publicly launching AI search', 'Zero-result rate trends in pilot markets', 'Consumer survey data on AI tool usage'],
      monitoringQuestions: ['Which retailers have launched AI search in ANZ?', 'What is the reported impact on conversion?', 'How are customers responding to AI-generated results?'],
      recommendedActions: ['Run a time-boxed AI search pilot on a single product category', 'Define success metrics before launch', 'Monitor competitor AI search feature announcements'],
      createdAt: '2026-01-15',
      updatedAt: '2026-01-20',
    },
    {
      id: 'trend-retail-media-maturation',
      name: 'Retail media influence on search outcomes',
      status: 'approved',
      summary: 'Retail media ad revenue in grocery is growing 40% YoY. Sponsored placements are increasingly influencing what appears in search results, creating tension between commercial objectives and shopper relevance. Trust risk is emerging as a counter-signal.',
      horizon: 'short',
      likelihoodScore: 0.85,
      confidenceScore: 0.88,
      momentumScore: 0.75,
      impactScore: 0.78,
      maturityStage: 'growth',
      relatedSignalIds: ['sig-4', 'sig-5'],
      drivers: ['Third-party cookie deprecation', 'First-party data value', 'Retailer diversification of revenue streams'],
      blockers: ['Customer trust erosion if relevance degrades', 'Regulatory scrutiny on ad disclosure', 'Measurement complexity'],
      whatNeedsToBeTrue: ['Sponsored placements can coexist with relevant organic results', 'Retailers can measure both ad revenue and shopper satisfaction', 'Transparency tools reduce customer concern'],
      leadingIndicators: ['ANZ grocery retail media revenue growth', 'Consumer trust scores in AI-powered search', 'Regulatory announcements on algorithmic ad disclosure'],
      monitoringQuestions: ['What percentage of search results are sponsored in key categories?', 'Is customer satisfaction correlated with sponsored placement density?', 'Are regulators signalling disclosure requirements?'],
      recommendedActions: ['Audit current sponsored placement density vs relevance scores', 'Establish customer trust measurement baseline', 'Evaluate transparency labelling options'],
      createdAt: '2026-01-15',
      updatedAt: '2026-01-20',
    },
    {
      id: 'trend-conversational-commerce',
      name: 'Conversational commerce in grocery',
      status: 'approved',
      summary: 'Chat-based and voice-driven shopping interfaces are emerging as a complementary channel to keyword search. Early pilots show basket abandonment reduction and increased engagement for complex multi-item orders.',
      horizon: 'medium',
      likelihoodScore: 0.65,
      confidenceScore: 0.70,
      momentumScore: 0.60,
      impactScore: 0.72,
      maturityStage: 'emerging',
      relatedSignalIds: ['sig-3'],
      drivers: ['Consumer familiarity with chat interfaces (WhatsApp, Messenger)', 'Voice assistant penetration in home', 'Grocery complexity suits conversational UX'],
      blockers: ['Voice accuracy for grocery SKUs is still limited', 'Platform fragmentation', 'Low consumer awareness of grocery voice commerce'],
      whatNeedsToBeTrue: ['Voice recognition accuracy >95% on grocery product names', 'Shopper willingness to use voice for grocery', 'API integrations with major voice platforms available'],
      leadingIndicators: ['Voice assistant grocery commerce announcements', 'Chat-based grocery pilot launch count', 'Consumer survey data on voice grocery interest'],
      monitoringQuestions: ['Which platforms are launching grocery voice commerce in ANZ?', 'What is the task completion rate in chat-based grocery pilots?', 'Are younger shopper cohorts adopting conversational shopping?'],
      recommendedActions: ['Monitor voice platform grocery API availability', 'Test a limited conversational ordering pilot via chat', 'Survey shopper interest in voice-based repeat ordering'],
      createdAt: '2026-01-15',
      updatedAt: '2026-01-20',
    },
    {
      id: 'trend-personalised-recommendations',
      name: 'AI-powered personalised product recommendations',
      status: 'approved',
      summary: 'AI-driven personalised recommendations are generating measurable basket uplift (18%+ in pilots) and improving repeat purchase rates. Hyper-personalisation beyond category-level is emerging as the next step, enabled by first-party purchase history and browsing data.',
      horizon: 'short',
      likelihoodScore: 0.78,
      confidenceScore: 0.76,
      momentumScore: 0.70,
      impactScore: 0.82,
      maturityStage: 'growth',
      relatedSignalIds: ['sig-6', 'sig-7'],
      drivers: ['Rich first-party data available in grocery', 'Proven basket uplift from personalisation', 'Consumer expectation of relevance set by streaming and social platforms'],
      blockers: ['Data privacy concerns and consent requirements', 'Recommendation diversity vs filter bubble risk', 'Model refresh latency'],
      whatNeedsToBeTrue: ['Customer consents to personalisation use', 'Recommendation models refresh at least daily', 'Personalisation does not conflict with sponsored placement objectives'],
      leadingIndicators: ['Basket size uplift in personalisation cohort vs control', 'Customer opt-in rate for personalised recommendations', 'Competitor personalisation feature launches'],
      monitoringQuestions: ['What is the current personalisation coverage across the product catalogue?', 'How does personalisation interact with sponsored placement ranking?', 'Are privacy regulations changing consent requirements?'],
      recommendedActions: ['Expand personalisation from category to SKU level', 'Implement a basket uplift measurement framework', 'Review consent and transparency approach against emerging regulation'],
      createdAt: '2026-01-15',
      updatedAt: '2026-01-20',
    },
  ];

  // Seed the Woolworths NZ strategic context for Phase 3
  state.strategicContext = {
    id: 'ctx-woolworths-nz',
    industryProfileId: 'ind-1',
    companyName: 'Woolworths NZ',
    businessModel: 'Online grocery retailer providing AI-enhanced discovery, search, and personalised shopping experiences',
    targetCustomers: ['Home shoppers', 'Busy families', 'Health-conscious consumers', 'Budget-conscious shoppers'],
    strategicGoals: [
      'Improve search conversion and reduce zero-result rates',
      'Increase average basket size through personalisation',
      'Grow retail media revenue without degrading customer experience',
      'Build AI-assisted discovery capabilities ahead of competitors',
      'Improve customer trust in algorithmic recommendations',
    ],
    currentCapabilities: [
      'Keyword search with basic relevance ranking',
      'Retail media placement system',
      'Customer purchase history and first-party data',
      'Basic category-level personalisation',
      'Analytics event tracking',
      'Mobile app and web storefront',
    ],
    constraints: [
      'Data quality varies across product catalogue',
      'Sponsored placement revenue goals may conflict with search relevance',
      'Limited AI/ML implementation capacity',
      'Customer trust is critical — high reputational risk from poor AI behaviour',
      'Regulatory concern around AI transparency and ad disclosure may increase',
    ],
    riskAppetite: 'medium',
    planningHorizons: ['3 months', '6 months', '12 months', '24 months'],
  };

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

export function clearDynamicData() {
  if (globalThis.__mockRepoState) {
    globalThis.__mockRepoState.signals = [];
    globalThis.__mockRepoState.trends = [];
    globalThis.__mockRepoState.evidences = [];
    globalThis.__mockRepoState.assumptions = [];
    globalThis.__mockRepoState.leadingIndicators = [];
    globalThis.__mockRepoState.strategicImplications = [];
    globalThis.__mockRepoState.scenarios = [];
    globalThis.__mockRepoState.strategicOptions = [];
    globalThis.__mockRepoState.decisionBriefs = [];
    globalThis.__mockRepoState.roadmapItems = [];
  }
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
export function getEvidences(): EvidenceLink[] {
  return [...globalThis.__mockRepoState!.evidences];
}

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

// ==========================================
// Phase 2: Monitoring Repository Operations
// ==========================================

export function getMonitoringRules(): MonitoringRule[] {
  return [...globalThis.__mockRepoState!.rules];
}

export function saveMonitoringRule(rule: MonitoringRule): void {
  const current = globalThis.__mockRepoState!.rules;
  const idx = current.findIndex(r => r.id === rule.id);
  if (idx !== -1) current[idx] = rule;
  else current.push(rule);
}

export function updateMonitoringRule(ruleId: string, patch: Partial<MonitoringRule>): void {
  const idx = globalThis.__mockRepoState!.rules.findIndex(r => r.id === ruleId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.rules[idx] = { ...globalThis.__mockRepoState!.rules[idx], ...patch } as MonitoringRule;
  }
}

export function getMonitoringRuns(): MonitoringRun[] {
  return [...globalThis.__mockRepoState!.runs];
}

export function saveMonitoringRun(run: MonitoringRun): void {
  const current = globalThis.__mockRepoState!.runs;
  const idx = current.findIndex(r => r.id === run.id);
  if (idx !== -1) current[idx] = run;
  else current.push(run);
}

export function updateMonitoringRun(runId: string, patch: Partial<MonitoringRun>): void {
  const idx = globalThis.__mockRepoState!.runs.findIndex(r => r.id === runId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.runs[idx] = { ...globalThis.__mockRepoState!.runs[idx], ...patch } as MonitoringRun;
  }
}

export function getSourceSnapshots(sourceId: string): SourceSnapshot[] {
  return globalThis.__mockRepoState!.snapshots.filter(s => s.sourceId === sourceId);
}

export function saveSourceSnapshot(snapshot: SourceSnapshot): void {
  const current = globalThis.__mockRepoState!.snapshots;
  const idx = current.findIndex(s => s.id === snapshot.id);
  if (idx !== -1) current[idx] = snapshot;
  else current.push(snapshot);
}

export function getChangeEvents(): ChangeEvent[] {
  return [...globalThis.__mockRepoState!.changeEvents];
}

export function saveChangeEvents(events: ChangeEvent[]): void {
  globalThis.__mockRepoState!.changeEvents.push(...events);
}

export function getTrendScoreSnapshots(trendId: string): TrendScoreSnapshot[] {
  return globalThis.__mockRepoState!.trendScoreSnapshots.filter(s => s.trendId === trendId);
}

export function saveTrendScoreSnapshot(snapshot: TrendScoreSnapshot): void {
  const current = globalThis.__mockRepoState!.trendScoreSnapshots;
  const idx = current.findIndex(s => s.id === snapshot.id);
  if (idx !== -1) current[idx] = snapshot;
  else current.push(snapshot);
}

export function getTrendScoreChanges(trendId: string): TrendScoreChange[] {
  return globalThis.__mockRepoState!.trendScoreChanges.filter(c => c.trendId === trendId);
}

export function saveTrendScoreChange(change: TrendScoreChange): void {
  const current = globalThis.__mockRepoState!.trendScoreChanges;
  const idx = current.findIndex(c => c.id === change.id);
  if (idx !== -1) current[idx] = change;
  else current.push(change);
}

export function getAlerts(): Alert[] {
  return [...globalThis.__mockRepoState!.alerts];
}

export function saveAlerts(alerts: Alert[]): void {
  globalThis.__mockRepoState!.alerts.push(...alerts);
}

export function acknowledgeAlert(alertId: string): void {
  const idx = globalThis.__mockRepoState!.alerts.findIndex(a => a.id === alertId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.alerts[idx] = { ...globalThis.__mockRepoState!.alerts[idx], acknowledged: true };
  }
}

export function getWhatChangedSummaries(): WhatChangedSummary[] {
  return [...globalThis.__mockRepoState!.summaries];
}

export function saveWhatChangedSummary(summary: WhatChangedSummary): void {
  const current = globalThis.__mockRepoState!.summaries;
  const idx = current.findIndex(s => s.id === summary.id);
  if (idx !== -1) current[idx] = summary;
  else current.push(summary);
}

export type { SourceStatus, TrendStatus };

// ==============================
// Phase 3 Repository Functions
// ==============================

export function getStrategicContext(): StrategicContext | null {
  return globalThis.__mockRepoState!.strategicContext;
}

export function saveStrategicContext(ctx: StrategicContext): void {
  globalThis.__mockRepoState!.strategicContext = ctx;
}

export function getAssumptions(): Assumption[] {
  return [...globalThis.__mockRepoState!.assumptions];
}

export function saveAssumptions(items: Assumption[]): void {
  const current = globalThis.__mockRepoState!.assumptions;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function updateAssumption(id: string, patch: Partial<Assumption>): void {
  const list = globalThis.__mockRepoState!.assumptions;
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
}

export function getLeadingIndicators(): LeadingIndicator[] {
  return [...globalThis.__mockRepoState!.leadingIndicators];
}

export function saveLeadingIndicators(items: LeadingIndicator[]): void {
  const current = globalThis.__mockRepoState!.leadingIndicators;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function updateLeadingIndicator(id: string, patch: Partial<LeadingIndicator>): void {
  const list = globalThis.__mockRepoState!.leadingIndicators;
  const idx = list.findIndex(li => li.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
}

export function getStrategicImplications(): StrategicImplication[] {
  return [...globalThis.__mockRepoState!.strategicImplications];
}

export function saveStrategicImplications(items: StrategicImplication[]): void {
  const current = globalThis.__mockRepoState!.strategicImplications;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function getScenarios(): Scenario[] {
  return [...globalThis.__mockRepoState!.scenarios];
}

export function saveScenarios(items: Scenario[]): void {
  const current = globalThis.__mockRepoState!.scenarios;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function getStrategicOptions(): StrategicOption[] {
  return [...globalThis.__mockRepoState!.strategicOptions];
}

export function saveStrategicOptions(items: StrategicOption[]): void {
  const current = globalThis.__mockRepoState!.strategicOptions;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function updateStrategicOption(id: string, patch: Partial<StrategicOption>): void {
  const list = globalThis.__mockRepoState!.strategicOptions;
  const idx = list.findIndex(o => o.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
}

export function getDecisionBriefs(): DecisionBrief[] {
  return [...globalThis.__mockRepoState!.decisionBriefs];
}

export function saveDecisionBrief(brief: DecisionBrief): void {
  const list = globalThis.__mockRepoState!.decisionBriefs;
  const idx = list.findIndex(b => b.id === brief.id);
  if (idx !== -1) list[idx] = brief;
  else list.push(brief);
}

export function getRoadmapItems(): RoadmapItem[] {
  return [...globalThis.__mockRepoState!.roadmapItems];
}

export function saveRoadmapItems(items: RoadmapItem[]): void {
  const current = globalThis.__mockRepoState!.roadmapItems;
  items.forEach(item => {
    const idx = current.findIndex(a => a.id === item.id);
    if (idx !== -1) current[idx] = item;
    else current.push(item);
  });
}

export function updateRoadmapItem(id: string, patch: Partial<RoadmapItem>): void {
  const list = globalThis.__mockRepoState!.roadmapItems;
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
}
