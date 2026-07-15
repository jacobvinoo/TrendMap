import type {
  Document,
  Signal,
  Source,
  TopicTimeline,
  TopicTimelineEntry,
  Trend,
  WatchlistTopicSummary,
} from './types';

function firstDate(...values: Array<string | undefined>): string {
  return values.find((value) => value && value.length > 0) || new Date(0).toISOString();
}

function sortNewest(entries: TopicTimelineEntry[]): TopicTimelineEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function buildTopicTimeline(input: {
  topic: WatchlistTopicSummary;
  sources: Source[];
  documents: Document[];
  signals: Signal[];
  trends: Trend[];
}): TopicTimeline {
  const relatedSourceIds = new Set(input.topic.relatedSourceIds);
  const relatedDocumentIds = new Set(input.topic.relatedDocumentIds);
  const relatedSignalIds = new Set(input.topic.relatedSignalIds);
  const relatedTrendIds = new Set(input.topic.relatedTrendIds);

  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const documentById = new Map(input.documents.map((document) => [document.id, document]));

  const entries: TopicTimelineEntry[] = [];

  for (const source of input.sources.filter((item) => relatedSourceIds.has(item.id))) {
    entries.push({
      id: `source-${source.id}`,
      type: 'source',
      date: firstDate(source.retrievedAt, source.retrieved_at, source.updatedAt, source.updated_at, source.createdAt, source.created_at),
      title: `Source approved: ${source.name}`,
      summary: source.notes || `${source.sourceType} source for this watchlist topic.`,
      sourceName: source.name,
      status: source.status,
      route: 'sources',
    });
  }

  for (const document of input.documents.filter((item) => relatedDocumentIds.has(item.id))) {
    const source = sourceById.get(document.sourceId);
    entries.push({
      id: `document-${document.id}`,
      type: 'document',
      date: firstDate(document.publishedDate),
      title: document.title,
      summary: document.content?.slice(0, 320) || 'Document captured for this watchlist topic.',
      sourceName: source?.name,
      documentTitle: document.title,
      status: document.ingestionStatus,
      route: 'documents',
    });
  }

  for (const signal of input.signals.filter((item) => relatedSignalIds.has(item.id))) {
    const source = sourceById.get(signal.sourceId);
    const document = documentById.get(signal.documentId);
    entries.push({
      id: `signal-${signal.id}`,
      type: 'signal',
      date: firstDate(signal.evidenceDate, signal.created_at),
      title: signal.title,
      summary: signal.summary,
      sourceName: source?.name,
      documentTitle: document?.title,
      status: signal.polarity || signal.signalType,
      route: 'signals',
    });
  }

  for (const trend of input.trends.filter((item) => relatedTrendIds.has(item.id))) {
    entries.push({
      id: `trend-${trend.id}`,
      type: 'trend',
      date: firstDate(trend.updatedAt, trend.createdAt),
      title: trend.name,
      summary: trend.summary,
      status: trend.status,
      route: trend.status === 'approved' ? 'trend-timeline' : 'trends',
    });
  }

  return {
    topic: input.topic,
    entries: sortNewest(entries),
  };
}
