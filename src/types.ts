// Domain type definitions
export interface IndustryProfile {
  id: string;
  name: string;
  geography: string;
  description: string;
  strategicPriorities: string[];
  customerSegments: string[];
  competitors: string[];
  timeHorizons: string[];
}

export type SourceStatus = 'suggested' | 'approved' | 'rejected';
export interface Source {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  source_type?: string;
  credibilityScore: number; // 0-1
  relevanceScore: number; // 0-1
  freshnessScore: number; // 0-1
  status: SourceStatus;
  notes: string;
  retrievedAt?: string;
  retrieved_at?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export type TrendThemeStatus = 'suggested' | 'approved' | 'rejected';
export interface TrendTheme {
  id: string;
  industryId?: string;
  industry_id?: string;
  name: string;
  description: string;
  keywords: string[];
  status: TrendThemeStatus;
  origin: 'agent' | 'manual' | 'pipeline' | string;
  evidenceSummary?: string;
  evidence_summary?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface NewsSnippet {
  id: string;
  runId?: string;
  sourceId?: string;
  title: string;
  url: string;
  publisher: string;
  publisherUrl: string;
  snippet: string;
  relevanceScore: number;
  status: string;
  publishedAt?: string;
  createdAt?: string;
}

export interface NewsScanRun {
  id: string;
  industry?: string;
  status: string;
  query?: string;
  startedAt?: string;
  completedAt?: string;
  scannedCount: number;
  matchedCount: number;
  createdSourceCount: number;
  summary?: string;
  errorSummary?: string;
}

export interface NewsScanResult {
  run: NewsScanRun;
  snippets: NewsSnippet[];
  sourcesCreated: number;
}

export interface Document {
  id: string;
  sourceId: string;
  extractionRunId?: string;
  title: string;
  publishedDate: string; // ISO date
  content: string;
  url: string;
  ingestionStatus: 'raw' | 'processed' | 'error' | 'extracted' | string;
  extractedSignalIds: string[];
}

export interface Signal {
  id: string;
  documentId: string;
  sourceId: string;
  extractionRunId?: string;
  title: string;
  summary: string;
  signalType: string;
  polarity?: 'positive' | 'negative' | 'neutral';
  pestleCategory: string;
  noveltyScore: number; // 0-1
  strengthScore: number; // 0-1
  confidenceScore: number; // 0-1
  momentumScore?: number; // 0-1
  evidenceDate: string; // ISO date
  tags: string[];
  created_at?: string; // ISO date
  logs?: { date: string; message: string }[];
}

export interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: string; // JSON string
  created_at: string;
}

export type TrendStatus = 'candidate' | 'approved' | 'rejected' | 'needs_review';
export interface Trend {
  id: string;
  extractionRunId?: string;
  name: string;
  summary: string;
  status: TrendStatus;
  horizon: string;
  likelihoodScore: number; // 0-1
  confidenceScore: number; // 0-1
  momentumScore?: number; // 0-1
  impactScore: number; // 0-1
  maturityStage: string;
  relatedSignalIds: string[];
  drivers: string[];
  blockers: string[];
  whatNeedsToBeTrue: string[];
  leadingIndicators: string[];
  monitoringQuestions: string[];
  recommendedActions: string[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  logs?: { date: string; message: string }[];
}

export interface EvidenceLink {
  id: string;
  trendId: string;
  signalId: string;
  documentId: string;
  sourceId: string;
  quote: string;
  relevanceReason: string;
}

// Insight summary type
export interface InsightSummary {
  id: string;
  industryProfileId: string;
  generatedAt: string; // ISO timestamp
  aiSummary: string;
  keyTrends: Trend[];
  watchItems: Trend[];
  emergingRisks: Trend[];
  opportunities: Trend[];
}

// Export a union if needed later

// --- Phase 2: Monitoring Types ---

export interface MonitoringRule {
  id: string;
  sourceId: string;
  industryProfileId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  enabled: boolean;
  keywords: string[];
  includePatterns: string[];
  excludePatterns: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringRun {
  id: string;
  ruleId: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'success' | 'error';
  documentsScanned: number;
  newDocumentsFound: number;
  updatedDocumentsFound: number;
  newSignalsFound: number;
  affectedTrendIds: string[];
  alertIds: string[];
  errorMessage?: string;
}

export interface SourceSnapshot {
  id: string;
  sourceId: string;
  capturedAt: string;
  documentFingerprints: DocumentFingerprint[];
  rawMetadata: Record<string, any>;
}

export interface DocumentFingerprint {
  documentId: string;
  url: string;
  titleHash: string;
  contentHash: string;
  publishedDate: string;
  lastSeenAt: string;
}

export interface ChangeEvent {
  id: string;
  sourceId: string;
  documentId: string;
  changeType: 'new_document' | 'updated_document' | 'removed_document' | 'metadata_change';
  detectedAt: string;
  previousSnapshotId?: string;
  currentSnapshotId: string;
  summary: string;
}

export interface TrendScoreSnapshot {
  id: string;
  trendId: string;
  capturedAt: string;
  likelihoodScore: number;
  confidenceScore: number;
  momentumScore?: number;
  impactScore: number;
  horizon: string;
  maturityStage: string;
  evidenceCount: number;
  signalCount: number;
  sourceDiversity: number;
  reason: string;
}

export interface TrendScoreChange {
  id: string;
  trendId: string;
  previousSnapshotId: string;
  currentSnapshotId: string;
  changedAt: string;
  likelihoodDelta: number;
  confidenceDelta: number;
  impactDelta: number;
  newConfidenceScore?: number;
  newMomentumScore?: number;
  newImpactScore?: number;
  primaryReason?: string;
  appliedAt?: string;
  horizonChanged: boolean;
  maturityChanged: boolean;
  reason: string;
  relatedSignalIds: string[];
}

export interface Alert {
  id: string;
  trendId: string;
  alertType: 'new_candidate' | 'score_threshold_crossed' | 'anomaly_detected' | 'likelihood_increased' | 'confidence_increased' | 'new_strong_evidence' | 'new_candidate_trend' | 'contradictory_signal' | 'horizon_changed' | 'source_quality_changed' | string;
  severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'critical' | string;
  title: string;
  message?: string;
  summary: string;
  createdAt: string;
  acknowledged: boolean;
  relatedSignalIds: string[];
  relatedDocumentIds: string[];
  relatedSourceIds: string[];
}

export interface WhatChangedSummary {
  id: string;
  monitoringRunId: string;
  generatedAt: string;
  headline: string;
  newSignals: Signal[];
  changedTrends: Trend[];
  newCandidateTrends: Trend[];
  alerts: Alert[];
  recommendedActions: string[];
}

// ==============================
// Phase 3 Types
// ==============================

export type RiskAppetite = 'low' | 'medium' | 'high';

export interface StrategicContext {
  id: string;
  industryProfileId: string;
  companyName: string;
  businessModel: string;
  targetCustomers: string[];
  strategicGoals: string[];
  currentCapabilities: string[];
  constraints: string[];
  riskAppetite: RiskAppetite;
  planningHorizons: string[];
}

export type AssumptionType =
  | 'customer_behaviour'
  | 'technology_readiness'
  | 'regulation'
  | 'economics'
  | 'competitor_action'
  | 'operational_feasibility';

export type AssumptionStatus = 'untested' | 'supported' | 'weakened' | 'invalidated';

export interface Assumption {
  id: string;
  trendId: string;
  statement: string;
  assumptionType: AssumptionType;
  confidenceScore: number;   // 0-1
  importanceScore: number;   // 0-1
  status: AssumptionStatus;
  relatedSignalIds: string[];
  relatedIndicatorIds: string[];
  evidenceSummary: string;
}

export type IndicatorType =
  | 'adoption'
  | 'investment'
  | 'regulatory'
  | 'competitor'
  | 'customer'
  | 'technology'
  | 'economic';

export type IndicatorStatus = 'not_started' | 'weak_signal' | 'emerging' | 'accelerating' | 'declining';

export interface LeadingIndicator {
  id: string;
  assumptionId: string;
  name: string;
  description: string;
  indicatorType: IndicatorType;
  currentStatus: IndicatorStatus;
  threshold: string;
  monitoringQuestion: string;
  relatedSourceIds: string[];
}

export type ImplicationType = 'opportunity' | 'threat' | 'risk' | 'watch_item';

export interface StrategicImplication {
  id: string;
  trendId: string;
  implicationType: ImplicationType;
  title: string;
  summary: string;
  affectedCapabilities: string[];
  affectedCustomerSegments: string[];
  urgencyScore: number;   // 0-1
  impactScore: number;    // 0-1
  confidenceScore: number; // 0-1
  evidenceIds: string[];
}

export type ScenarioType = 'upside' | 'base_case' | 'downside' | 'wildcard';

export interface Scenario {
  id: string;
  name: string;
  horizon: string;
  summary: string;
  scenarioType: ScenarioType;
  triggerConditions: string[];
  assumptions: string[];   // Assumption IDs
  implications: string[];  // StrategicImplication IDs
  probabilityScore: number; // 0-1
  impactScore: number;      // 0-1
  confidenceScore: number;  // 0-1
  earlyWarningIndicators: string[]; // LeadingIndicator IDs
}

export type OptionType =
  | 'invest'
  | 'experiment'
  | 'partner'
  | 'monitor'
  | 'defend'
  | 'exit'
  | 'build_capability';

export type EstimatedEffort = 'low' | 'medium' | 'high';

export type TimeToValue = 'now' | '3_months' | '6_months' | '12_months' | '24_months';

export interface StrategicOption {
  id: string;
  title: string;
  description: string;
  optionType: OptionType;
  linkedTrendIds: string[];
  linkedScenarioIds: string[];
  linkedAssumptionIds: string[];
  expectedBenefits: string[];
  keyRisks: string[];
  requiredCapabilities: string[];
  estimatedEffort: EstimatedEffort;
  timeToValue: TimeToValue;
  impactScore: number;       // 0-1
  feasibilityScore: number;  // 0-1
  urgencyScore: number;      // 0-1
  confidenceScore: number;   // 0-1
  priorityScore: number;     // 0-1
  recommendedNextStep: string;
  status?: 'proposed' | 'accepted' | 'rejected' | 'monitoring';
}

export interface DecisionBrief {
  id: string;
  strategicContextId: string;
  generatedAt: string;
  headline: string;
  executiveSummary: string;
  topOpportunities: string[];   // StrategicImplication IDs
  topThreats: string[];         // StrategicImplication IDs
  recommendedOptions: string[]; // StrategicOption IDs
  assumptionsToTest: string[];  // Assumption IDs
  indicatorsToMonitor: string[]; // LeadingIndicator IDs
  evidenceIds: string[];
}

export type RoadmapHorizon = 'now' | 'next' | 'later';
export type RoadmapStatus = 'proposed' | 'accepted' | 'rejected' | 'in_progress';

export interface RoadmapItem {
  id: string;
  strategicOptionId: string;
  title: string;
  horizon: RoadmapHorizon;
  owner: string;
  status: RoadmapStatus;
  successMetric: string;
  linkedIndicatorIds: string[];
}

// ==============================
// Phase 4 Types (Multi-Agent)
// ==============================

export type AgentRole = 'DiscoveryAgent' | 'ValidationAgent' | 'PredictionAgent' | 'ExecutiveAgent' | 'RecommendationAgent' | 'SignalAnalysisAgent' | 'KnowledgeGraphAgent' | 'LearningAgent' | 'MonitoringAgent' | 'IndustryIntelligenceAgent';

export interface AgentActivity {
  id: string;
  agentRole: AgentRole;
  taskType: string;
  status: 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  relatedEntityId?: string;
}

export interface Prediction {
  id: string;
  trendId: string;
  predictionStatement: string;
  targetDate?: string;
  impact?: string;
  confidenceScore?: number; // 0-1
  assumptions?: string; // string or string[] depending on parsing
  indicators?: string;
  evidenceIds?: string;
  status?: 'active' | 'resolved' | 'invalidated';
  timestamp: string;
}

export interface PredictionUpdate {
  id: string;
  predictionId: string;
  updateText: string;
  confidenceShift?: number;
  timestamp: string;
}

export interface PredictionOutcome {
  id: string;
  predictionId: string;
  resolution: string;
  accuracyScore?: number;
  lessonsLearned?: string;
  timestamp: string;
}

export interface DebateMessage {
  id: string;
  debateId: string;
  agentRole: AgentRole;
  content: string;
  timestamp: string;
}

export interface AgentDebate {
  id: string;
  topic: string;
  trendId?: string;
  status: 'active' | 'consensus_reached' | 'stalled';
  messages: DebateMessage[];
  consensusSummary?: string;
  confidenceDelta?: number;
  timestamp: string;
}

export type KnowledgeNodeType = 'Trend' | 'Technology' | 'Company' | 'Investment' | 'Product' | 'Capability' | 'Evidence';
export type KnowledgeEdgeType = 'depends_on' | 'enabled_by' | 'accelerated_by' | 'launched' | 'supports' | 'contradicts' | 'requires' | 'validated_by';

export interface KGNode {
  entity_id: string;
  label: string;
  node_type: KnowledgeNodeType;
  summary?: string;
  confidence_score?: number; // 0-1
  evidence_ids?: string; // JSON string array or actual string depending on parsing
  properties?: Record<string, any> | string;
}

export interface KGEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: KnowledgeEdgeType;
  confidence_score?: number; // 0-1
  evidence_ids?: string;
  properties?: Record<string, any> | string;
}

export interface KnowledgeGraph {
  nodes: KGNode[];
  edges: KGEdge[];
}

export interface SemanticSearchResult {
  entityType: string;
  entityId: string;
  relevanceScore: number;
  evidenceSnippet: string;
  metadata: Record<string, any>;
}

export interface DataOperationRecord {
  id: string;
  operationType: 'import' | 'export' | string;
  entityType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DataExportResult {
  export: DataOperationRecord;
  payload: Record<string, any>;
}

export interface DataImportResult {
  importRecord: DataOperationRecord;
  importedCount: number;
  entityIds: string[];
  message?: string;
  errors?: string[];
}

export interface DataHealthIssue {
  severity: 'warning' | 'error' | string;
  entityType: string;
  entityId?: string;
  message: string;
}

export interface DataHealthSummary {
  status: 'healthy' | 'degraded' | string;
  checksRun: number;
  issueCount: number;
  issues: DataHealthIssue[];
  latestChecks: Array<{
    id: string;
    component: string;
    status: string;
    latencyMs?: number;
    details?: string;
    timestamp: string;
  }>;
}

export interface DataClearResult {
  status: 'cleared' | string;
  deletedCounts: Record<string, number>;
  message: string;
}

export interface KnowledgeGraphBuildResult {
  trendId: string;
  nodesCreated: number;
  edgesCreated: number;
  nodeIds: string[];
  edgeIds: string[];
}

export interface KnowledgeGraphNeighborhood {
  centerEntityId: string;
  depth: number;
  nodes: KGNode[];
  edges: KGEdge[];
}

export interface SourceReliabilityResult {
  sourceId: string;
  reliabilityScore: number;
  credibilityScore: number;
  relevanceScore: number;
  freshnessScore: number;
  evidenceCount: number;
  documentCount: number;
  rationale: string[];
}

export interface ForecastCalibrationResult {
  predictionId?: string;
  evaluatedPredictions: number;
  averageConfidence: number;
  averageAccuracy: number;
  calibrationError: number;
  recommendation: string;
}
