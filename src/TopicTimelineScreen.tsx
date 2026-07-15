import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, GitBranch, RadioTower, RefreshCw, Signal, Timeline } from 'lucide-react';
import { repository } from './repository';
import type { Document, Signal as TrendSignal, Source, TopicTimeline, TopicTimelineEntry, Trend, WatchlistTopicSummary } from './types';
import { buildTopicTimeline } from './topicTimeline';
import { buildWatchlistTopics } from './watchlistTopics';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) return 'Date not recorded';
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function iconFor(entry: TopicTimelineEntry) {
  if (entry.type === 'source') return <RadioTower size={18} className="text-purple-300" />;
  if (entry.type === 'document') return <FileText size={18} className="text-blue-300" />;
  if (entry.type === 'signal') return <Signal size={18} className="text-emerald-300" />;
  return <GitBranch size={18} className="text-amber-300" />;
}

function goTo(route: string) {
  window.location.hash = route;
}

export default function TopicTimelineScreen() {
  const [topics, setTopics] = useState<WatchlistTopicSummary[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [timeline, setTimeline] = useState<TopicTimeline | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signals, setSignals] = useState<TrendSignal[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.theme.id === selectedTopicId) || null,
    [topics, selectedTopicId],
  );

  function buildForTopic(topic: WatchlistTopicSummary, nextSources = sources, nextDocuments = documents, nextSignals = signals, nextTrends = trends) {
    setTimeline(buildTopicTimeline({
      topic,
      sources: nextSources,
      documents: nextDocuments,
      signals: nextSignals,
      trends: nextTrends,
    }));
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [themes, nextSources, nextDocuments, nextSignals, nextTrends] = await Promise.all([
        repository.getTrendThemes(),
        repository.getSources(),
        repository.getDocuments(),
        repository.getSignals(),
        repository.getTrends(),
      ]);
      const nextTopics = buildWatchlistTopics({ themes, sources: nextSources, documents: nextDocuments, signals: nextSignals, trends: nextTrends });
      setSources(nextSources);
      setDocuments(nextDocuments);
      setSignals(nextSignals);
      setTrends(nextTrends);
      setTopics(nextTopics);
      const nextSelectedId = selectedTopicId && nextTopics.some((topic) => topic.theme.id === selectedTopicId)
        ? selectedTopicId
        : nextTopics[0]?.theme.id || '';
      setSelectedTopicId(nextSelectedId);
      const nextTopic = nextTopics.find((topic) => topic.theme.id === nextSelectedId);
      if (nextTopic) buildForTopic(nextTopic, nextSources, nextDocuments, nextSignals, nextTrends);
      else setTimeline(null);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load topic timeline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleTopicChange(topicId: string) {
    setSelectedTopicId(topicId);
    const topic = topics.find((item) => item.theme.id === topicId);
    if (topic) buildForTopic(topic);
  }

  return (
    <section data-testid="topic-timeline-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Timeline className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Topic Timeline</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              Review what has changed inside a watchlist topic across sources, documents, signals, and trends.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-4 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => goTo('watchlist')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Watchlist
              <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading topic timeline...</div>
        ) : topics.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No approved watchlist topics</p>
            <p className="mt-1 text-sm text-gray-400">Approve themes first, then use this page to monitor topic developments.</p>
            <button
              type="button"
              onClick={() => goTo('themes')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Themes
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
              <label className="flex flex-col gap-2 text-sm text-gray-300">
                <span className="font-medium text-gray-100">Watchlist topic</span>
                <select
                  value={selectedTopicId}
                  onChange={(event) => handleTopicChange(event.target.value)}
                  className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none focus:border-purple-400"
                >
                  {topics.map((topic) => (
                    <option key={topic.theme.id} value={topic.theme.id}>{topic.theme.name}</option>
                  ))}
                </select>
              </label>
            </section>

            {selectedTopic && timeline && (
              <>
                <section className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{selectedTopic.theme.name}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">{selectedTopic.theme.description}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Sources</p>
                        <p className="mt-1 text-lg font-semibold text-white">{selectedTopic.sourceCount}</p>
                      </div>
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Docs</p>
                        <p className="mt-1 text-lg font-semibold text-white">{selectedTopic.documentCount}</p>
                      </div>
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Signals</p>
                        <p className="mt-1 text-lg font-semibold text-white">{selectedTopic.signalCount}</p>
                      </div>
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Trends</p>
                        <p className="mt-1 text-lg font-semibold text-white">{selectedTopic.approvedTrendCount + selectedTopic.candidateTrendCount}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {timeline.entries.length === 0 ? (
                  <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
                    <p className="text-lg font-medium text-white">No developments yet</p>
                    <p className="mt-1 text-sm text-gray-400">{selectedTopic.recommendedAction}</p>
                  </div>
                ) : (
                  <section className="space-y-4">
                    {timeline.entries.map((entry) => (
                      <article key={entry.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                        <div className="flex gap-4">
                          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#20203a]">
                            {iconFor(entry)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">{entry.type}</p>
                                <h3 className="text-base font-semibold text-white">{entry.title}</h3>
                              </div>
                              <span className="text-sm text-gray-400">{formatDate(entry.date)}</span>
                            </div>
                            <p className="text-sm leading-6 text-gray-300">{entry.summary}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                              {entry.sourceName && <span className="rounded-full bg-[#20203a] px-3 py-1">Source: {entry.sourceName}</span>}
                              {entry.documentTitle && <span className="rounded-full bg-[#20203a] px-3 py-1">Document: {entry.documentTitle}</span>}
                              {entry.status && <span className="rounded-full bg-[#20203a] px-3 py-1">Status: {entry.status}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => goTo(entry.route)}
                              className="inline-flex items-center gap-2 text-sm font-medium text-purple-200 hover:text-white"
                            >
                              Open related screen
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
