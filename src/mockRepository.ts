
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
  TrendTheme,
} from './types';

declare global {
  // eslint-disable-next-line no-var
  var __mockRepoState: {
    industryProfile: IndustryProfile | null;
    trendThemes: TrendTheme[];
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
    agentActivities?: any[];
    debates?: any[];
    predictions?: any[];
    activities?: any[];
    knowledgeGraph?: any;
  } | undefined;
}


function persistState() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = import.meta.env.VITE_E2E_TEST === 'true' ? 'trendmap_mock_test' : 'trendmap_mock_dev';
    window.localStorage.setItem(key, JSON.stringify(globalThis.__mockRepoState));
  }
}

function initState() {
  if (!globalThis.__mockRepoState) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = import.meta.env.VITE_E2E_TEST === 'true' ? 'trendmap_mock_test' : 'trendmap_mock_dev';
      const stored = window.localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            globalThis.__mockRepoState = parsed;
            return;
          }
        } catch (e) {
          console.error("Failed to parse stored state", e);
        }
      }
    }
    globalThis.__mockRepoState = {
      industryProfile: null,
      trendThemes: [],
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
      agentActivities: [],
    };
  }
}

initState();

import { seedE2EData } from './seedE2EData';
import { seedPhase3 } from './seedPhase3';

function seedData(force = false) {
  if (force || import.meta.env.VITE_E2E_TEST === 'true') {
    seedE2EData();
    seedPhase3();
  } else {
    // Seeding is disabled per user request to enforce empty initial state for manual testing
  }
}

// Seed on first load
seedData();

// ----- Exported reset for test isolation -----
export function resetMockData(options: { seed?: boolean } = {}) {
  // Re-initialize the shared state. Tests that need sample data seed explicitly.
  globalThis.__mockRepoState = undefined;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('trendmap_mock_test');
    window.localStorage.removeItem('trendmap_mock_dev');
  }
  initState();
  if (options.seed) seedData(true);
  persistState();
}

export function clearDynamicData() {
  if (globalThis.__mockRepoState) {
    globalThis.__mockRepoState!.documents = [];
    globalThis.__mockRepoState!.signals = [];
    globalThis.__mockRepoState!.trends = [];
    globalThis.__mockRepoState!.evidences = [];
    globalThis.__mockRepoState!.summaries = [];
    globalThis.__mockRepoState!.alerts = [];
    globalThis.__mockRepoState!.assumptions = [];
    globalThis.__mockRepoState!.leadingIndicators = [];
    globalThis.__mockRepoState!.strategicImplications = [];
    globalThis.__mockRepoState!.scenarios = [];
    globalThis.__mockRepoState!.strategicOptions = [];
    globalThis.__mockRepoState!.decisionBriefs = [];
    globalThis.__mockRepoState!.roadmapItems = [];
    persistState();
  }
}

if (typeof window !== 'undefined') {
  (window as any).clearDynamicData = clearDynamicData;
}

// ----- Industry -----
export function getIndustryProfile(): IndustryProfile | null {
  return globalThis.__mockRepoState!.industryProfile;
}

export function saveIndustryProfile(profile: IndustryProfile): void {
  globalThis.__mockRepoState!.industryProfile = profile;
  persistState();
}

export function getTrendThemes(): TrendTheme[] {
  return [...(globalThis.__mockRepoState!.trendThemes || [])];
}

export function saveTrendThemes(themes: TrendTheme[]): void {
  globalThis.__mockRepoState!.trendThemes = themes;
  persistState();
}

export function updateTrendTheme(themeId: string, patch: Partial<TrendTheme>): void {
  const current = globalThis.__mockRepoState!.trendThemes || [];
  const index = current.findIndex((theme) => theme.id === themeId);
  if (index >= 0) {
    current[index] = { ...current[index], ...patch, updatedAt: new Date().toISOString() };
    globalThis.__mockRepoState!.trendThemes = current;
    persistState();
  }
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
  persistState();
}

export function updateSourceNote(sourceId: string, note: string): void {
  const idx = globalThis.__mockRepoState!.sources.findIndex((s) => s.id === sourceId);
  if (idx !== -1) {
    const existing = globalThis.__mockRepoState!.sources[idx].notes ?? '';
    globalThis.__mockRepoState!.sources[idx] = { ...globalThis.__mockRepoState!.sources[idx], notes: existing ? `${existing}\n${note}` : note };
  }
  persistState();
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
  persistState();
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
  persistState();
}

