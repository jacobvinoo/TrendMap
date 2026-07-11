import type { TrendMapRepository } from './TrendMapRepository';
import type { 
  IndustryProfile, Source, SourceStatus, Document, Signal, Trend, TrendStatus, EvidenceLink, TrendScoreSnapshot, TrendTheme,
  SemanticSearchResult, DataExportResult, DataHealthSummary, DataImportResult, DataClearResult,
  ForecastCalibrationResult, KnowledgeGraphBuildResult, KnowledgeGraphNeighborhood, SourceReliabilityResult, InsightSummary,
  AuditEvent, NewsScanResult
} from '../types';
import * as mockRepo from '../mockRepository';
import { generateInsightSummary } from '../insightSummary';

export class LocalMockRepository implements TrendMapRepository {
  async getIndustryProfile(): Promise<IndustryProfile | null> {
    return mockRepo.getIndustryProfile();
  }

  async saveIndustryProfile(profile: IndustryProfile): Promise<void> {
    mockRepo.saveIndustryProfile(profile);
  }

  async getTrendThemes(): Promise<TrendTheme[]> {
    return mockRepo.getTrendThemes();
  }

  async deriveTrendThemes(industryId?: string): Promise<TrendTheme[]> {
    const profile = mockRepo.getIndustryProfile();
    const now = new Date().toISOString();
    const defaults: TrendTheme[] = [
      {
        id: 'theme-shopper-value',
        industryId: industryId || profile?.id,
        name: 'Shopper value and affordability',
        description: 'Price sensitivity, private label, promotions, loyalty mechanics, and value perception.',
        keywords: ['price', 'value', 'promotion', 'private label', 'loyalty'],
        status: 'suggested',
        origin: 'agent',
        evidenceSummary: 'Suggested from saved industry context.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'theme-digital-discovery',
        industryId: industryId || profile?.id,
        name: 'Digital grocery discovery and personalisation',
        description: 'Search, recommendations, conversational shopping, product discovery, and basket-building journeys.',
        keywords: ['search', 'recommendation', 'personalisation', 'ai', 'basket'],
        status: 'suggested',
        origin: 'agent',
        evidenceSummary: 'Suggested from saved industry context.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'theme-fulfilment',
        industryId: industryId || profile?.id,
        name: 'Fulfilment, availability, and convenience',
        description: 'Delivery, pickup, substitution, stock availability, and service promises.',
        keywords: ['delivery', 'pickup', 'availability', 'substitution', 'fulfilment'],
        status: 'suggested',
        origin: 'agent',
        evidenceSummary: 'Suggested from saved industry context.',
        createdAt: now,
        updatedAt: now,
      },
    ];
    const existing = mockRepo.getTrendThemes();
    const merged = [...existing];
    for (const theme of defaults) {
      if (!merged.some((item) => item.name.toLowerCase() === theme.name.toLowerCase())) {
        merged.push(theme);
      }
    }
    mockRepo.saveTrendThemes(merged);
    return merged;
  }

  async createTrendTheme(theme: Partial<TrendTheme>): Promise<TrendTheme> {
    const now = new Date().toISOString();
    const created: TrendTheme = {
      id: theme.id || `theme-manual-${Date.now()}`,
      industryId: theme.industryId,
      name: theme.name || 'Manual theme',
      description: theme.description || '',
      keywords: theme.keywords || [],
      status: theme.status || 'approved',
      origin: theme.origin || 'manual',
      evidenceSummary: theme.evidenceSummary || '',
      createdAt: now,
      updatedAt: now,
    };
    mockRepo.saveTrendThemes([...mockRepo.getTrendThemes(), created]);
    return created;
  }

  async updateTrendTheme(themeId: string, patch: Partial<TrendTheme>): Promise<void> {
    mockRepo.updateTrendTheme(themeId, patch);
  }

  async getSources(): Promise<Source[]> {
    return mockRepo.getSources();
  }

