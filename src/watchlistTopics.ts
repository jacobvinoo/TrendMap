import type { Document, Signal, Source, Trend, TrendTheme, WatchlistTopicSummary } from './types';

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);
}

function topicTerms(theme: TrendTheme): string[] {
  const phrases = [
    theme.name,
    theme.description,
    ...(theme.keywords || []),
    ...(theme.aliases || []),
  ]
    .map((item) => item.toLowerCase().trim())
    .filter((item) => item.length >= 4);
  return [...new Set([...phrases, ...phrases.flatMap(words)])];
}

function matchesTopic(theme: TrendTheme, text: string): boolean {
  const haystack = text.toLowerCase();
  return topicTerms(theme).some((term) => haystack.includes(term));
}

function sourceText(source: Source): string {
  return [source.name, source.url, source.sourceType, source.notes].filter(Boolean).join(' ');
}

function documentText(document: Document): string {
  return [document.title, document.content, document.url].filter(Boolean).join(' ');
}

function signalText(signal: Signal): string {
  return [signal.title, signal.summary, signal.signalType, signal.pestleCategory, ...(signal.tags || [])].filter(Boolean).join(' ');
}

function trendText(trend: Trend): string {
  return [
    trend.name,
    trend.summary,
    trend.horizon,
    trend.maturityStage,
    ...(trend.drivers || []),
    ...(trend.blockers || []),
    ...(trend.whatNeedsToBeTrue || []),
    ...(trend.leadingIndicators || []),
    ...(trend.monitoringQuestions || []),
    ...(trend.recommendedActions || []),
  ].filter(Boolean).join(' ');
}

function latestDate(values: Array<string | undefined>): string | undefined {
  const dates = values
    .filter(Boolean)
    .map((value) => ({ value, time: new Date(value as string).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => b.time - a.time);
  return dates[0]?.value;
}

function stateAndRoute(input: {
  sourceCount: number;
  documentCount: number;
  signalCount: number;
  candidateTrendCount: number;
  approvedTrendCount: number;
}): { state: WatchlistTopicSummary['state']; recommendedAction: string; recommendedRoute: string } {
  if (input.sourceCount === 0) {
    return { state: 'needs_sources', recommendedAction: 'Find or add sources for this topic.', recommendedRoute: 'sources' };
  }
  if (input.documentCount === 0 || input.signalCount === 0) {
    return { state: 'needs_evidence', recommendedAction: 'Capture documents and extract signals for this topic.', recommendedRoute: 'documents' };
  }
  if (input.candidateTrendCount > 0) {
    return { state: 'needs_review', recommendedAction: 'Review candidate trends linked to this topic.', recommendedRoute: 'trends' };
  }
  if (input.approvedTrendCount === 0) {
    return { state: 'needs_trends', recommendedAction: 'Generate or approve trends for this topic.', recommendedRoute: 'trends' };
  }
  return { state: 'active', recommendedAction: 'Monitor timeline and strategic actions for this topic.', recommendedRoute: 'trend-timeline' };
}

export function buildWatchlistTopics(input: {
  themes: TrendTheme[];
  sources: Source[];
  documents: Document[];
  signals: Signal[];
  trends: Trend[];
}): WatchlistTopicSummary[] {
  return input.themes
    .filter((theme) => theme.status === 'approved')
    .map((theme) => {
      const relatedSources = input.sources.filter((source) => source.status === 'approved' && matchesTopic(theme, sourceText(source)));
      const relatedSourceIds = new Set(relatedSources.map((source) => source.id));
      const relatedDocuments = input.documents.filter((document) =>
        relatedSourceIds.has(document.sourceId)
        || matchesTopic(theme, documentText(document))
      );
      const relatedDocumentIds = new Set(relatedDocuments.map((document) => document.id));
      const relatedSignals = input.signals.filter((signal) =>
        relatedDocumentIds.has(signal.documentId)
        || relatedSourceIds.has(signal.sourceId)
        || matchesTopic(theme, signalText(signal))
      );
      const relatedSignalIds = new Set(relatedSignals.map((signal) => signal.id));
      const relatedTrends = input.trends.filter((trend) =>
        (trend.relatedSignalIds || []).some((signalId) => relatedSignalIds.has(signalId))
        || matchesTopic(theme, trendText(trend))
      );
      const candidateTrendCount = relatedTrends.filter((trend) => trend.status === 'candidate' || trend.status === 'needs_review').length;
      const approvedTrendCount = relatedTrends.filter((trend) => trend.status === 'approved').length;
      const state = stateAndRoute({
        sourceCount: relatedSources.length,
        documentCount: relatedDocuments.length,
        signalCount: relatedSignals.length,
        candidateTrendCount,
        approvedTrendCount,
      });

      return {
        theme,
        ...state,
        sourceCount: relatedSources.length,
        documentCount: relatedDocuments.length,
        signalCount: relatedSignals.length,
        candidateTrendCount,
        approvedTrendCount,
        latestActivityAt: latestDate([
          ...relatedSources.map((source) => source.retrievedAt || source.retrieved_at || source.updatedAt || source.updated_at || source.createdAt || source.created_at),
          ...relatedDocuments.map((document) => document.publishedDate),
          ...relatedSignals.map((signal) => signal.evidenceDate || signal.created_at),
          ...relatedTrends.map((trend) => trend.updatedAt || trend.createdAt),
        ]),
        relatedSourceIds: [...relatedSourceIds],
        relatedDocumentIds: [...relatedDocumentIds],
        relatedSignalIds: [...relatedSignalIds],
        relatedTrendIds: relatedTrends.map((trend) => trend.id),
      };
    })
    .sort((a, b) => {
      const stateOrder = ['needs_review', 'needs_sources', 'needs_evidence', 'needs_trends', 'active'];
      const stateDelta = stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state);
      if (stateDelta !== 0) return stateDelta;
      return new Date(b.latestActivityAt || 0).getTime() - new Date(a.latestActivityAt || 0).getTime();
    });
}