export function deleteDocument(documentId: string): void {
  const signalIds = new Set(
    globalThis.__mockRepoState!.signals
      .filter((signal) => signal.documentId === documentId)
      .map((signal) => signal.id)
  );
  globalThis.__mockRepoState!.documents = globalThis.__mockRepoState!.documents.filter((document) => document.id !== documentId);
  globalThis.__mockRepoState!.signals = globalThis.__mockRepoState!.signals.filter((signal) => signal.documentId !== documentId);
  globalThis.__mockRepoState!.evidences = globalThis.__mockRepoState!.evidences.filter((evidence) => {
    const evidenceDocumentId = (evidence as any).documentId ?? (evidence as any).document_id;
    const evidenceSignalId = (evidence as any).signalId ?? (evidence as any).signal_id;
    return evidenceDocumentId !== documentId && !signalIds.has(evidenceSignalId);
  });
  persistState();
}

// ----- Signals -----
export function getSignals(): Signal[] {
  return [...globalThis.__mockRepoState!.signals];
}

export function saveSignals(newSignals: Signal[]): void {
  const current = globalThis.__mockRepoState!.signals;
  for (const s of newSignals) {
    const idx = current.findIndex(existing => existing.id === s.id);
    if (idx !== -1) {
      const existingLogs = current[idx].logs || [];
      const newLog = s.logs && s.logs.length > 0 ? s.logs[0] : { date: new Date().toISOString(), message: 'Signal updated from re-extraction' };
      s.logs = [...existingLogs, newLog];
      current[idx] = s;
    } else {
      if (!s.logs) s.logs = [{ date: new Date().toISOString(), message: 'Signal initially extracted' }];
      current.push(s);
    }
  }
  persistState();
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
      const existingIds = Array.isArray(existing.relatedSignalIds) ? existing.relatedSignalIds : [];
      const newIds = Array.isArray(t.relatedSignalIds) ? t.relatedSignalIds : [];
      const mergedSignalIds = Array.from(new Set([...existingIds, ...newIds]));
      current[idx] = { ...existing, relatedSignalIds: mergedSignalIds };
    } else {
      current.push(t);
    }
  }
  persistState();
}

export function updateTrendStatus(trendId: string, status: TrendStatus): void {
  const idx = globalThis.__mockRepoState!.trends.findIndex((t) => t.id === trendId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.trends[idx] = { ...globalThis.__mockRepoState!.trends[idx], status };
  }
  persistState();
}

export function updateTrend(trendId: string, patch: Partial<Trend>): void {
  const idx = globalThis.__mockRepoState!.trends.findIndex((t) => t.id === trendId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.trends[idx] = { ...globalThis.__mockRepoState!.trends[idx], ...patch } as Trend;
  }
  persistState();
}

// ----- Evidence -----
export function getEvidences(): EvidenceLink[] {
  return [...globalThis.__mockRepoState!.evidences];
}

export function getEvidenceForTrend(trendId: string): EvidenceLink[] {
  return globalThis.__mockRepoState!.evidences.filter((e) => e.trendId === trendId);
}

export function addEvidence(evidence: EvidenceLink[]): void {
  const current = globalThis.__mockRepoState!.evidences;
  const evArray = Array.isArray(evidence) ? evidence : (evidence ? [evidence as any] : []);
  for (const e of evArray) {
    const exists = current.some(existing => existing.id === e.id);
    if (!exists) {
      current.push(e);
    }
  }
  persistState();
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
  persistState();
}

export function deleteMonitoringRule(ruleId: string): void {
  globalThis.__mockRepoState!.rules = globalThis.__mockRepoState!.rules.filter(r => r.id !== ruleId);
  persistState();
}

export function updateMonitoringRule(ruleId: string, patch: Partial<MonitoringRule>): void {
  const idx = globalThis.__mockRepoState!.rules.findIndex(r => r.id === ruleId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.rules[idx] = { ...globalThis.__mockRepoState!.rules[idx], ...patch } as MonitoringRule;
  }
  persistState();
}

export function getMonitoringRuns(): MonitoringRun[] {
  return [...globalThis.__mockRepoState!.runs];
}

export function saveMonitoringRun(run: MonitoringRun): void {
  const current = globalThis.__mockRepoState!.runs;
  const idx = current.findIndex(r => r.id === run.id);
  if (idx !== -1) current[idx] = run;
  else current.push(run);
  persistState();
}

export function updateMonitoringRun(runId: string, patch: Partial<MonitoringRun>): void {
  const idx = globalThis.__mockRepoState!.runs.findIndex(r => r.id === runId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.runs[idx] = { ...globalThis.__mockRepoState!.runs[idx], ...patch } as MonitoringRun;
  }
  persistState();
}

export function getSourceSnapshots(sourceId: string): SourceSnapshot[] {
  return globalThis.__mockRepoState!.snapshots.filter(s => s.sourceId === sourceId);
}

export function saveSourceSnapshot(snapshot: SourceSnapshot): void {
  const current = globalThis.__mockRepoState!.snapshots;
  const idx = current.findIndex(s => s.id === snapshot.id);
  if (idx !== -1) current[idx] = snapshot;
  else current.push(snapshot);
  persistState();
}