  async createSource(source: Partial<Source>): Promise<Source> {
    const created: Source = {
      id: source.id || `src-manual-${Date.now()}`,
      name: source.name || 'Manual source',
      url: source.url || '',
      sourceType: source.sourceType || 'news',
      credibilityScore: source.credibilityScore ?? 0.7,
      relevanceScore: source.relevanceScore ?? 0.7,
      freshnessScore: source.freshnessScore ?? 0.7,
      status: source.status || 'suggested',
      notes: source.notes || 'Manually added by analyst.',
      createdAt: source.createdAt || new Date().toISOString(),
      updatedAt: source.updatedAt || new Date().toISOString(),
    };
    mockRepo.saveSources([...mockRepo.getSources(), created]);
    return created;
  }

  async discoverSources(): Promise<Source[]> {
    const now = new Date().toISOString();
    const approvedThemes = mockRepo.getTrendThemes().filter((theme) => theme.status === 'approved');
    const profile = mockRepo.getIndustryProfile();
    const themeText = approvedThemes.map((theme) => theme.name).join(', ') || 'broad industry context';
    const candidates: Source[] = [
      {
        id: 'src-theme-retail-dive',
        name: 'Retail Dive',
        url: 'https://www.retaildive.com/',
        sourceType: 'news',
        credibilityScore: 0.78,
        relevanceScore: 0.78,
        freshnessScore: 0.72,
        status: 'suggested',
        notes: `Suggested for ${profile?.name || 'the saved industry'} themes: ${themeText}.`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'src-theme-grocery-dive',
        name: 'Grocery Dive',
        url: 'https://www.grocerydive.com/',
        sourceType: 'news',
        credibilityScore: 0.78,
        relevanceScore: 0.82,
        freshnessScore: 0.72,
        status: 'suggested',
        notes: `Suggested for ${profile?.name || 'the saved industry'} themes: ${themeText}.`,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const existing = mockRepo.getSources();
    const merged = [...existing];
    for (const candidate of candidates) {
      if (!merged.some((source) => source.url.replace(/\/$/, '') === candidate.url.replace(/\/$/, ''))) {
        merged.push(candidate);
      }
    }
    mockRepo.saveSources(merged);
    return candidates;
  }

  async scanNewsForSources(): Promise<NewsScanResult> {
    throw new Error('News scanning requires the database API so TrendMap can fetch RSS/news feeds and save discovered source candidates.');
  }

  async updateSourceStatus(sourceId: string, status: SourceStatus): Promise<void> {
    mockRepo.updateSourceStatus(sourceId, status);
  }

  async updateSourceNote(sourceId: string, note: string): Promise<void> {
    mockRepo.updateSourceNote(sourceId, note);
  }

  async deleteSource(sourceId: string): Promise<void> {
    mockRepo.deleteSource(sourceId);
  }

  async getDocuments(): Promise<Document[]> {
    return mockRepo.getDocuments();
  }

  async createDocument(document: Partial<Document>): Promise<Document> {
    const created: Document = {
      id: document.id || `doc-manual-${Date.now()}`,
      sourceId: document.sourceId || '',
      title: document.title || 'Manual document',
      publishedDate: document.publishedDate || new Date().toISOString(),
      content: document.content || '',
      url: document.url || '',
      ingestionStatus: document.ingestionStatus || 'raw',
      extractedSignalIds: document.extractedSignalIds || [],
    };
    mockRepo.saveDocuments([...mockRepo.getDocuments(), created]);
    return created;
  }

  async uploadDocument(file: File, metadata: Partial<Document>): Promise<Document> {
    const text = await file.text();
    return this.createDocument({
      ...metadata,
      title: metadata.title || file.name,
      content: text,
      url: metadata.url || '',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    mockRepo.deleteDocument(documentId);
  }

  async updateDocumentIngestionStatus(documentId: string, status: string): Promise<void> {
    mockRepo.updateDocumentIngestionStatus(documentId, status as any);
  }

  async updateDocumentExtractedSignals(documentId: string, signalIds: string[]): Promise<void> {
    mockRepo.updateDocumentExtractedSignals(documentId, signalIds);
  }

  async getSignals(): Promise<Signal[]> {
    return mockRepo.getSignals();
  }

  async saveSignals(signals: Signal[]): Promise<void> {
    mockRepo.saveSignals(signals);
  }

  async getSignalHistory(_signalId: string): Promise<AuditEvent[]> {
    return [];
  }

  async extractSignalsFromDocument(documentId: string): Promise<Signal[]> {
    // Simulate network/LLM delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const docs = await this.getDocuments();
    const doc = docs.find(d => d.id === documentId);
    if (!doc) throw new Error(`Document not found: ${documentId}`);

    const newSignals: Signal[] = [
      {
        id: `sig-${doc.id}-1`,
        documentId: doc.id,
        sourceId: doc.sourceId,
        title: `Mock Signal for AI-assisted search relevance from ${doc.title}`,
        summary: "This is an auto-generated mock signal showing early adoption patterns.",
        signalType: "technology",
        polarity: "positive",
        pestleCategory: "technology",
        noveltyScore: 0.9,
        strengthScore: 0.9,
        confidenceScore: 0.9,
        evidenceDate: new Date().toISOString(),
        tags: ["mock", "ai-assisted", "tech"],
        created_at: new Date().toISOString(),
        logs: [{ date: new Date().toISOString(), message: 'Signal generated from AI extraction' }]
      },
      {
        id: `sig-${doc.id}-2`,
        documentId: doc.id,
        sourceId: doc.sourceId,
        title: `Mock Signal for retail media influence from ${doc.title}`,
        summary: "This is an auto-generated mock signal indicating regulatory shifts.",
        signalType: "regulatory",
        polarity: "neutral",
        pestleCategory: "political",
        noveltyScore: 0.8,
        strengthScore: 0.7,
        confidenceScore: 0.85,
        evidenceDate: new Date().toISOString(),
        tags: ["mock", "retail media"],
        created_at: new Date().toISOString(),
        logs: [{ date: new Date().toISOString(), message: 'Signal generated from AI extraction' }]
      }
    ];

    // Save signals
    await this.saveSignals(newSignals);

    // Update document status
    doc.ingestionStatus = 'extracted';
    doc.extractedSignalIds = (doc.extractedSignalIds || []).concat(newSignals.map(s => s.id));
    await this.updateDocumentIngestionStatus(doc.id, doc.ingestionStatus);
    await this.updateDocumentExtractedSignals(doc.id, doc.extractedSignalIds);

    return newSignals;
  }

  async extractSignal(documentId: string, sourceId: string, title: string, noveltyScore: number): Promise<Signal> {
    // Basic mock implementation mapping to saveSignals
    const newSignal: Signal = {
      id: `sig-${Date.now()}`,
      documentId,
      sourceId,
      title,
      summary: '',
      signalType: 'other',
      pestleCategory: 'technology',
      noveltyScore,
      strengthScore: 0.5,
      confidenceScore: 0.5,
      evidenceDate: new Date().toISOString().split('T')[0],
      tags: []
    };
    const current = mockRepo.getSignals();
    mockRepo.saveSignals([...current, newSignal]);
    return newSignal;
  }

  async getTrends(): Promise<Trend[]> {
    return mockRepo.getTrends();
  }

  async getTrendHistory(_trendId: string): Promise<AuditEvent[]> {
    return [];
  }

  async clusterTrend(name: string, status: TrendStatus): Promise<Trend> {
    const newTrend: Trend = {
      id: `trend-${Date.now()}`,
      name,
      status,
      summary: '',
      horizon: '12_months',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const current = mockRepo.getTrends();
    mockRepo.saveTrends([...current, newTrend]);
    return newTrend;
  }

  async updateTrend(id: string, updates: Partial<Trend>): Promise<void> {
    mockRepo.updateTrend(id, updates);
  }

  async saveTrends(trends: Trend[]): Promise<Trend[]> {
    mockRepo.saveTrends(trends);
    return trends;
  }

  async addEvidence(evidence: any[]): Promise<void> {
    mockRepo.addEvidence(evidence as any);
  }

  async getRelatedSignals(trendId: string): Promise<Signal[]> {
    return mockRepo.getSignals().filter((s: any) => s.metadata?.trendId === trendId);
  }

  async getEvidenceForTrend(trendId: string): Promise<EvidenceLink[]> {
    return mockRepo.getEvidenceForTrend(trendId);
  }

  async getInsightSummary(industryProfileId?: string): Promise<InsightSummary> {
    const trends = mockRepo.getTrends();
    const profile = mockRepo.getIndustryProfile();
    // Default mock uses basic deterministic generation identical to previous UI logic
    return generateInsightSummary(trends, industryProfileId || profile?.id || 'default');
  }

  async getTrendScoreSnapshots(trendId: string): Promise<TrendScoreSnapshot[]> {
    return mockRepo.getTrendScoreSnapshots(trendId);
  }

  async saveTrendScoreSnapshot(snapshot: TrendScoreSnapshot): Promise<void> {
    mockRepo.saveTrendScoreSnapshot(snapshot);
  }

  // Phase 2
  async getMonitoringRules() { return mockRepo.getMonitoringRules(); }
  async saveMonitoringRule(rule: any) { mockRepo.saveMonitoringRule(rule); }
  async deleteMonitoringRule(ruleId: string): Promise<void> {
    mockRepo.deleteMonitoringRule(ruleId);
  }

  async runMonitoringRule(ruleId: string, scenario: 'baseline' | 'new_activity' | 'contradictory_activity' = 'new_activity'): Promise<any> {
    const { runMonitoringRule } = await import('../monitoringRun');
    return runMonitoringRule(ruleId, scenario);
  }

  async getMonitoringRuns(): Promise<any[]> { return mockRepo.getMonitoringRuns(); }
  async getWhatChangedSummaries() { return mockRepo.getWhatChangedSummaries(); }
  async getAlerts() { return mockRepo.getAlerts(); }
  async acknowledgeAlert(alertId: string) { mockRepo.acknowledgeAlert(alertId); }

  // Phase 3
  async getStrategicContext() { return mockRepo.getStrategicContext(); }
  async saveStrategicContext(context: any) { mockRepo.saveStrategicContext(context); }
  async getAssumptions() { return mockRepo.getAssumptions(); }
  async saveAssumptions(assumptions: any[]) { mockRepo.saveAssumptions(assumptions); }
  async updateAssumption(assumptionId: string, patch: any) { mockRepo.updateAssumption(assumptionId, patch); }
  async getLeadingIndicators() { return mockRepo.getLeadingIndicators(); }
  async updateLeadingIndicator(indicatorId: string, patch: any) { mockRepo.updateLeadingIndicator(indicatorId, patch); }
  async getStrategicImplications() { return mockRepo.getStrategicImplications(); }
  async saveStrategicImplications(implications: any[]) { mockRepo.saveStrategicImplications(implications); }
  async getScenarios() { return mockRepo.getScenarios(); }
  async saveScenarios(scenarios: any[]) { mockRepo.saveScenarios(scenarios); }
  async getStrategicOptions() { return mockRepo.getStrategicOptions(); }
  async saveStrategicOptions(options: any[]) { mockRepo.saveStrategicOptions(options); }
  async updateStrategicOption(optionId: string, patch: any) { mockRepo.updateStrategicOption(optionId, patch); }
  async getDecisionBriefs() { return mockRepo.getDecisionBriefs(); }
  async saveDecisionBrief(brief: any) { mockRepo.saveDecisionBrief(brief); }
  async getRoadmapItems() { return mockRepo.getRoadmapItems(); }
  async saveRoadmapItems(items: any[]) { mockRepo.saveRoadmapItems(items); }
  async updateRoadmapItem(itemId: string, patch: any) { mockRepo.updateRoadmapItem(itemId, patch); }

  // Phase 4
  async getAgentActivities(): Promise<any[]> {
    return mockRepo.getAgentActivities();
  }

  async logAgentActivity(activity: any): Promise<void> {
    mockRepo.logAgentActivity(activity);
  }

  async getPredictions(): Promise<any[]> {
    return mockRepo.getPredictions();
  }

  async savePrediction(prediction: any): Promise<void> {
    mockRepo.savePrediction(prediction);
  }

  async getDebates(): Promise<any[]> {
    return mockRepo.getDebates();
  }

  async saveDebate(debate: any): Promise<void> {
    mockRepo.saveDebate(debate);
  }

  async addKGNode(node: any): Promise<void> {
    mockRepo.addKGNode(node);
  }

  async addKGEdge(edge: any): Promise<void> {
    mockRepo.addKGEdge(edge);
  }

  // Phase 2: Score History & Snapshots
  async getScoreHistory(trendId: string): Promise<{ snapshots: any[]; changes: any[] }> {
    return {
      snapshots: mockRepo.getTrendScoreSnapshots(trendId),
      changes: mockRepo.getTrendScoreChanges(trendId)
    };
  }

  async saveSourceSnapshot(snapshot: any): Promise<void> {
    mockRepo.saveSourceSnapshot(snapshot);
  }

  async getSourceSnapshots(sourceId: string): Promise<any[]> {
    return mockRepo.getSourceSnapshots(sourceId);
  }

  async saveChangeEvent(event: any): Promise<void> {
    mockRepo.saveChangeEvents([event]);
  }

  async getChangeEvents(): Promise<any[]> {
    return mockRepo.getChangeEvents();
  }

  async searchSemantic(
    query: string,
    entityTypes?: string[],
    filters?: Record<string, any>,
    limit = 10
  ): Promise<SemanticSearchResult[]> {
    const normalizedQuery = query.toLowerCase();
    const tokens = normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean);
    const include = (entityType: string) => !entityTypes || entityTypes.includes(entityType);
    const matchesFilters = (metadata: Record<string, any>) => {
      if (!filters) return true;
      return Object.entries(filters).every(([key, value]) => metadata[key] === value);
    };

    const candidates: SemanticSearchResult[] = [];

    if (include('trend')) {
      for (const trend of mockRepo.getTrends()) {
        const text = `${trend.name} ${trend.summary} ${trend.recommendedActions.join(' ')}`;
        const score = this.localSearchScore(tokens, text);
        if (score > 0 && matchesFilters({ status: trend.status })) {
          candidates.push({
            entityType: 'trend',
            entityId: trend.id,
            relevanceScore: score,
            evidenceSnippet: text,
            metadata: { title: trend.name, status: trend.status }
          });
        }
      }
    }

    if (include('source')) {
      for (const source of mockRepo.getSources()) {
        const text = `${source.name} ${source.sourceType} ${source.notes}`;
        const score = this.localSearchScore(tokens, text);
        if (score > 0 && matchesFilters({ status: source.status, sourceType: source.sourceType })) {
          candidates.push({
            entityType: 'source',
            entityId: source.id,
            relevanceScore: score,
            evidenceSnippet: text,
            metadata: { title: source.name, status: source.status, sourceType: source.sourceType }
          });
        }
      }
    }

    if (include('document')) {
      for (const document of mockRepo.getDocuments()) {
        const text = `${document.title} ${document.content}`;
        const score = this.localSearchScore(tokens, text);
        if (score > 0 && matchesFilters({ sourceId: document.sourceId })) {
          candidates.push({
            entityType: 'document',
            entityId: document.id,
            relevanceScore: score,
            evidenceSnippet: text,
            metadata: { title: document.title, sourceId: document.sourceId }
          });
        }
      }
    }

    if (include('signal')) {
      for (const signal of mockRepo.getSignals()) {
        const text = `${signal.title} ${signal.summary} ${signal.tags.join(' ')}`;
        const score = this.localSearchScore(tokens, text);
        if (score > 0 && matchesFilters({ sourceId: signal.sourceId })) {
          candidates.push({
            entityType: 'signal',
            entityId: signal.id,
            relevanceScore: score,
            evidenceSnippet: text,
            metadata: { title: signal.title, sourceId: signal.sourceId }
          });
        }
      }
    }

    return candidates
      .sort((left, right) => right.relevanceScore - left.relevanceScore)
      .slice(0, limit);
  }

  async exportTrend(trendId: string): Promise<DataExportResult> {
    const trend = mockRepo.getTrends().find((item) => item.id === trendId);
    return {
      export: this.operationRecord('export', 'trend'),
      payload: {
        trend,
        evidenceLinks: mockRepo.getEvidenceForTrend(trendId)
      }
    };
  }

  async exportIndustry(industryId: string): Promise<DataExportResult> {
    return {
      export: this.operationRecord('export', 'industry'),
      payload: {
        industry: mockRepo.getIndustryProfile(),
        sources: mockRepo.getSources(),
        trends: mockRepo.getTrends(),
        requestedIndustryId: industryId
      }
    };
  }

  async importSources(sources: Partial<Source>[]): Promise<DataImportResult> {
    const existing = mockRepo.getSources();
    const imported = sources.map((source, index) => ({
      id: source.id || `src-import-${Date.now()}-${index}`,
      name: source.name || 'Imported source',
      url: source.url || '',
      sourceType: source.sourceType || 'news',
      credibilityScore: source.credibilityScore ?? 0.5,
      relevanceScore: source.relevanceScore ?? 0.5,
      freshnessScore: source.freshnessScore ?? 0.5,
      status: source.status || 'suggested',
      notes: source.notes || ''
    })) as Source[];
    mockRepo.saveSources([...existing, ...imported]);
    return this.importResult('sources', imported.map((source) => source.id));
  }

  async importDocuments(documents: Partial<Document>[]): Promise<DataImportResult> {
    const existing = mockRepo.getDocuments();
    const imported = documents.map((document, index) => ({
      id: document.id || `doc-import-${Date.now()}-${index}`,
      sourceId: document.sourceId || '',
      title: document.title || 'Imported document',
      publishedDate: document.publishedDate || new Date().toISOString().slice(0, 10),
      content: document.content || '',
      url: document.url || '',
      ingestionStatus: document.ingestionStatus || 'raw',
      extractedSignalIds: document.extractedSignalIds || []
    })) as Document[];
    const merged = [...existing];
    for (const document of imported) {
      const index = merged.findIndex((item) => item.id === document.id);
      if (index >= 0) merged[index] = document;
      else merged.push(document);
    }
    mockRepo.saveDocuments(merged);
    return this.importResult('documents', imported.map((document) => document.id));
  }

  async extractDocumentsFromSources(): Promise<DataImportResult> {
    return {
      importRecord: this.operationRecord('import', 'documents'),
      importedCount: 0,
      entityIds: [],
      message: 'Document extraction did not run because this session is using browser-only storage.',
      errors: [
        'Restart with npm run dev to start the database API and frontend together.',
        'Approved sources must have real article or report URLs; placeholder example.com links will not produce useful documents.'
      ]
    };
  }

  async analyzeTrends(): Promise<Trend[]> {
    throw new Error('Trend analysis requires the database API. Restart with npm run dev so the backend can use stored documents, signals, and evidence links.');
  }

  async runDataHealthCheck(): Promise<DataHealthSummary> {
    const issues = mockRepo.getTrends()
      .filter((trend) => trend.status === 'approved' && mockRepo.getEvidenceForTrend(trend.id).length === 0)
      .map((trend) => ({
        severity: 'error',
        entityType: 'trend',
        entityId: trend.id,
        message: 'Approved trend has no evidence links.'
      }));
    return {
      status: issues.length ? 'degraded' : 'healthy',
      checksRun: 1,
      issueCount: issues.length,
      issues,
      latestChecks: [{
        id: `health-${Date.now()}`,
        component: 'data_integrity',
        status: issues.length ? 'degraded' : 'healthy',
        latencyMs: 0,
        details: JSON.stringify({ issueCount: issues.length }),
        timestamp: new Date().toISOString()
      }]
    };
  }

  async clearAnalysisData(): Promise<DataClearResult> {
    const state = globalThis.__mockRepoState;
    const deletedCounts = {
      documents: state?.documents.length || 0,
      signals: state?.signals.length || 0,
      trends: state?.trends.length || 0,
      evidence_links: state?.evidences.length || 0,
      what_changed_summaries: state?.summaries.length || 0,
    };
    if (state) {
      state.documents = [];
      state.signals = [];
      state.trends = [];
      state.evidences = [];
      state.summaries = [];
      state.alerts = [];
      state.assumptions = [];
      state.leadingIndicators = [];
      state.strategicImplications = [];
      state.debates = [];
      state.predictions = [];
      mockRepo.clearDynamicData();
    }
    return {
      status: 'cleared',
      deletedCounts,
      message: 'Browser-stored documents, signals, trends, evidence, and generated analysis data were cleared. Sources and industry setup were preserved.'
    };
  }

  async buildKnowledgeGraphForTrend(trendId: string): Promise<KnowledgeGraphBuildResult> {
    const evidence = mockRepo.getEvidenceForTrend(trendId);
    return {
      trendId,
      nodesCreated: 1 + evidence.length,
      edgesCreated: evidence.length,
      nodeIds: [trendId, ...evidence.map((item) => item.signalId)],
      edgeIds: evidence.map((item) => item.id)
    };
  }

  async getKnowledgeGraphNeighborhood(entityId: string, depth = 1): Promise<KnowledgeGraphNeighborhood> {
    return {
      centerEntityId: entityId,
      depth,
      nodes: [],
      edges: []
    };
  }

  async calculateSourceReliability(sourceId: string): Promise<SourceReliabilityResult> {
    const source = mockRepo.getSources().find((item) => item.id === sourceId);
    const documents = mockRepo.getDocuments().filter((document) => document.sourceId === sourceId);
    const evidence = mockRepo.getTrends().flatMap((trend) => mockRepo.getEvidenceForTrend(trend.id)).filter((item) => item.sourceId === sourceId);
    const reliabilityScore = source
      ? Math.min(1, Math.round(((source.credibilityScore * 0.45 + source.relevanceScore * 0.35 + source.freshnessScore * 0.2) + Math.min(0.1, documents.length * 0.02 + evidence.length * 0.03)) * 1000) / 1000)
      : 0;
    return {
      sourceId,
      reliabilityScore,
      credibilityScore: source?.credibilityScore || 0,
      relevanceScore: source?.relevanceScore || 0,
      freshnessScore: source?.freshnessScore || 0,
      evidenceCount: evidence.length,
      documentCount: documents.length,
      rationale: ['Weighted source scores and evidence coverage.']
    };
  }

  async calibratePrediction(predictionId?: string): Promise<ForecastCalibrationResult> {
    const predictions = mockRepo.getPredictions().filter((prediction) => !predictionId || prediction.id === predictionId);
    const averageConfidence = predictions.length
      ? predictions.reduce((sum, prediction) => sum + (prediction.confidenceScore || 0), 0) / predictions.length
      : 0;
    return {
      predictionId,
      evaluatedPredictions: predictions.length,
      averageConfidence: Math.round(averageConfidence * 1000) / 1000,
      averageAccuracy: 0,
      calibrationError: Math.round(averageConfidence * 1000) / 1000,
      recommendation: predictions.length ? 'Record outcomes to improve calibration.' : 'No predictions are available yet.'
    };
  }

  private localSearchScore(tokens: string[], text: string): number {
    if (tokens.length === 0) return 0;
    const normalizedText = text.toLowerCase();
    const hits = tokens.filter((token) => normalizedText.includes(token)).length;
    return Math.round((hits / tokens.length) * 1000) / 1000;
  }

  private operationRecord(operationType: string, entityType: string) {
    return {
      id: `${operationType}-${entityType}-${Date.now()}`,
      operationType,
      entityType,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }

  private importResult(entityType: string, entityIds: string[]): DataImportResult {
    return {
      importRecord: this.operationRecord('import', entityType),
      importedCount: entityIds.length,
      entityIds
    };
  }
}
