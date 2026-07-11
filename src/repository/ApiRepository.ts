import type { TrendMapRepository } from './TrendMapRepository';
import type { 
  IndustryProfile, Source, SourceStatus, Document, Signal, Trend, TrendStatus, EvidenceLink, TrendScoreSnapshot, TrendScoreChange,
  SourceSnapshot, ChangeEvent,
  MonitoringRule, MonitoringRun, WhatChangedSummary, Alert,
  StrategicContext, Assumption, LeadingIndicator, StrategicImplication, Scenario, StrategicOption, DecisionBrief, RoadmapItem,
  AgentActivity, Prediction, AgentDebate, SemanticSearchResult,
  DataExportResult, DataHealthSummary, DataImportResult, DataClearResult,
  ForecastCalibrationResult, KnowledgeGraphBuildResult,
  KnowledgeGraphNeighborhood, SourceReliabilityResult, InsightSummary, AuditEvent, NewsScanResult, TrendTheme
} from '../types';

import { keysToCamel, keysToSnake } from '../utils/caseConvert';

export class ApiRepository implements TrendMapRepository {
  // Use absolute URL in Node (Vitest) environments to prevent Invalid URL errors
  private baseUrl = typeof window !== 'undefined' ? '/api' : 'http://localhost/api';
  private csrfToken: string | null = null;

  private normalizeList(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return value.split(',').map(part => part.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private normalizeIndustryProfile(profile: any): IndustryProfile {
    return {
      id: String(profile?.id || 'ind-1'),
      name: String(profile?.name || ''),
      geography: String(profile?.geography || ''),
      description: String(profile?.description || ''),
      strategicPriorities: this.normalizeList(profile?.strategicPriorities ?? profile?.strategic_priorities),
      customerSegments: this.normalizeList(profile?.customerSegments ?? profile?.customer_segments),
      competitors: this.normalizeList(profile?.competitors),
      timeHorizons: this.normalizeList(profile?.timeHorizons ?? profile?.time_horizons),
    };
  }

  private industryContextFieldCount(profile: IndustryProfile): number {
    return profile.strategicPriorities.length
      + profile.customerSegments.length
      + profile.competitors.length
      + profile.timeHorizons.length;
  }

  private industryTimestamp(profile: any): number {
    const value = profile?.updatedAt ?? profile?.updated_at ?? profile?.createdAt ?? profile?.created_at;
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private isUnsafeMethod(method?: string): boolean {
    return !['GET', 'HEAD', 'OPTIONS'].includes((method || 'GET').toUpperCase());
  }

  private isTestMode(): boolean {
    return import.meta.env.MODE === 'test';
  }

  private readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const cookie = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  }

  private async getCsrfToken(): Promise<string | null> {
    if (this.isTestMode() || typeof window === 'undefined') return null;
    if (this.csrfToken) return this.csrfToken;

    const response = await fetch(`${this.baseUrl}/csrf`, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Failed to establish API session: ${response.status}`);
    }

    const data = await response.json();
    this.csrfToken = data.csrfToken || this.readCookie('csrftoken');
    return this.csrfToken;
  }

  private async withSessionProtection(options?: RequestInit): Promise<RequestInit | undefined> {
    if (!this.isUnsafeMethod(options?.method)) return options;

    const token = await this.getCsrfToken();
    if (!token) return options;

    const headers = new Headers(options?.headers);
    headers.set('X-CSRFToken', token);

    return {
      ...options,
      credentials: 'same-origin',
      headers,
    };
  }

  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    let requestOptions = options ? { ...options } : undefined;
    if (requestOptions?.body && typeof requestOptions.body === 'string') {
      try {
        const parsed = JSON.parse(requestOptions.body);
        requestOptions.body = JSON.stringify(keysToSnake(parsed));
      } catch (e) {
        // Not JSON, ignore
      }
    }
    requestOptions = await this.withSessionProtection(requestOptions);
    const response = await fetch(`${this.baseUrl}${url}`, requestOptions);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error ${response.status}: ${err}`);
    }
    const data = await response.json();
    return keysToCamel(data);
  }

  async getIndustryProfile(): Promise<IndustryProfile | null> {
    const industries = await this.fetchJson<any[]>('/industries');
    if (industries.length === 0) return null;
    const savedId = typeof window !== 'undefined' ? window.localStorage.getItem('trendmap.activeIndustryProfileId') : null;
    if (savedId) {
      const saved = industries.find((industry) => String(industry.id) === savedId);
      if (saved) return this.normalizeIndustryProfile(saved);
    }

    const ranked = industries
      .map((raw) => ({ raw, normalized: this.normalizeIndustryProfile(raw) }))
      .sort((a, b) => {
        const contextDelta = this.industryContextFieldCount(b.normalized) - this.industryContextFieldCount(a.normalized);
        if (contextDelta !== 0) return contextDelta;
        return this.industryTimestamp(b.raw) - this.industryTimestamp(a.raw);
      });
    return ranked[0]?.normalized ?? null;
  }

  async saveIndustryProfile(profile: IndustryProfile): Promise<void> {
    const shouldUpdate = Boolean(profile.id && profile.id !== 'ind-1');
    const saved = await this.fetchJson<IndustryProfile>(shouldUpdate ? `/industries/${profile.id}` : '/industries', {
      method: shouldUpdate ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('trendmap.activeIndustryProfileId', saved?.id || profile.id);
    }
  }

  async getTrendThemes(): Promise<TrendTheme[]> {
    return this.fetchJson<TrendTheme[]>('/themes');
  }

  async deriveTrendThemes(industryId?: string): Promise<TrendTheme[]> {
    return this.fetchJson<TrendTheme[]>('/themes/derive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(industryId ? { industryId } : {})
    });
  }

  async createTrendTheme(theme: Partial<TrendTheme>): Promise<TrendTheme> {
    return this.fetchJson<TrendTheme>('/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme)
    });
  }