export function getChangeEvents(): ChangeEvent[] {
  return [...globalThis.__mockRepoState!.changeEvents];
}

export function saveChangeEvents(events: ChangeEvent[]): void {
  globalThis.__mockRepoState!.changeEvents.push(...events);
  persistState();
}

export function getTrendScoreSnapshots(trendId: string): TrendScoreSnapshot[] {
  return globalThis.__mockRepoState!.trendScoreSnapshots.filter(s => s.trendId === trendId);
}

export function saveTrendScoreSnapshot(snapshot: TrendScoreSnapshot): void {
  const current = globalThis.__mockRepoState!.trendScoreSnapshots;
  const idx = current.findIndex(s => s.id === snapshot.id);
  if (idx !== -1) current[idx] = snapshot;
  else current.push(snapshot);
  persistState();
}

export function getTrendScoreChanges(trendId: string): TrendScoreChange[] {
  return globalThis.__mockRepoState!.trendScoreChanges.filter(c => c.trendId === trendId);
}

export function saveTrendScoreChange(change: TrendScoreChange): void {
  const current = globalThis.__mockRepoState!.trendScoreChanges;
  const idx = current.findIndex(c => c.id === change.id);
  if (idx !== -1) current[idx] = change;
  else current.push(change);
  persistState();
}

export function getAlerts(): Alert[] {
  return [...globalThis.__mockRepoState!.alerts];
}

export function saveAlerts(alerts: Alert[]): void {
  globalThis.__mockRepoState!.alerts.push(...alerts);
  persistState();
}

export function acknowledgeAlert(alertId: string): void {
  const idx = globalThis.__mockRepoState!.alerts.findIndex(a => a.id === alertId);
  if (idx !== -1) {
    globalThis.__mockRepoState!.alerts[idx] = { ...globalThis.__mockRepoState!.alerts[idx], acknowledged: true };
  }
  persistState();
}

export function getWhatChangedSummaries(): WhatChangedSummary[] {
  return [...globalThis.__mockRepoState!.summaries];
}

export function saveWhatChangedSummary(summary: WhatChangedSummary): void {
  const current = globalThis.__mockRepoState!.summaries;
  const idx = current.findIndex(s => s.id === summary.id);
  if (idx !== -1) current[idx] = summary;
  else current.push(summary);
  persistState();
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
  persistState();
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
  persistState();
}

export function updateAssumption(id: string, patch: Partial<Assumption>): void {
  const list = globalThis.__mockRepoState!.assumptions;
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
  persistState();
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
  persistState();
}

export function updateLeadingIndicator(id: string, patch: Partial<LeadingIndicator>): void {
  const list = globalThis.__mockRepoState!.leadingIndicators;
  const idx = list.findIndex(li => li.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
  persistState();
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
  persistState();
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
  persistState();
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
  persistState();
}

export function updateStrategicOption(id: string, patch: Partial<StrategicOption>): void {
  const list = globalThis.__mockRepoState!.strategicOptions;
  const idx = list.findIndex(o => o.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
  persistState();
}

export function getDecisionBriefs(): DecisionBrief[] {
  return [...globalThis.__mockRepoState!.decisionBriefs];
}

export function saveDecisionBrief(brief: DecisionBrief): void {
  const list = globalThis.__mockRepoState!.decisionBriefs;
  const idx = list.findIndex(b => b.id === brief.id);
  if (idx !== -1) list[idx] = brief;
  else list.push(brief);
  persistState();
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
  persistState();
}

export function updateRoadmapItem(id: string, patch: Partial<RoadmapItem>): void {
  const list = globalThis.__mockRepoState!.roadmapItems;
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) list[idx] = { ...list[idx], ...patch };
  persistState();
}

export function deleteSource(id: string): void {
  globalThis.__mockRepoState!.sources = globalThis.__mockRepoState!.sources.filter((s) => s.id !== id);
  persistState();
}

export function saveSources(sources: any[]): void {
  globalThis.__mockRepoState!.sources = sources;
  persistState();
}

export function saveDocuments(documents: any[]): void {
  globalThis.__mockRepoState!.documents = documents;
  persistState();
}

export function getAgentActivities(): any[] { return globalThis.__mockRepoState?.activities || []; }
export function logAgentActivity(activity: any): void {
  if (!globalThis.__mockRepoState!.activities) globalThis.__mockRepoState!.activities = [];
  globalThis.__mockRepoState!.activities.push(activity);
}
export function getPredictions(): any[] { return []; }
export function savePrediction(_prediction: any): void {}
export function getDebates(): any[] { return []; }
export function saveDebate(_debate: any): void {}
export function addKGNode(_node: any): void {}
export function addKGEdge(_edge: any): void {}
