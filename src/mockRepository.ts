
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
  Workspace,
  WorkspaceMembership,
  Finding,
  FindingStatus,
} from './types';

const DEFAULT_WORKSPACE_ID = 'workspace-default';

declare global {
  // eslint-disable-next-line no-var
  var __mockRepoState: {
    workspaces: Workspace[];
    workspaceMembers: WorkspaceMembership[];
    activeWorkspaceId?: string;
    findings: Finding[];
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

function activeWorkspaceId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('trendmap.activeWorkspaceId');
    if (stored) {
      globalThis.__mockRepoState!.activeWorkspaceId = stored;
      return stored;
    }
  }
  return globalThis.__mockRepoState!.activeWorkspaceId || DEFAULT_WORKSPACE_ID;
}

function itemWorkspaceId(item: { workspaceId?: string; workspace_id?: string } | null | undefined): string {
  return item?.workspaceId || item?.workspace_id || DEFAULT_WORKSPACE_ID;
}

function belongsToActiveWorkspace<T extends { workspaceId?: string; workspace_id?: string }>(item: T): boolean {
  if (!item?.workspaceId && !item?.workspace_id) return true;
  return itemWorkspaceId(item) === activeWorkspaceId();
}

function withActiveWorkspace<T extends { workspaceId?: string; workspace_id?: string }>(item: T): T {
  return { ...item, workspaceId: item.workspaceId || item.workspace_id || activeWorkspaceId() };
}

function uniqueId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function topicTokens(value: string): Set<string> {
  const synonymGroups: Record<string, string> = {
    affordable: 'value',
    affordability: 'value',
    deal: 'value',
    deals: 'value',
    discount: 'value',
    discounts: 'value',
    price: 'value',
    pricing: 'value',
    promotion: 'value',
    promotions: 'value',
    shopper: 'customer',
    shoppers: 'customer',
    behaviour: 'customer',
    behavior: 'customer',
  };
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
      .map((token) => synonymGroups[token] || token)
      .filter((token) => !['and', 'the', 'for', 'with', 'into'].includes(token))
  );
}

function themeText(theme: Partial<TrendTheme>): string {
  return `${theme.name || ''} ${theme.description || ''} ${(theme.keywords || []).join(' ')} ${(theme.aliases || []).join(' ')}`;
}

function themeSimilarity(left: Partial<TrendTheme>, right: Partial<TrendTheme>): number {
  const leftTokens = topicTokens(themeText(left));
  const rightTokens = topicTokens(themeText(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

export function findSimilarApprovedTheme(candidate: Partial<TrendTheme>): { theme: TrendTheme; score: number } | null {
  const matches = getTrendThemes()
    .filter((theme) => theme.status === 'approved' && theme.name.toLowerCase() !== (candidate.name || '').toLowerCase())
    .map((theme) => ({ theme, score: themeSimilarity(theme, candidate) }))
    .sort((left, right) => right.score - left.score);
  const best = matches[0];
  return best && best.score >= 0.2 ? best : null;
}

export function addThemeAlias(themeId: string, alias: string, keywords: string[] = []): void {
  const current = globalThis.__mockRepoState!.trendThemes || [];
  const index = current.findIndex((theme) => theme.id === themeId);
  if (index < 0 || !alias.trim()) return;
  const theme = current[index];
  const aliases = Array.from(new Set([...(theme.aliases || []), alias.trim()]));
  const mergedKeywords = Array.from(new Set([...(theme.keywords || []), ...keywords]));
  current[index] = { ...theme, aliases, keywords: mergedKeywords, updatedAt: new Date().toISOString() };
  globalThis.__mockRepoState!.trendThemes = current;
  persistState();
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
            globalThis.__mockRepoState = {
              ...parsed,
              workspaces: parsed.workspaces || [{
                id: DEFAULT_WORKSPACE_ID,
                name: 'Company-wide Trends',
                purpose: 'Default trend analysis workspace',
              }],
              workspaceMembers: parsed.workspaceMembers || [{
                id: 'member-default-owner',
                workspaceId: DEFAULT_WORKSPACE_ID,
                userId: 'user-default',
                role: 'owner',
              }],
              activeWorkspaceId: parsed.activeWorkspaceId || DEFAULT_WORKSPACE_ID,
              findings: parsed.findings || [],
            };
            return;
          }
        } catch (e) {
          console.error("Failed to parse stored state", e);
        }
      }
    }
    globalThis.__mockRepoState = {
      workspaces: [{
        id: DEFAULT_WORKSPACE_ID,
        name: 'Company-wide Trends',
        purpose: 'Default trend analysis workspace',
      }],
      workspaceMembers: [{
        id: 'member-default-owner',
        workspaceId: DEFAULT_WORKSPACE_ID,
        userId: 'user-default',
        role: 'owner',
      }],
      activeWorkspaceId: DEFAULT_WORKSPACE_ID,
      findings: [],
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
    window.localStorage.setItem('trendmap.activeWorkspaceId', DEFAULT_WORKSPACE_ID);
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
    globalThis.__mockRepoState!.findings = [];
    persistState();
  }
}