  async updateTrendTheme(themeId: string, patch: Partial<TrendTheme>): Promise<void> {
    await this.fetchJson(`/themes/${themeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  async getSources(): Promise<Source[]> {
    return this.fetchJson<Source[]>('/sources');
  }

  async createSource(source: Partial<Source>): Promise<Source> {
    return this.fetchJson<Source>('/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: source.name,
        url: source.url,
        sourceType: source.sourceType || 'news',
        credibilityScore: source.credibilityScore ?? 0.7,
        relevanceScore: source.relevanceScore ?? 0.7,
        freshnessScore: source.freshnessScore ?? 0.7,
        status: source.status || 'suggested',
        notes: source.notes || 'Manually added by analyst.',
      })
    });
  }

  async discoverSources(industryId: string): Promise<Source[]> {
    return this.fetchJson<Source[]>(`/agents/discovery/${industryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async scanNewsForSources(): Promise<NewsScanResult> {
    return this.fetchJson<NewsScanResult>('/news/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async updateSourceStatus(sourceId: string, status: SourceStatus): Promise<void> {
    await this.fetchJson(`/sources/${sourceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }

  async deleteSource(sourceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sources/${sourceId}`, await this.withSessionProtection({
      method: 'DELETE'
    }));
    if (!response.ok) {
      throw new Error('Failed to delete source');
    }
  }

  async updateSourceNote(sourceId: string, note: string): Promise<void> {
    // Note: Backend might not support updating notes yet via this endpoint structure,
    // but we add it to fulfill the interface.
    await this.fetchJson(`/sources/${sourceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: note })
    });
  }

  async getDocuments(): Promise<Document[]> {
    return this.fetchJson<Document[]>('/documents');
  }

  async createDocument(document: Partial<Document>): Promise<Document> {
    return this.fetchJson<Document>('/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: document.sourceId,
        title: document.title,
        url: document.url || '',
        content: document.content || '',
        publishedDate: document.publishedDate || new Date().toISOString(),
        ingestionStatus: document.ingestionStatus || 'raw',
      })
    });
  }

  async uploadDocument(file: File, metadata: Partial<Document>): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_id', metadata.sourceId || '');
    formData.append('title', metadata.title || file.name);
    formData.append('url', metadata.url || '');
    formData.append('published_date', metadata.publishedDate || new Date().toISOString());

    return this.fetchJson<Document>('/documents/upload', {
      method: 'POST',
      body: formData
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}`, await this.withSessionProtection({
      method: 'DELETE'
    }));
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to delete document: ${err || response.statusText}`);
    }
  }

  async updateDocumentIngestionStatus(documentId: string, status: string): Promise<void> {
    await this.fetchJson(`/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingestionStatus: status })
    });
  }

