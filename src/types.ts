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
  pestleCategory: string;
  noveltyScore: number; // 0-1
  strengthScore: number; // 0-1
  confidenceScore: number; // 0-1
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