if (typeof window !== 'undefined') {
  (window as any).clearDynamicData = clearDynamicData;
}

// ----- Workspaces and Review Findings -----
export function getWorkspaces(): Workspace[] {
  return [...globalThis.__mockRepoState!.workspaces];
}

export function createWorkspace(workspace: Partial<Workspace>): Workspace {
  const now = new Date().toISOString();
  const created: Workspace = {
    id: workspace.id || uniqueId('workspace'),
    name: workspace.name || 'Untitled Workspace',
    purpose: workspace.purpose || '',
    currentUserRole: workspace.currentUserRole || 'owner',
    ownerUserId: workspace.ownerUserId || workspace.owner_user_id,
    createdAt: workspace.createdAt || now,
    updatedAt: workspace.updatedAt || now,
  };
  globalThis.__mockRepoState!.workspaces.push(created);
  globalThis.__mockRepoState!.workspaceMembers.push({
    id: uniqueId('member'),
    workspaceId: created.id,
    userId: 'user-default',
    role: 'owner',
    createdAt: now,
    updatedAt: now,
  });
  persistState();
  return created;
}

export function getActiveWorkspace(): Workspace | null {
  const id = activeWorkspaceId();
  const workspace = globalThis.__mockRepoState!.workspaces.find((item) => item.id === id) || null;
  return workspace ? { ...workspace, currentUserRole: workspace.currentUserRole || 'owner' } : null;
}

export function setActiveWorkspace(workspaceId: string): void {
  if (!globalThis.__mockRepoState!.workspaces.some((workspace) => workspace.id === workspaceId)) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }
  globalThis.__mockRepoState!.activeWorkspaceId = workspaceId;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('trendmap.activeWorkspaceId', workspaceId);
  }
  persistState();
}

export function getWorkspaceMembers(workspaceId: string): WorkspaceMembership[] {
  return globalThis.__mockRepoState!.workspaceMembers
    .filter((member) => (member.workspaceId || member.workspace_id) === workspaceId)
    .map((member) => ({ ...member }));
}

export function upsertWorkspaceMember(workspaceId: string, member: { userId: string; role: string }): WorkspaceMembership {
  const now = new Date().toISOString();
  const members = globalThis.__mockRepoState!.workspaceMembers;
  const existing = members.find((item) => (item.workspaceId || item.workspace_id) === workspaceId && (item.userId || item.user_id) === member.userId);
  const ownerCount = members.filter((item) => (item.workspaceId || item.workspace_id) === workspaceId && item.role === 'owner').length;
  if (existing && existing.role === 'owner' && member.role !== 'owner' && ownerCount <= 1) {
    throw new Error('A workspace must keep at least one owner.');
  }
  if (existing) {
    existing.role = member.role;
    existing.updatedAt = now;
    persistState();
    return { ...existing };
  }
  const created: WorkspaceMembership = {
    id: uniqueId('member'),
    workspaceId,
    userId: member.userId,
    role: member.role,
    createdAt: now,
    updatedAt: now,
  };
  members.push(created);
  persistState();
  return { ...created };
}

export function removeWorkspaceMember(workspaceId: string, userId: string): void {
  const members = globalThis.__mockRepoState!.workspaceMembers;
  const target = members.find((item) => (item.workspaceId || item.workspace_id) === workspaceId && (item.userId || item.user_id) === userId);
  if (!target) return;
  const ownerCount = members.filter((item) => (item.workspaceId || item.workspace_id) === workspaceId && item.role === 'owner').length;
  if (target.role === 'owner' && ownerCount <= 1) {
    throw new Error('A workspace must keep at least one owner.');
  }
  globalThis.__mockRepoState!.workspaceMembers = members.filter((item) => item !== target);
  persistState();
}

