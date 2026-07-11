import type { 
  IndustryProfile, Source, SourceStatus, Document, Signal, Trend, TrendStatus, EvidenceLink, TrendScoreSnapshot, TrendScoreChange,
  SourceSnapshot, ChangeEvent,
  MonitoringRule, MonitoringRun, WhatChangedSummary, Alert,
  StrategicContext, Assumption, LeadingIndicator, StrategicImplication, Scenario, StrategicOption, DecisionBrief, RoadmapItem,
  AgentActivity, Prediction, AgentDebate, SemanticSearchResult,
  DataExportResult, DataImportResult, DataHealthSummary, DataClearResult,
  KnowledgeGraphBuildResult, KnowledgeGraphNeighborhood,
  SourceReliabilityResult, ForecastCalibrationResult, InsightSummary, AuditEvent, NewsScanResult, TrendTheme
} from '../types';

export interface TrendMapRepository {
  // Phase 1
  getIndustryProfile(): Promise<IndustryProfile | null>;
  saveIndustryProfile(profile: IndustryProfile): Promise<void>;
  getTrendThemes(): Promise<TrendTheme[]>;
  deriveTrendThemes(industryId?: string): Promise<TrendTheme[]>;
  createTrendTheme(theme: Partial<TrendTheme>): Promise<TrendTheme>;
  updateTrendTheme(themeId: string, patch: Partial<TrendTheme>): Promise<void>;
  
  getSources(): Promise<Source[]>;
  createSource(source: Partial<Source>): Promise<Source>;
  discoverSources(industryId: string): Promise<Source[]>;
  scanNewsForSources(): Promise<NewsScanResult>;
  updateSourceStatus(sourceId: string, status: SourceStatus): Promise<void>;
  updateSourceNote(sourceId: string, note: string): Promise<void>;
  deleteSource(sourceId: string): Promise<void>;
  
  getDocuments(): Promise<Document[]>;
  createDocument(document: Partial<Document>): Promise<Document>;
  uploadDocument(file: File, metadata: Partial<Document>): Promise<Document>;
  deleteDocument(documentId: string): Promise<void>;
  updateDocumentIngestionStatus(documentId: string, status: string): Promise<void>;
  updateDocumentExtractedSignals(documentId: string, signalIds: string[]): Promise<void>;
  
  getSignals(): Promise<Signal[]>;
  saveSignals(signals: Signal[]): Promise<void>;
  extractSignal(documentId: string, sourceId: string, title: string, noveltyScore: number): Promise<Signal>;
  extractSignalsFromDocument(documentId: string): Promise<Signal[]>;
  getSignalHistory(signalId: string): Promise<AuditEvent[]>;
  
  getTrends(): Promise<Trend[]>;
  saveTrends(trends: Trend[]): Promise<Trend[]>;
  analyzeTrends(runId?: string): Promise<Trend[]>;
  updateTrend(trendId: string, patch: Partial<Trend>): Promise<void>;
  clusterTrend(name: string, status: TrendStatus): Promise<Trend>;
  getTrendHistory(trendId: string): Promise<AuditEvent[]>;
  
  addEvidence(evidence: any[]): Promise<void>;
  getEvidenceForTrend(trendId: string): Promise<EvidenceLink[]>;
  getTrendScoreSnapshots(trendId: string): Promise<TrendScoreSnapshot[]>;
  saveTrendScoreSnapshot(snapshot: TrendScoreSnapshot): Promise<void>;
  getScoreHistory(trendId: string): Promise<{ snapshots: TrendScoreSnapshot[]; changes: TrendScoreChange[] }>;
  saveSourceSnapshot(snapshot: SourceSnapshot): Promise<void>;
  getSourceSnapshots(sourceId: string): Promise<SourceSnapshot[]>;
  saveChangeEvent(event: ChangeEvent): Promise<void>;
  getChangeEvents(): Promise<ChangeEvent[]>;

  // Insights
  getInsightSummary(industryProfileId?: string): Promise<InsightSummary>;

  // Phase 2 Monitoring
  getMonitoringRules(): Promise<MonitoringRule[]>;
  saveMonitoringRule(rule: MonitoringRule): Promise<void>;
  deleteMonitoringRule(ruleId: string): Promise<void>;
  getMonitoringRuns(): Promise<MonitoringRun[]>;
  getWhatChangedSummaries(): Promise<WhatChangedSummary[]>;
  runMonitoringRule(ruleId: string, scenario?: 'baseline' | 'new_activity' | 'contradictory_activity'): Promise<MonitoringRun | WhatChangedSummary>;
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;

  // Phase 3: Strategy
  getStrategicContext(): Promise<StrategicContext | null>;
  saveStrategicContext(context: StrategicContext): Promise<void>;
  
  getAssumptions(): Promise<Assumption[]>;
  saveAssumptions(assumptions: Assumption[]): Promise<void>;
  updateAssumption(assumptionId: string, patch: Partial<Assumption>): Promise<void>;
  
  getLeadingIndicators(): Promise<LeadingIndicator[]>;
  updateLeadingIndicator(indicatorId: string, patch: Partial<LeadingIndicator>): Promise<void>;
  
  getStrategicImplications(): Promise<StrategicImplication[]>;
  saveStrategicImplications(implications: StrategicImplication[]): Promise<void>;
  
  getScenarios(): Promise<Scenario[]>;
  saveScenarios(scenarios: Scenario[]): Promise<void>;
  
  getStrategicOptions(): Promise<StrategicOption[]>;
  saveStrategicOptions(options: StrategicOption[]): Promise<void>;
  updateStrategicOption(optionId: string, patch: Partial<StrategicOption>): Promise<void>;
  
  getDecisionBriefs(): Promise<DecisionBrief[]>;
  saveDecisionBrief(brief: DecisionBrief): Promise<void>;
  
  getRoadmapItems(): Promise<RoadmapItem[]>;
  saveRoadmapItems(items: RoadmapItem[]): Promise<void>;
  updateRoadmapItem(itemId: string, patch: Partial<RoadmapItem>): Promise<void>;

  // Phase 4: Agents
  getAgentActivities(): Promise<AgentActivity[]>;
  logAgentActivity(activity: AgentActivity): Promise<void>;
  
  getPredictions(): Promise<Prediction[]>;
  savePrediction(prediction: Prediction): Promise<void>;
  
  getDebates(): Promise<AgentDebate[]>;
  saveDebate(debate: AgentDebate): Promise<void>;

  addKGNode(node: any): Promise<void>;
  addKGEdge(edge: any): Promise<void>;

  // Phase 5: Semantic search
  searchSemantic(query: string, entityTypes?: string[], filters?: Record<string, any>, limit?: number): Promise<SemanticSearchResult[]>;
  exportTrend(trendId: string): Promise<DataExportResult>;
  exportIndustry(industryId: string): Promise<DataExportResult>;
  importSources(sources: Partial<Source>[]): Promise<DataImportResult>;
  importDocuments(documents: Partial<Document>[]): Promise<DataImportResult>;
  extractDocumentsFromSources(): Promise<DataImportResult>;
  runDataHealthCheck(): Promise<DataHealthSummary>;
  clearAnalysisData(): Promise<DataClearResult>;
  buildKnowledgeGraphForTrend(trendId: string): Promise<KnowledgeGraphBuildResult>;
  getKnowledgeGraphNeighborhood(entityId: string, depth?: number): Promise<KnowledgeGraphNeighborhood>;
  calculateSourceReliability(sourceId: string): Promise<SourceReliabilityResult>;
  calibratePrediction(predictionId?: string): Promise<ForecastCalibrationResult>;
}
