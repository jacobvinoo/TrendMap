import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Circle, FileText, History, RefreshCw } from 'lucide-react';
import { repository } from './repository';
import type { Trend, TrendTimelineEntry, TrendTimelineSummary } from './types';
import { buildTrendTimeline } from './trendTimeline';

function pct(value?: number): string {
  if (typeof value !== 'number') return 'n/a';
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) return 'Date not recorded';
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function entryIcon(entry: TrendTimelineEntry) {
  if (entry.type === 'score_change') {
    if (entry.movement === 'up') return <ArrowUp size={18} className="text-emerald-300" />;
    if (entry.movement === 'down') return <ArrowDown size={18} className="text-red-300" />;
    return <Activity size={18} className="text-amber-300" />;
  }
  if (entry.type === 'evidence') return <FileText size={18} className="text-blue-300" />;
  if (entry.type === 'decision') return <CheckCircle2 size={18} className="text-purple-300" />;
  return <Circle size={18} className="text-gray-300" />;
}

function goToTrendReview() {
  window.location.hash = 'trends';
}

export default function TrendTimelineScreen() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrendId, setSelectedTrendId] = useState('');
  const [timeline, setTimeline] = useState<TrendTimelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState('');

  const selectedTrend = useMemo(
    () => trends.find((trend) => trend.id === selectedTrendId) || null,
    [trends, selectedTrendId],
  );

  async function loadTrends() {
    setLoading(true);
    setError('');
    try {
      const allTrends = await repository.getTrends();
      const reviewable = allTrends
        .filter((trend) => trend.status === 'approved' || trend.status === 'candidate' || trend.status === 'needs_review')
        .filter((trend) => !/^test trend$/i.test(trend.name || ''))
        .sort((a, b) => {
          if (a.status === 'approved' && b.status !== 'approved') return -1;
          if (b.status === 'approved' && a.status !== 'approved') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
      setTrends(reviewable);
      const nextSelected = selectedTrendId && reviewable.some((trend) => trend.id === selectedTrendId)
        ? selectedTrendId
        : reviewable[0]?.id || '';
      setSelectedTrendId(nextSelected);
      if (nextSelected) {
        await loadTimeline(reviewable.find((trend) => trend.id === nextSelected)!);
      } else {
        setTimeline(null);
      }
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load trend timeline.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(trend: Trend) {
    setLoadingTimeline(true);
    setError('');
    try {
      const [documents, sources, evidence, scoreHistory, auditEvents] = await Promise.all([
        repository.getDocuments(),
        repository.getSources(),
        repository.getEvidenceForTrend(trend.id),
        repository.getScoreHistory(trend.id),
        repository.getTrendHistory(trend.id),
      ]);
      setTimeline(buildTrendTimeline({
        trend,
        documents,
        sources,
        evidence,
        snapshots: scoreHistory.snapshots || [],
        changes: scoreHistory.changes || [],
        auditEvents,
      }));
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load timeline details.');
    } finally {
      setLoadingTimeline(false);
    }
  }

  useEffect(() => {
    loadTrends();
  }, []);

  async function handleTrendChange(trendId: string) {
    setSelectedTrendId(trendId);
    const trend = trends.find((item) => item.id === trendId);
    if (trend) await loadTimeline(trend);
  }

  return (
    <section data-testid="trend-timeline-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <History className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Trend Timeline</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              Follow how a trend is changing over time, including evidence, score movement, and approval decisions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={loadTrends}
              disabled={loading || loadingTimeline}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-4 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              onClick={goToTrendReview}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Trend Review
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
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading trend timeline...</div>
        ) : trends.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No trends available for timeline review</p>
            <p className="mt-1 text-sm text-gray-400">Generate and approve trends to begin tracking how evidence changes over time.</p>
            <button
              type="button"
              onClick={goToTrendReview}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Trend Review
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
              <label className="flex flex-col gap-2 text-sm text-gray-300">
                <span className="font-medium text-gray-100">Trend</span>
                <select
                  value={selectedTrendId}
                  onChange={(event) => handleTrendChange(event.target.value)}
                  className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none focus:border-purple-400"
                >
                  {trends.map((trend) => (
                    <option key={trend.id} value={trend.id}>{trend.name} ({trend.status})</option>
                  ))}
                </select>
              </label>
            </section>

            {timeline && selectedTrend && (
              <>
                <section className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-200">{selectedTrend.status}</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">{selectedTrend.name}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">{selectedTrend.summary}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Impact</p>
                        <p className="mt-1 text-lg font-semibold text-white">{pct(timeline.latestImpactScore)}</p>
                      </div>
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className="mt-1 text-lg font-semibold text-white">{pct(timeline.latestConfidenceScore)}</p>
                      </div>
                      <div className="rounded-md bg-[#101021] px-4 py-3">
                        <p className="text-xs text-gray-500">Sources</p>
                        <p className="mt-1 text-lg font-semibold text-white">{timeline.sourceCount}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {loadingTimeline ? (
                  <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading timeline details...</div>
                ) : timeline.entries.length === 0 ? (
                  <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
                    <p className="text-lg font-medium text-white">No timeline entries yet</p>
                    <p className="mt-1 text-sm text-gray-400">Evidence links, score changes, and trend decisions will appear here as the pipeline runs.</p>
                  </div>
                ) : (
                  <section className="space-y-4">
                    {timeline.entries.map((entry) => (
                      <article key={entry.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                        <div className="flex gap-4">
                          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#20203a]">
                            {entryIcon(entry)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">{entry.type.replace('_', ' ')}</p>
                                <h3 className="text-base font-semibold text-white">{entry.title}</h3>
                              </div>
                              <span className="text-sm text-gray-400">{formatDate(entry.date)}</span>
                            </div>
                            <p className="text-sm leading-6 text-gray-300">{entry.summary}</p>
                            {(entry.sourceName || entry.documentTitle) && (
                              <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                                {entry.sourceName && <span className="rounded-full bg-[#20203a] px-3 py-1">Source: {entry.sourceName}</span>}
                                {entry.documentTitle && <span className="rounded-full bg-[#20203a] px-3 py-1">Document: {entry.documentTitle}</span>}
                              </div>
                            )}
                            {entry.snippet && (
                              <blockquote className="border-l-2 border-purple-400/70 pl-3 text-sm italic leading-6 text-gray-300">
                                {entry.snippet}
                              </blockquote>
                            )}
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