export function getFindings(filters: { status?: FindingStatus | 'all' } = {}): Finding[] {
  return globalThis.__mockRepoState!.findings
    .filter(belongsToActiveWorkspace)
    .filter((finding) => !filters.status || filters.status === 'all' || finding.status === filters.status)
    .map((finding) => ({ ...finding }));
}

export function saveFinding(finding: Partial<Finding>): Finding {
  const now = new Date().toISOString();
  const created: Finding = withActiveWorkspace<Finding>({
    id: finding.id || uniqueId('finding'),
    findingType: finding.findingType || finding.finding_type || 'news_snippet',
    title: finding.title || 'Untitled finding',
    summary: finding.summary || '',
    whyItMatters: finding.whyItMatters || finding.why_it_matters,
    evidenceSnippet: finding.evidenceSnippet || finding.evidence_snippet,
    recommendedAction: finding.recommendedAction || finding.recommended_action,
    status: finding.status || 'new',
    confidenceScore: finding.confidenceScore ?? finding.confidence_score,
    impactScore: finding.impactScore ?? finding.impact_score,
    sourceId: finding.sourceId || finding.source_id,
    documentId: finding.documentId || finding.document_id,
    signalId: finding.signalId || finding.signal_id,
    trendId: finding.trendId || finding.trend_id,
    discoveredAt: finding.discoveredAt || finding.discovered_at || now,
    evidenceDate: finding.evidenceDate || finding.evidence_date,
    retrievedAt: finding.retrievedAt || finding.retrieved_at,
    reviewedAt: finding.reviewedAt || finding.reviewed_at,
    reviewNote: finding.reviewNote || finding.review_note,
    metadata: finding.metadata || (typeof finding.metadata_json === 'object' ? finding.metadata_json : undefined),
  } as Finding);
  globalThis.__mockRepoState!.findings.push(created);
  persistState();
  return created;
}

export function updateFinding(findingId: string, patch: Partial<Finding>): void {
  const index = globalThis.__mockRepoState!.findings.findIndex((finding) => finding.id === findingId);
  if (index < 0) return;
  const existing = globalThis.__mockRepoState!.findings[index];
  if (
    existing.findingType === 'merge_proposal'
    && patch.status === 'approved'
    && existing.metadata?.canonicalThemeId
    && existing.metadata?.candidateThemeName
  ) {
    addThemeAlias(
      existing.metadata.canonicalThemeId,
      existing.metadata.candidateThemeName,
      existing.metadata.candidateKeywords || []
    );
    patch = { ...patch, status: 'merged' };
  }
  globalThis.__mockRepoState!.findings[index] = {
    ...existing,
    ...patch,
    reviewedAt: patch.reviewedAt || patch.reviewed_at || new Date().toISOString(),
  } as Finding;
  persistState();
}

// ----- Industry -----
export function getIndustryProfile(): IndustryProfile | null {
  const profile = globalThis.__mockRepoState!.industryProfile;
  if (!profile) return null;
  return belongsToActiveWorkspace(profile) ? profile : null;
}

export function saveIndustryProfile(profile: IndustryProfile): void {
  globalThis.__mockRepoState!.industryProfile = withActiveWorkspace(profile);
  persistState();
}

export function getTrendThemes(): TrendTheme[] {
  return [...(globalThis.__mockRepoState!.trendThemes || []).filter(belongsToActiveWorkspace)];
}

export function saveTrendThemes(themes: TrendTheme[]): void {
  const active = activeWorkspaceId();
  const scoped = themes.map(withActiveWorkspace);
  globalThis.__mockRepoState!.trendThemes = [
    ...(globalThis.__mockRepoState!.trendThemes || []).filter((theme) => itemWorkspaceId(theme) !== active),
    ...scoped,
  ];
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
  return [...globalThis.__mockRepoState!.sources.filter(belongsToActiveWorkspace)];
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
  return [...globalThis.__mockRepoState!.documents.filter(belongsToActiveWorkspace)];
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
  return [...globalThis.__mockRepoState!.signals.filter(belongsToActiveWorkspace)];
}