  async updateDocumentExtractedSignals(documentId: string, signalIds: string[]): Promise<void> {
    await this.fetchJson(`/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extracted_signals: signalIds })
    });
  }

  async getSignals(): Promise<Signal[]> {
    return this.fetchJson<Signal[]>('/signals');
  }

  async saveSignals(signals: Signal[]): Promise<void> {
    for (const sig of signals) {
      await this.extractSignal(sig.documentId, sig.sourceId, sig.title, sig.noveltyScore);
    }
  }

  async extractSignalsFromDocument(documentId: string): Promise<Signal[]> {
    const response = await fetch(`${this.baseUrl}/agents/extract/${documentId}`, await this.withSessionProtection({ method: 'POST' }));
    if (!response.ok) {
      throw new Error(`Failed to extract signals: ${response.statusText}`);
    }
    return response.json();
  }

  async getSignalHistory(signalId: string): Promise<AuditEvent[]> {
    return this.fetchJson<AuditEvent[]>(`/signals/${signalId}/history`);
  }

  async extractSignal(documentId: string, sourceId: string, title: string, noveltyScore: number): Promise<Signal> {
    return this.fetchJson<Signal>('/signals/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, source_id: sourceId, title, novelty_score: noveltyScore })
    });
  }

  async getTrends(): Promise<Trend[]> {
    return this.fetchJson<Trend[]>('/trends');
  }

  async clusterTrend(name: string, status: TrendStatus): Promise<Trend> {
    return this.fetchJson<Trend>('/trends/cluster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status })
    });
  }

  async updateTrend(trendId: string, patch: Partial<Trend>): Promise<void> {
    await this.fetchJson(`/trends/${trendId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  async getTrendHistory(trendId: string): Promise<AuditEvent[]> {
    return this.fetchJson<AuditEvent[]>(`/trends/${trendId}/history`);
  }

  async saveTrends(trends: Trend[]): Promise<Trend[]> {
    const createdTrends: Trend[] = [];
    for (const t of trends) {
      const created = await this.fetchJson<Trend>('/trends/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      });
      createdTrends.push(created);
    }
    return createdTrends;
  }

  async analyzeTrends(runId?: string): Promise<Trend[]> {
    return this.fetchJson<Trend[]>('/agents/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runId ? { runId } : {})
    });
  }

  async addEvidence(_evidence: EvidenceLink[]): Promise<void> {
    for (const ev of _evidence) {
      if (!ev.trendId) continue;
      await this.fetchJson(`/trends/${ev.trendId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trend_id: ev.trendId,
          signal_id: ev.signalId,
          document_id: ev.documentId,
          source_id: ev.sourceId,
          relationship_type: 'supports'
        })
      });
    }
  }

  async getEvidenceForTrend(trendId: string): Promise<EvidenceLink[]> {
    return this.fetchJson<EvidenceLink[]>(`/trends/${trendId}/evidence`);
  }

  async getRelatedSignals(trendId: string): Promise<Signal[]> {
    return this.fetchJson(`/api/monitoring/trends/${trendId}/signals`);
  }

  // Insights
  async getInsightSummary(_industryProfileId?: string): Promise<InsightSummary> {
    return this.fetchJson<InsightSummary>('/insights/summary');
  }

  // Phase 2: Monitoring
  async getMonitoringRules(): Promise<MonitoringRule[]> { return this.fetchJson<MonitoringRule[]>('/monitoring-rules'); }
  async saveMonitoringRule(rule: MonitoringRule): Promise<void> {
    await this.fetchJson('/monitoring-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) });
  }
  async deleteMonitoringRule(ruleId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/monitoring-rules/${ruleId}`, await this.withSessionProtection({
      method: 'DELETE'
    }));
    if (!response.ok) {
      throw new Error('Failed to delete monitoring rule');
    }
  }

  async runMonitoringRule(ruleId: string): Promise<MonitoringRun> {
    return this.fetchJson<MonitoringRun>(`/monitoring-rules/${ruleId}/run`, { method: 'POST' });
  }

  async getMonitoringRuns(): Promise<MonitoringRun[]> { return this.fetchJson<MonitoringRun[]>('/monitoring-runs'); }
  async getWhatChangedSummaries(): Promise<WhatChangedSummary[]> { return this.fetchJson<WhatChangedSummary[]>('/what-changed-summaries'); }
  async getAlerts(): Promise<Alert[]> { return this.fetchJson<Alert[]>('/alerts'); }
  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.fetchJson(`/alerts/${alertId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acknowledged: true }) });
  }

  // Phase 3: Strategy
  async getStrategicContext(): Promise<StrategicContext | null> {
    const contexts = await this.fetchJson<StrategicContext[]>('/strategic-contexts');
    return contexts.length > 0 ? contexts[contexts.length - 1] : null;
  }
  async saveStrategicContext(context: StrategicContext): Promise<void> {
    await this.fetchJson('/strategic-contexts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(context) });
  }
  
  async getAssumptions(): Promise<Assumption[]> { return this.fetchJson<Assumption[]>('/assumptions'); }
  async saveAssumptions(assumptions: Assumption[]): Promise<void> {
    for (const a of assumptions) {
      await this.fetchJson('/assumptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) });
    }
  }
  async updateAssumption(assumptionId: string, patch: Partial<Assumption>): Promise<void> {
    await this.fetchJson(`/assumptions/${assumptionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  }
  
  async getLeadingIndicators(): Promise<LeadingIndicator[]> { return this.fetchJson<LeadingIndicator[]>('/leading-indicators'); }
  async updateLeadingIndicator(indicatorId: string, patch: Partial<LeadingIndicator>): Promise<void> {
    await this.fetchJson(`/leading-indicators/${indicatorId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  }
  
  async getStrategicImplications(): Promise<StrategicImplication[]> { return this.fetchJson<StrategicImplication[]>('/strategic-implications'); }
  async saveStrategicImplications(implications: StrategicImplication[]): Promise<void> {
    for (const i of implications) {
      await this.fetchJson('/strategic-implications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    }
  }
  
  async getScenarios(): Promise<Scenario[]> { return this.fetchJson<Scenario[]>('/scenarios'); }
  async saveScenarios(scenarios: Scenario[]): Promise<void> {
    for (const s of scenarios) {
      await this.fetchJson('/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    }
  }
  
  async getStrategicOptions(): Promise<StrategicOption[]> { return this.fetchJson<StrategicOption[]>('/strategic-options'); }
  async saveStrategicOptions(options: StrategicOption[]): Promise<void> {
    for (const o of options) {
      await this.fetchJson('/strategic-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
    }
  }
  async updateStrategicOption(optionId: string, patch: Partial<StrategicOption>): Promise<void> {
    await this.fetchJson(`/strategic-options/${optionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  }
  
  async getDecisionBriefs(): Promise<DecisionBrief[]> { return this.fetchJson<DecisionBrief[]>('/decision-briefs'); }
  async saveDecisionBrief(brief: DecisionBrief): Promise<void> {
    await this.fetchJson('/decision-briefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brief) });
  }
  
  async getRoadmapItems(): Promise<RoadmapItem[]> { return this.fetchJson<RoadmapItem[]>('/roadmap-items'); }
  async saveRoadmapItems(items: RoadmapItem[]): Promise<void> {
    for (const item of items) {
      await this.fetchJson('/roadmap-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    }
  }
  async updateRoadmapItem(itemId: string, patch: Partial<RoadmapItem>): Promise<void> {
    await this.fetchJson(`/roadmap-items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  }

  // Phase 4: Agents
  async getAgentActivities(): Promise<AgentActivity[]> {
    return this.fetchJson<AgentActivity[]>('/agent/activities');
  }

  async logAgentActivity(activity: AgentActivity): Promise<void> {
    await this.fetchJson('/agent/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activity) });
  }

  async getPredictions(): Promise<Prediction[]> {
    return this.fetchJson<Prediction[]>('/agent/predictions');
  }

  async savePrediction(prediction: Prediction): Promise<void> {
    await this.fetchJson('/agent/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prediction) });
  }

  async getDebates(): Promise<AgentDebate[]> {
    return this.fetchJson<AgentDebate[]>('/agent/debates');
  }

  async saveDebate(debate: AgentDebate): Promise<void> {
    await this.fetchJson('/agent/debates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debate) });
  }

  async addKGNode(node: any): Promise<void> {
    await this.fetchJson('/knowledge/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(node) });
  }

  async addKGEdge(edge: any): Promise<void> {
    await this.fetchJson('/knowledge/edges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edge) });
  }

  // Phase 2: Score History & Snapshots
  async getScoreHistory(trendId: string): Promise<{ snapshots: TrendScoreSnapshot[]; changes: TrendScoreChange[] }> {
    return this.fetchJson<{ snapshots: TrendScoreSnapshot[]; changes: TrendScoreChange[] }>(`/trends/${trendId}/score-history`);
  }

  async getTrendScoreSnapshots(trendId: string): Promise<TrendScoreSnapshot[]> {
    const history = await this.getScoreHistory(trendId);
    return history.snapshots;
  }

  async saveTrendScoreSnapshot(snapshot: TrendScoreSnapshot): Promise<void> {
    await this.fetchJson(`/trends/${snapshot.trendId}/score-snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
  }

  async saveSourceSnapshot(snapshot: SourceSnapshot): Promise<void> {
    await this.fetchJson('/source-snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
  }

  async getSourceSnapshots(sourceId: string): Promise<SourceSnapshot[]> {
    return this.fetchJson<SourceSnapshot[]>(`/source-snapshots/${sourceId}`);
  }

  async saveChangeEvent(event: ChangeEvent): Promise<void> {
    await this.fetchJson('/change-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  }

  async getChangeEvents(): Promise<ChangeEvent[]> {
    return this.fetchJson<ChangeEvent[]>('/change-events');
  }

  async searchSemantic(
    query: string,
    entityTypes?: string[],
    filters?: Record<string, any>,
    limit = 10
  ): Promise<SemanticSearchResult[]> {
    const response = await this.fetchJson<{ results: Array<{
      entity_type: string;
      entity_id: string;
      relevance_score: number;
      evidence_snippet: string;
      metadata: Record<string, any>;
    }> }>('/search/semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        entity_types: entityTypes,
        filters,
        limit
      })
    });

    return response.results.map((result) => ({
      entityType: result.entity_type,
      entityId: result.entity_id,
      relevanceScore: result.relevance_score,
      evidenceSnippet: result.evidence_snippet,
      metadata: result.metadata
    }));
  }

  async exportTrend(trendId: string): Promise<DataExportResult> {
    return this.fetchJson<DataExportResult>(`/export/trend/${trendId}`);
  }

  async exportIndustry(industryId: string): Promise<DataExportResult> {
    return this.fetchJson<DataExportResult>(`/export/industry/${industryId}`);
  }

  async importKnowledgeGraph(fileContent: string): Promise<DataImportResult> {
    return this.fetchJson<DataImportResult>('/import/knowledge-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: fileContent,
        options: { overwrite: false }
      })
    });
  }

  async importSources(sources: Partial<Source>[]): Promise<DataImportResult> {
    return this.fetchJson<DataImportResult>('/import/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sources: sources.map((source) => ({
          name: source.name,
          url: source.url,
          source_type: source.sourceType,
          credibility_score: source.credibilityScore,
          relevance_score: source.relevanceScore,
          freshness_score: source.freshnessScore,
          status: source.status,
          notes: source.notes
        }))
      })
    });
  }

  async importDocuments(documents: Partial<Document>[]): Promise<DataImportResult> {
    return this.fetchJson<DataImportResult>('/import/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents: documents.map((document) => ({
          title: document.title,
          content: document.content,
          url: document.url,
          source_id: document.sourceId,
          status: document.ingestionStatus,
          published_at: document.publishedDate
        }))
      })
    });
  }

  async extractDocumentsFromSources(): Promise<DataImportResult> {
    return this.fetchJson<DataImportResult>('/documents/extract-from-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async runDataHealthCheck(): Promise<DataHealthSummary> {
    return this.fetchJson<DataHealthSummary>('/admin/data-health', { method: 'POST' });
  }

  async clearAnalysisData(): Promise<DataClearResult> {
    return this.fetchJson<DataClearResult>('/admin/clear-analysis-data', { method: 'POST' });
  }

  async buildKnowledgeGraphForTrend(trendId: string): Promise<KnowledgeGraphBuildResult> {
    return this.fetchJson<KnowledgeGraphBuildResult>(`/knowledge/trends/${trendId}/build`, { method: 'POST' });
  }

  async getKnowledgeGraphNeighborhood(entityId: string, depth = 1): Promise<KnowledgeGraphNeighborhood> {
    return this.fetchJson<KnowledgeGraphNeighborhood>(`/knowledge/neighborhood/${entityId}?depth=${depth}`);
  }

  async calculateSourceReliability(sourceId: string): Promise<SourceReliabilityResult> {
    return this.fetchJson<SourceReliabilityResult>(`/sources/${sourceId}/reliability`, { method: 'POST' });
  }

  async calibratePrediction(predictionId?: string): Promise<ForecastCalibrationResult> {
    const path = predictionId ? `/agent/predictions/${predictionId}/calibration` : '/agent/predictions/calibration';
    return this.fetchJson<ForecastCalibrationResult>(path, { method: 'POST' });
  }


}
