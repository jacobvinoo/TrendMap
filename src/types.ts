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
  credibilityScore: number; // 0-1
  relevanceScore: number; // 0-1
  freshnessScore: number; // 0-1
  status: SourceStatus;
  notes: string;
}

export interface Document {
  id: string;
  sourceId: string;
  title: string;
  publishedDate: string; // ISO date
  content: string;
  url: string;
  ingestionStatus: string;
  extractedSignalIds: string[];
}

export interface Signal {
  id: string;
  documentId: string;
  sourceId: string;
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
}

export type TrendStatus = 'candidate' | 'approved' | 'rejected' | 'needs_review';
export interface Trend {
  id: string;
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
