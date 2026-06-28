import type { EvidenceLink, MonitoringRule,  } from './types';

// Validation utilities for domain models
function isString(val: any): val is string {
  return typeof val === 'string';
}

function isNumberInRange(val: any): boolean {
  return typeof val === 'number' && val >= 0 && val <= 1;
}

function isISODate(str: string): boolean {
  return !isNaN(Date.parse(str));
}

export function isValidIndustryProfile(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'name', 'geography', 'description', 'strategicPriorities', 'customerSegments', 'competitors', 'timeHorizons'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (['strategicPriorities', 'customerSegments', 'competitors', 'timeHorizons'].includes(key)) {
      if (!Array.isArray(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  return true;
}

export function isValidSource(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'name', 'url', 'sourceType', 'credibilityScore', 'relevanceScore', 'freshnessScore', 'status', 'notes'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (['credibilityScore', 'relevanceScore', 'freshnessScore'].includes(key)) {
      if (!isNumberInRange(obj[key])) return false;
    } else if (key === 'status') {
      if (!['suggested', 'approved', 'rejected'].includes(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  return true;
}

export function isValidDocument(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'sourceId', 'title', 'publishedDate', 'content', 'url', 'ingestionStatus', 'extractedSignalIds'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (key === 'publishedDate') {
      if (!isISODate(obj[key])) return false;
    } else if (key === 'extractedSignalIds') {
      if (!Array.isArray(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  return true;
}

export function isValidSignal(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'documentId', 'sourceId', 'title', 'summary', 'signalType', 'pestleCategory', 'noveltyScore', 'strengthScore', 'confidenceScore', 'evidenceDate', 'tags'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (['noveltyScore', 'strengthScore', 'confidenceScore'].includes(key)) {
      if (!isNumberInRange(obj[key])) return false;
    } else if (key === 'evidenceDate') {
      if (!isISODate(obj[key])) return false;
    } else if (key === 'tags') {
      if (!Array.isArray(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  return true;
}

export function isValidTrend(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'name', 'summary', 'status', 'horizon', 'likelihoodScore', 'confidenceScore', 'impactScore', 'maturityStage', 'relatedSignalIds', 'drivers', 'blockers', 'whatNeedsToBeTrue', 'leadingIndicators', 'monitoringQuestions', 'recommendedActions', 'createdAt', 'updatedAt'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (['likelihoodScore', 'confidenceScore', 'impactScore'].includes(key)) {
      if (!isNumberInRange(obj[key])) return false;
    } else if (['relatedSignalIds', 'drivers', 'blockers', 'whatNeedsToBeTrue', 'leadingIndicators', 'monitoringQuestions', 'recommendedActions'].includes(key)) {
      if (!Array.isArray(obj[key])) return false;
    } else if (key === 'status') {
      if (!['candidate', 'approved', 'rejected', 'needs_review'].includes(obj[key])) return false;
    } else if (key === 'createdAt' || key === 'updatedAt') {
      if (!isISODate(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  return true;
}

export function isValidEvidenceLink(e: any): e is EvidenceLink { 
  if (!e || typeof e !== 'object') return false;
  if (typeof e.id !== 'string' || !e.id) return false;
  if (typeof e.trendId !== 'string' || !e.trendId) return false;
  if (typeof e.signalId !== 'string' || !e.signalId) return false;
  if (typeof e.documentId !== 'string' || !e.documentId) return false;
  if (typeof e.sourceId !== 'string' || !e.sourceId) return false;
  if (typeof e.quote !== 'string' || !e.quote) return false;
  if (typeof e.relevanceReason !== 'string' || !e.relevanceReason) return false;
  return true;
}

// --- Phase 2 Monitoring Validation ---

export function isValidMonitoringRule(r: any): r is MonitoringRule { 
  if (!r || typeof r !== 'object') return false;
  if (!isString(r.id) || !r.id) return false;
  if (!isString(r.sourceId) || !r.sourceId) return false;
  if (!isString(r.industryProfileId) || !r.industryProfileId) return false;
  if (!['daily', 'weekly', 'monthly', 'manual'].includes(r.frequency)) return false;
  if (typeof r.enabled !== 'boolean') return false;
  if (!Array.isArray(r.keywords) || !Array.isArray(r.includePatterns) || !Array.isArray(r.excludePatterns)) return false;
  if (!isString(r.createdAt) || !isISODate(r.createdAt)) return false;
  if (!isString(r.updatedAt) || !isISODate(r.updatedAt)) return false;
  return true;
}

export function isValidMonitoringRun(r: any): r is any {
  if (!r || typeof r !== 'object') return false;
  if (!isString(r.id) || !r.id) return false;
  if (!isString(r.ruleId) || !r.ruleId) return false;
  if (!isString(r.sourceId) || !r.sourceId) return false;
  if (!isString(r.startedAt) || !isISODate(r.startedAt)) return false;
  if (!['pending', 'running', 'completed', 'failed', 'success', 'error'].includes(r.status)) return false;
  if (typeof r.documentsScanned !== 'number') return false;
  if (typeof r.newDocumentsFound !== 'number') return false;
  if (typeof r.updatedDocumentsFound !== 'number') return false;
  if (typeof r.newSignalsFound !== 'number') return false;
  if (!Array.isArray(r.affectedTrendIds) || !Array.isArray(r.alertIds)) return false;
  return true;
}

export function isValidSourceSnapshot(s: any): s is any {
  if (!s || typeof s !== 'object') return false;
  if (!isString(s.id) || !s.id) return false;
  if (!isString(s.sourceId) || !s.sourceId) return false;
  if (!isString(s.capturedAt) || !isISODate(s.capturedAt)) return false;
  if (!Array.isArray(s.documentFingerprints)) return false;
  if (!s.rawMetadata || typeof s.rawMetadata !== 'object') return false;
  return true;
}

export function isValidChangeEvent(c: any): c is any {
  if (!c || typeof c !== 'object') return false;
  if (!isString(c.id) || !c.id) return false;
  if (!isString(c.sourceId) || !c.sourceId) return false;
  if (!isString(c.documentId) || !c.documentId) return false;
  if (!['new_document', 'updated_document', 'removed_document', 'metadata_change'].includes(c.changeType)) return false;
  if (!isString(c.detectedAt) || !isISODate(c.detectedAt)) return false;
  if (!isString(c.currentSnapshotId) || !c.currentSnapshotId) return false;
  if (!isString(c.summary) || !c.summary) return false;
  return true;
}

export function isValidTrendScoreSnapshot(s: any): s is any {
  if (!s || typeof s !== 'object') return false;
  if (!isString(s.id) || !s.id) return false;
  if (!isString(s.trendId) || !s.trendId) return false;
  if (!isString(s.capturedAt) || !isISODate(s.capturedAt)) return false;
  if (!isNumberInRange(s.likelihoodScore)) return false;
  if (!isNumberInRange(s.confidenceScore)) return false;
  if (s.momentumScore !== undefined && !isNumberInRange(s.momentumScore)) return false;
  if (!isNumberInRange(s.impactScore)) return false;
  if (!isString(s.horizon) || !s.horizon) return false;
  if (!isString(s.maturityStage) || !s.maturityStage) return false;
  if (typeof s.evidenceCount !== 'number' || typeof s.signalCount !== 'number' || typeof s.sourceDiversity !== 'number') return false;
  if (!isString(s.reason) || !s.reason) return false;
  return true;
}

export function isValidTrendScoreChange(c: any): c is any {
  if (!c || typeof c !== 'object') return false;
  if (!isString(c.id) || !c.id) return false;
  if (!isString(c.trendId) || !c.trendId) return false;
  if (!isString(c.previousSnapshotId) || !c.previousSnapshotId) return false;
  if (!isString(c.currentSnapshotId) || !c.currentSnapshotId) return false;
  if (!isString(c.changedAt) || !isISODate(c.changedAt)) return false;
  if (typeof c.likelihoodDelta !== 'number' || typeof c.confidenceDelta !== 'number' || typeof c.impactDelta !== 'number') return false;
  if (typeof c.horizonChanged !== 'boolean' || typeof c.maturityChanged !== 'boolean') return false;
  if (!isString(c.reason) || !c.reason) return false;
  if (!Array.isArray(c.relatedSignalIds)) return false;
  return true;
}

export function isValidAlert(a: any): a is any {
  if (!a || typeof a !== 'object') return false;
  if (!isString(a.id) || !a.id) return false;
  if (!isString(a.trendId) || !a.trendId) return false;
  const alertTypes = ['new_candidate', 'score_threshold_crossed', 'anomaly_detected', 'likelihood_increased', 'confidence_increased', 'new_strong_evidence', 'new_candidate_trend', 'contradictory_signal', 'horizon_changed', 'source_quality_changed'];
  if (!alertTypes.includes(a.alertType)) return false;
  if (!['low', 'medium', 'high', 'info', 'warning', 'critical'].includes(a.severity)) return false;
  if (!isString(a.title) || !a.title) return false;
  if (!isString(a.summary) || !a.summary) return false;
  if (!isString(a.createdAt) || !isISODate(a.createdAt)) return false;
  if (typeof a.acknowledged !== 'boolean') return false;
  if (!Array.isArray(a.relatedSignalIds) || !Array.isArray(a.relatedDocumentIds) || !Array.isArray(a.relatedSourceIds)) return false;
  return true;
}

export function isValidWhatChangedSummary(s: any): s is any {
  if (!s || typeof s !== 'object') return false;
  if (!isString(s.id) || !s.id) return false;
  if (!isString(s.monitoringRunId) || !s.monitoringRunId) return false;
  if (!isString(s.generatedAt) || !isISODate(s.generatedAt)) return false;
  if (!isString(s.headline) || !s.headline) return false;
  if (!Array.isArray(s.newSignals) || !Array.isArray(s.changedTrends) || !Array.isArray(s.newCandidateTrends) || !Array.isArray(s.alerts) || !Array.isArray(s.recommendedActions)) return false;
  return true;
}

// ==============================
// Phase 3 Validators
// ==============================

const VALID_RISK_APPETITES = ['low', 'medium', 'high'] as const;
const VALID_ASSUMPTION_TYPES = ['customer_behaviour', 'technology_readiness', 'regulation', 'economics', 'competitor_action', 'operational_feasibility'] as const;
const VALID_ASSUMPTION_STATUSES = ['untested', 'supported', 'weakened', 'invalidated'] as const;
const VALID_INDICATOR_TYPES = ['adoption', 'investment', 'regulatory', 'competitor', 'customer', 'technology', 'economic'] as const;
const VALID_INDICATOR_STATUSES = ['not_started', 'weak_signal', 'emerging', 'accelerating', 'declining'] as const;
const VALID_IMPLICATION_TYPES = ['opportunity', 'threat', 'risk', 'watch_item'] as const;
const VALID_SCENARIO_TYPES = ['upside', 'base_case', 'downside', 'wildcard'] as const;
const VALID_OPTION_TYPES = ['invest', 'experiment', 'partner', 'monitor', 'defend', 'exit', 'build_capability'] as const;
const VALID_EFFORT_LEVELS = ['low', 'medium', 'high'] as const;
const VALID_TIME_TO_VALUE = ['now', '3_months', '6_months', '12_months', '24_months'] as const;
const VALID_ROADMAP_HORIZONS = ['now', 'next', 'later'] as const;
const VALID_ROADMAP_STATUSES = ['proposed', 'accepted', 'rejected', 'in_progress'] as const;

export function isValidStrategicContext(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.companyName) || !obj.companyName) return false;
  if (!VALID_RISK_APPETITES.includes(obj.riskAppetite)) return false;
  if (!Array.isArray(obj.strategicGoals) || obj.strategicGoals.length === 0) return false;
  if (!Array.isArray(obj.targetCustomers)) return false;
  if (!Array.isArray(obj.currentCapabilities)) return false;
  if (!Array.isArray(obj.constraints)) return false;
  if (!Array.isArray(obj.planningHorizons)) return false;
  return true;
}

export function isValidAssumption(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.trendId) || !obj.trendId) return false;
  if (!isString(obj.statement) || !obj.statement) return false;
  if (!VALID_ASSUMPTION_TYPES.includes(obj.assumptionType)) return false;
  if (!VALID_ASSUMPTION_STATUSES.includes(obj.status)) return false;
  if (!isNumberInRange(obj.confidenceScore)) return false;
  if (!isNumberInRange(obj.importanceScore)) return false;
  if (!Array.isArray(obj.relatedSignalIds)) return false;
  if (!Array.isArray(obj.relatedIndicatorIds)) return false;
  return true;
}

export function isValidLeadingIndicator(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.assumptionId) || !obj.assumptionId) return false;
  if (!isString(obj.name) || !obj.name) return false;
  if (!VALID_INDICATOR_TYPES.includes(obj.indicatorType)) return false;
  if (!VALID_INDICATOR_STATUSES.includes(obj.currentStatus)) return false;
  if (!isString(obj.monitoringQuestion) || !obj.monitoringQuestion) return false;
  if (!Array.isArray(obj.relatedSourceIds)) return false;
  return true;
}

export function isValidStrategicImplication(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.trendId) || !obj.trendId) return false;
  if (!isString(obj.title) || !obj.title) return false;
  if (!VALID_IMPLICATION_TYPES.includes(obj.implicationType)) return false;
  if (!isNumberInRange(obj.urgencyScore)) return false;
  if (!isNumberInRange(obj.impactScore)) return false;
  if (!isNumberInRange(obj.confidenceScore)) return false;
  if (!Array.isArray(obj.affectedCapabilities)) return false;
  if (!Array.isArray(obj.affectedCustomerSegments)) return false;
  if (!Array.isArray(obj.evidenceIds)) return false;
  return true;
}

export function isValidScenario(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.name) || !obj.name) return false;
  if (!isString(obj.horizon) || !obj.horizon) return false;
  if (!VALID_SCENARIO_TYPES.includes(obj.scenarioType)) return false;
  if (!Array.isArray(obj.triggerConditions) || obj.triggerConditions.length === 0) return false;
  if (!isNumberInRange(obj.probabilityScore)) return false;
  if (!isNumberInRange(obj.impactScore)) return false;
  if (!isNumberInRange(obj.confidenceScore)) return false;
  if (!Array.isArray(obj.assumptions)) return false;
  if (!Array.isArray(obj.implications)) return false;
  if (!Array.isArray(obj.earlyWarningIndicators)) return false;
  return true;
}

export function isValidStrategicOption(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.title) || !obj.title) return false;
  if (!VALID_OPTION_TYPES.includes(obj.optionType)) return false;
  if (!VALID_EFFORT_LEVELS.includes(obj.estimatedEffort)) return false;
  if (!VALID_TIME_TO_VALUE.includes(obj.timeToValue)) return false;
  if (!isNumberInRange(obj.impactScore)) return false;
  if (!isNumberInRange(obj.feasibilityScore)) return false;
  if (!isNumberInRange(obj.urgencyScore)) return false;
  if (!isNumberInRange(obj.confidenceScore)) return false;
  if (!isNumberInRange(obj.priorityScore)) return false;
  if (!Array.isArray(obj.linkedTrendIds)) return false;
  if (!Array.isArray(obj.linkedScenarioIds)) return false;
  // Must link to at least one trend or scenario
  if (obj.linkedTrendIds.length === 0 && obj.linkedScenarioIds.length === 0) return false;
  if (!Array.isArray(obj.linkedAssumptionIds)) return false;
  if (!Array.isArray(obj.expectedBenefits)) return false;
  if (!Array.isArray(obj.keyRisks)) return false;
  if (!Array.isArray(obj.requiredCapabilities)) return false;
  return true;
}

export function isValidDecisionBrief(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.strategicContextId) || !obj.strategicContextId) return false;
  if (!isString(obj.generatedAt) || !obj.generatedAt) return false;
  if (!isString(obj.headline) || !obj.headline) return false;
  if (!Array.isArray(obj.topOpportunities)) return false;
  if (!Array.isArray(obj.topThreats)) return false;
  if (!Array.isArray(obj.recommendedOptions)) return false;
  if (!Array.isArray(obj.assumptionsToTest)) return false;
  if (!Array.isArray(obj.indicatorsToMonitor)) return false;
  if (!Array.isArray(obj.evidenceIds)) return false;
  return true;
}

export function isValidRoadmapItem(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!isString(obj.id) || !obj.id) return false;
  if (!isString(obj.strategicOptionId) || !obj.strategicOptionId) return false;
  if (!isString(obj.title) || !obj.title) return false;
  if (!VALID_ROADMAP_HORIZONS.includes(obj.horizon)) return false;
  if (!VALID_ROADMAP_STATUSES.includes(obj.status)) return false;
  if (!isString(obj.successMetric) || !obj.successMetric) return false;
  if (!Array.isArray(obj.linkedIndicatorIds)) return false;
  return true;
}

