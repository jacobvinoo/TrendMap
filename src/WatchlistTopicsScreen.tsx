import { useEffect, useState } from 'react';
import { ArrowRight, Binoculars, FileText, GitBranch, RadioTower, RefreshCw } from 'lucide-react';
import { repository } from './repository';
import type { WatchlistTopicState, WatchlistTopicSummary } from './types';
import { buildWatchlistTopics } from './watchlistTopics';

const STATE_LABELS: Record<WatchlistTopicState, string> = {
  needs_sources: 'Needs sources',
  needs_evidence: 'Needs evidence',
  needs_trends: 'Needs trends',
  needs_review: 'Needs trend review',
  active: 'Active',
};

const STATE_STYLES: Record<WatchlistTopicState, string> = {
  needs_sources: 'border-red-700/60 bg-red-950/20 text-red-200',
  needs_evidence: 'border-amber-700/60 bg-amber-950/20 text-amber-200',
  needs_trends: 'border-blue-700/60 bg-blue-950/20 text-blue-200',
  needs_review: 'border-purple-700/60 bg-purple-950/30 text-purple-100',
  active: 'border-emerald-700/60 bg-emerald-950/20 text-emerald-200',
};

function formatDate(value?: string): string {
  if (!value) return 'No activity yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function goTo(route: string) {
  window.location.hash = route;
}

export default function WatchlistTopicsScreen() {
  const [topics, setTopics] = useState<WatchlistTopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [themes, sources, documents, signals, trends] = await Promise.all([
        repository.getTrendThemes(),
        repository.getSources(),
        repository.getDocuments(),
        repository.getSignals(),
        repository.getTrends(),
      ]);
      setTopics(buildWatchlistTopics({ themes, sources, documents, signals, trends }));
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load watchlist topics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section data-testid="watchlist-topics-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Binoculars className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Watchlist Topics</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              Track approved strategic themes as durable monitoring topics, with evidence coverage and the next review action.
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
              onClick={() => goTo('themes')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Manage Themes
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
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading watchlist topics...</div>
        ) : topics.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No approved watchlist topics</p>
            <p className="mt-1 text-sm text-gray-400">Approve themes first, then return here to monitor evidence coverage by topic.</p>
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
          <div className="space-y-4">
            {topics.map((topic) => (
              <article key={topic.theme.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATE_STYLES[topic.state]}`}>
                        {STATE_LABELS[topic.state]}
                      </span>
                      <span className="rounded-full bg-[#20203a] px-3 py-1 text-xs text-gray-300">
                        Latest: {formatDate(topic.latestActivityAt)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{topic.theme.name}</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-300">{topic.theme.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(topic.theme.keywords || []).slice(0, 8).map((keyword) => (
                        <span key={keyword} className="rounded-full border border-[#3a3a65] bg-[#101021] px-2 py-1 text-xs text-gray-300">{keyword}</span>
                      ))}
                    </div>
                    <p className="text-sm text-purple-100">{topic.recommendedAction}</p>
                  </div>

                  <div className="grid min-w-full grid-cols-2 gap-2 sm:min-w-80 sm:grid-cols-4">
                    <div className="rounded-md bg-[#101021] p-3 text-center">
                      <RadioTower className="mx-auto mb-1 text-purple-300" size={16} />
                      <p className="text-lg font-semibold text-white">{topic.sourceCount}</p>
                      <p className="text-xs text-gray-500">Sources</p>
                    </div>
                    <div className="rounded-md bg-[#101021] p-3 text-center">
                      <FileText className="mx-auto mb-1 text-blue-300" size={16} />
                      <p className="text-lg font-semibold text-white">{topic.documentCount}</p>
                      <p className="text-xs text-gray-500">Docs</p>
                    </div>
                    <div className="rounded-md bg-[#101021] p-3 text-center">
                      <GitBranch className="mx-auto mb-1 text-emerald-300" size={16} />
                      <p className="text-lg font-semibold text-white">{topic.signalCount}</p>
                      <p className="text-xs text-gray-500">Signals</p>
                    </div>
                    <div className="rounded-md bg-[#101021] p-3 text-center">
                      <GitBranch className="mx-auto mb-1 text-amber-300" size={16} />
                      <p className="text-lg font-semibold text-white">{topic.approvedTrendCount + topic.candidateTrendCount}</p>
                      <p className="text-xs text-gray-500">Trends</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goTo(topic.recommendedRoute)}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-4 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white sm:col-span-4"
                    >
                      {topic.recommendedAction}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
