import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, CircleDashed, LayoutDashboard } from 'lucide-react';
import { repository } from './repository';
import type { WorkspaceReadinessItem, WorkspaceReadinessSummary, WorkspaceReadinessState } from './types';

function stateStyle(state: WorkspaceReadinessState): { icon: ReactNode; label: string; className: string } {
  if (state === 'complete') {
    return {
      icon: <CheckCircle2 size={18} />,
      label: 'Complete',
      className: 'border-emerald-700/60 bg-emerald-950/20 text-emerald-200',
    };
  }
  if (state === 'attention') {
    return {
      icon: <CircleAlert size={18} />,
      label: 'Needs review',
      className: 'border-amber-700/60 bg-amber-950/20 text-amber-200',
    };
  }
  return {
    icon: <CircleDashed size={18} />,
    label: 'Missing',
    className: 'border-red-700/60 bg-red-950/20 text-red-200',
  };
}

function goTo(route: string) {
  window.location.hash = route;
}

function ReadinessRow({ item }: { item: WorkspaceReadinessItem }) {
  const style = stateStyle(item.state);
  return (
    <article className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${style.className}`}>
              {style.icon}
              {style.label}
            </span>
            <h2 className="text-base font-semibold text-white">{item.label}</h2>
          </div>
          <p className="text-sm leading-6 text-gray-300">{item.detail}</p>
        </div>
        <button
          type="button"
          onClick={() => goTo(item.route)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-3 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white"
        >
          {item.actionLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

export default function OperationsOverviewScreen() {
  const [summary, setSummary] = useState<WorkspaceReadinessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSummary(await repository.getWorkspaceReadiness());
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load workspace overview.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section data-testid="operations-overview-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Operations Overview</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              See whether this workspace is ready for regular trend monitoring and what action should happen next.
            </p>
            {summary?.workspaceName && (
              <p className="text-xs uppercase tracking-wide text-purple-200">
                Active workspace: <span className="normal-case tracking-normal text-gray-200">{summary.workspaceName}</span>
              </p>
            )}
          </div>
          {summary && (
            <button
              type="button"
              onClick={() => goTo(summary.recommendedRoute)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              {summary.recommendedActionLabel}
              <ArrowRight size={16} />
            </button>
          )}
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading operations overview...</div>
        ) : summary ? (
          <>
            <section className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Readiness</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{summary.headline}</h2>
                </div>
                <span className="w-fit rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-sm font-medium text-purple-100">
                  {summary.status.replace('_', ' ')}
                </span>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Review queue</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.newFindings}</p>
              </div>
              <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Approved sources</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.approvedSources}</p>
              </div>
              <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Signals</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.signals}</p>
              </div>
              <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Approved trends</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.approvedTrends}</p>
              </div>
            </section>

            <section className="space-y-3">
              {summary.items.map((item) => (
                <ReadinessRow key={item.id} item={item} />
              ))}
            </section>
          </>
        ) : (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No workspace overview available</p>
          </div>
        )}
      </div>
    </section>
  );
}