export function saveSignals(newSignals: Signal[]): void {
  const current = globalThis.__mockRepoState!.signals;
  for (const incoming of newSignals) {
    const s = withActiveWorkspace(incoming);
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
  return [...globalThis.__mockRepoState!.trends.filter(belongsToActiveWorkspace)];
}

export function getTrendById(id: string): Trend | null {
  return globalThis.__mockRepoState!.trends.find((t) => t.id === id && belongsToActiveWorkspace(t)) || null;
}

export function saveTrends(newTrends: Trend[]): void {
  const current = globalThis.__mockRepoState!.trends;
  for (const incoming of newTrends) {
    const t = withActiveWorkspace(incoming);
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
  const trend = globalThis.__mockRepoState!.trends.find((item) => item.id === trendId);
  if (trend && !belongsToActiveWorkspace(trend)) return [];
  return globalThis.__mockRepoState!.evidences.filter((e) => e.trendId === trendId || (e as any).trend_id === trendId);
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
  return [...globalThis.__mockRepoState!.rules.filter(belongsToActiveWorkspace as any)];
}

export function saveMonitoringRule(rule: MonitoringRule): void {
  const current = globalThis.__mockRepoState!.rules;
  const scoped = withActiveWorkspace(rule as any) as MonitoringRule;
  const idx = current.findIndex(r => r.id === scoped.id);
  if (idx !== -1) current[idx] = scoped;
  else current.push(scoped);
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
  return [...globalThis.__mockRepoState!.changeEvents.filter(belongsToActiveWorkspace as any)];
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
  return [...globalThis.__mockRepoState!.strategicOptions.filter((item) => belongsToActiveWorkspace(item))];
}

export function saveStrategicOptions(items: StrategicOption[]): void {
  const current = globalThis.__mockRepoState!.strategicOptions;
  items.map((item) => withActiveWorkspace(item)).forEach(item => {
    const idx = current.findIndex(a => a.id === item.id && itemWorkspaceId(a) === itemWorkspaceId(item));
    if (idx !== -1) current[idx] = { ...current[idx], ...item };
    else current.push(item);
  });
  persistState();
}

export function updateStrategicOption(id: string, patch: Partial<StrategicOption>): void {
  const list = globalThis.__mockRepoState!.strategicOptions;
  const idx = list.findIndex(o => o.id === id && belongsToActiveWorkspace(o));
  if (idx !== -1) list[idx] = { ...list[idx], ...withActiveWorkspace(patch) };
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
  return [...globalThis.__mockRepoState!.roadmapItems.filter((item) => belongsToActiveWorkspace(item))];
}

export function saveRoadmapItems(items: RoadmapItem[]): void {
  const current = globalThis.__mockRepoState!.roadmapItems;
  items.map((item) => withActiveWorkspace(item)).forEach(item => {
    const idx = current.findIndex(a => a.id === item.id && itemWorkspaceId(a) === itemWorkspaceId(item));
    if (idx !== -1) current[idx] = { ...current[idx], ...item };
    else current.push(item);
  });
  persistState();
}

export function updateRoadmapItem(id: string, patch: Partial<RoadmapItem>): void {
  const list = globalThis.__mockRepoState!.roadmapItems;
  const idx = list.findIndex(r => r.id === id && belongsToActiveWorkspace(r));
  if (idx !== -1) list[idx] = { ...list[idx], ...withActiveWorkspace(patch) };
  persistState();
}

export function deleteSource(id: string): void {
  globalThis.__mockRepoState!.sources = globalThis.__mockRepoState!.sources.filter((s) => s.id !== id || !belongsToActiveWorkspace(s));
  persistState();
}

export function saveSources(sources: any[]): void {
  const active = activeWorkspaceId();
  const scoped = sources.map(withActiveWorkspace);
  globalThis.__mockRepoState!.sources = [
    ...globalThis.__mockRepoState!.sources.filter((source) => itemWorkspaceId(source) !== active),
    ...scoped,
  ];
  persistState();
}

export function saveDocuments(documents: any[]): void {
  const active = activeWorkspaceId();
  const scoped = documents.map(withActiveWorkspace);
  globalThis.__mockRepoState!.documents = [
    ...globalThis.__mockRepoState!.documents.filter((document) => itemWorkspaceId(document) !== active),
    ...scoped,
  ];
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
