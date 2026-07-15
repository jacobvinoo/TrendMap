import type {
  Alert,
  Document,
  Finding,
  IndustryProfile,
  MonitoringRule,
  Source,
  StrategicContext,
  Trend,
  TrendTheme,
  Workspace,
  WorkspaceMembership,
  WorkspaceReadinessItem,
  WorkspaceReadinessSummary,
} from './types';

interface ReadinessInput {
  workspace: Workspace | null;
  industryProfile: IndustryProfile | null;
  themes: TrendTheme[];
  findings: Finding[];
  sources: Source[];
  documents: Document[];
  signals: any[];
  trends: Trend[];
  alerts: Alert[];
  monitoringRules: MonitoringRule[];
  strategicContext: StrategicContext | null;
  members: WorkspaceMembership[];
}

function item(
  id: string,
  label: string,
  state: WorkspaceReadinessItem['state'],
  detail: string,
  route: string,
  actionLabel: string
): WorkspaceReadinessItem {
  return { id, label, state, detail, route, actionLabel };
}

export function buildWorkspaceReadiness(input: ReadinessInput): WorkspaceReadinessSummary {
  const approvedThemes = input.themes.filter((theme) => theme.status === 'approved').length;
  const candidateThemes = input.themes.filter((theme) => theme.status === 'suggested').length;
  const approvedSources = input.sources.filter((source) => source.status === 'approved').length;
  const suggestedSources = input.sources.filter((source) => source.status === 'suggested').length;
  const extractedDocuments = input.documents.filter((document) => ['extracted', 'processed'].includes(document.ingestionStatus)).length;
  const candidateTrends = input.trends.filter((trend) => trend.status === 'candidate' || trend.status === 'needs_review').length;
  const approvedTrends = input.trends.filter((trend) => trend.status === 'approved').length;

  const counts = {
    approvedThemes,
    candidateThemes,
    approvedSources,
    suggestedSources,
    documents: input.documents.length,
    extractedDocuments,
    signals: input.signals.length,
    candidateTrends,
    approvedTrends,
    newFindings: input.findings.length,
    alerts: input.alerts.filter((alert) => !alert.acknowledged).length,
    monitoringRules: input.monitoringRules.length,
    workspaceMembers: input.members.length,
  };

  const industryReady = Boolean(input.industryProfile?.name && input.industryProfile?.geography);
  const strategicContextReady = Boolean(
    input.strategicContext?.companyName
    || input.strategicContext?.businessModel
    || (input.strategicContext?.strategicGoals || []).length > 0
  );

  const items = [
    item(
      'industry',
      'Industry profile',
      industryReady ? 'complete' : 'missing',
      industryReady ? `${input.industryProfile?.name} in ${input.industryProfile?.geography}` : 'Define the industry, geography, customer segments, competitors, and time horizons.',
      'setup',
      industryReady ? 'Review setup' : 'Complete setup'
    ),
    item(
      'themes',
      'Watchlist themes',
      approvedThemes > 0 ? (candidateThemes > 0 ? 'attention' : 'complete') : 'missing',
      approvedThemes > 0 ? `${approvedThemes} approved theme${approvedThemes === 1 ? '' : 's'}${candidateThemes ? `, ${candidateThemes} awaiting review` : ''}.` : 'Approve or create strategic themes before source discovery.',
      'themes',
      approvedThemes > 0 ? 'Review themes' : 'Create themes'
    ),
    item(
      'findings',
      'New findings queue',
      counts.newFindings > 0 ? 'attention' : 'complete',
      counts.newFindings > 0 ? `${counts.newFindings} finding${counts.newFindings === 1 ? '' : 's'} need review.` : 'No new findings are waiting for a decision.',
      'findings',
      counts.newFindings > 0 ? 'Review findings' : 'Open findings'
    ),
    item(
      'sources',
      'Source coverage',
      approvedSources > 0 ? (suggestedSources > 0 ? 'attention' : 'complete') : 'missing',
      approvedSources > 0 ? `${approvedSources} approved source${approvedSources === 1 ? '' : 's'}${suggestedSources ? `, ${suggestedSources} suggested` : ''}.` : 'Add or discover sources before document extraction.',
      'sources',
      approvedSources > 0 ? 'Review sources' : 'Find sources'
    ),
    item(
      'documents',
      'Evidence capture',
      extractedDocuments > 0 ? 'complete' : input.documents.length > 0 ? 'attention' : 'missing',
      input.documents.length > 0 ? `${extractedDocuments} of ${input.documents.length} document${input.documents.length === 1 ? '' : 's'} have extractable evidence.` : 'Capture or upload documents from approved sources.',
      'documents',
      input.documents.length > 0 ? 'Review documents' : 'Capture documents'
    ),
    item(
      'signals',
      'Signal extraction',
      input.signals.length > 0 ? 'complete' : extractedDocuments > 0 ? 'attention' : 'missing',
      input.signals.length > 0 ? `${input.signals.length} signal${input.signals.length === 1 ? '' : 's'} extracted from evidence.` : 'Extract signals from captured documents.',
      'signals',
      input.signals.length > 0 ? 'Review signals' : 'Extract signals'
    ),
    item(
      'trends',
      'Trend decisions',
      approvedTrends > 0 ? (candidateTrends > 0 ? 'attention' : 'complete') : candidateTrends > 0 ? 'attention' : 'missing',
      approvedTrends > 0 ? `${approvedTrends} approved trend${approvedTrends === 1 ? '' : 's'}${candidateTrends ? `, ${candidateTrends} candidate` : ''}.` : candidateTrends > 0 ? `${candidateTrends} candidate trend${candidateTrends === 1 ? '' : 's'} need approval.` : 'Generate candidate trends from reviewed signals.',
      'trends',
      approvedTrends > 0 || candidateTrends > 0 ? 'Review trends' : 'Generate trends'
    ),
    item(
      'strategy',
      'Strategy context',
      strategicContextReady ? 'complete' : approvedTrends > 0 ? 'attention' : 'missing',
      strategicContextReady ? 'Strategic context is available for decision support.' : 'Define objectives, constraints, and strategic priorities for interpretation.',
      'strategy',
      strategicContextReady ? 'Review context' : 'Add context'
    ),
    item(
      'monitoring',
      'Monitoring rules',
      counts.monitoringRules > 0 ? (counts.alerts > 0 ? 'attention' : 'complete') : approvedTrends > 0 ? 'attention' : 'missing',
      counts.monitoringRules > 0 ? `${counts.monitoringRules} rule${counts.monitoringRules === 1 ? '' : 's'} configured${counts.alerts ? `, ${counts.alerts} alert${counts.alerts === 1 ? '' : 's'} open` : ''}.` : 'Create monitoring rules once trends are approved.',
      'rules',
      counts.monitoringRules > 0 ? 'Review monitoring' : 'Create rules'
    ),
  ];

  const foundationalIds = new Set(['industry', 'themes', 'sources']);
  const foundationalMissing = items.find((entry) => foundationalIds.has(entry.id) && entry.state === 'missing');
  const recommended = foundationalMissing
    || items.find((entry) => entry.state === 'attention')
    || items.find((entry) => entry.state === 'missing')
    || items[0];
  const missingCount = items.filter((entry) => entry.state === 'missing').length;
  const attentionCount = items.filter((entry) => entry.state === 'attention').length;
  const status = foundationalMissing ? 'needs_setup' : attentionCount > 0 ? 'needs_review' : missingCount > 0 ? 'needs_setup' : 'ready';
  const headline = status === 'ready'
    ? 'Workspace is ready for regular monitoring.'
    : status === 'needs_review'
      ? 'Workspace has review decisions waiting.'
      : 'Workspace setup is incomplete.';

  return {
    workspaceId: input.workspace?.id,
    workspaceName: input.workspace?.name,
    status,
    headline,
    recommendedRoute: recommended.route,
    recommendedActionLabel: recommended.actionLabel,
    counts,
    items,
  };
}
