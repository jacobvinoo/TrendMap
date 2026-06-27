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

export function isValidEvidenceLink(obj: any): boolean {
  if (!obj) return false;
  const required = ['id', 'trendId', 'signalId', 'documentId', 'sourceId', 'quote', 'relevanceReason'];
  for (const key of required) {
    if (!(key in obj)) return false;
    if (key === 'quote' || key === 'relevanceReason') {
      if (!isString(obj[key])) return false;
    } else {
      if (!isString(obj[key])) return false;
    }
  }
  // empty quote check
  if (obj.quote.trim().length === 0) return false;
  return true;
}
