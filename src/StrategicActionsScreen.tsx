import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardCheck, GitBranch, Map, PlusCircle } from 'lucide-react';
import { repository } from './repository';
import type { StrategicActionHandoff, StrategicOption } from './types';
import { buildStrategicActionHandoffs } from './strategicActionHandoff';
import { createStrategicOptionFromTrend } from './strategicActionEngine';
import { generateRoadmapItems } from './roadmapEngine';

const STATE_LABELS: Record<StrategicActionHandoff['state'], string> = {
  needs_option: 'Needs option',
  option_proposed: 'Option proposed',
  option_accepted: 'Ready for roadmap',
  roadmap_planned: 'On roadmap',
};

const STATE_STYLES: Record<StrategicActionHandoff['state'], string> = {
  needs_option: 'border-red-700/60 bg-red-950/20 text-red-200',
  option_proposed: 'border-amber-700/60 bg-amber-950/20 text-amber-200',
  option_accepted: 'border-blue-700/60 bg-blue-950/20 text-blue-200',
  roadmap_planned: 'border-emerald-700/60 bg-emerald-950/20 text-emerald-200',
};

function pct(value?: number): string {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function goTo(route: string) {
  window.location.hash = route;
}

export default function StrategicActionsScreen() {
  const [handoffs, setHandoffs] = useState<StrategicActionHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [trends, options, roadmapItems] = await Promise.all([
        repository.getTrends(),
        repository.getStrategicOptions(),
        repository.getRoadmapItems(),
      ]);
      const approved = trends.filter((trend) => trend.status === 'approved');
      const evidencePairs = await Promise.all(
        approved.map(async (trend) => [trend.id, (await repository.getEvidenceForTrend(trend.id)).length] as const),
      );
      setHandoffs(buildStrategicActionHandoffs(
        trends,
        options,
        roadmapItems,
        Object.fromEntries(evidencePairs),
      ));
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load strategic actions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createOption(handoff: StrategicActionHandoff): Promise<StrategicOption> {
    const option = createStrategicOptionFromTrend(handoff.trend, { evidenceCount: handoff.evidenceCount });
    await repository.saveStrategicOptions([option]);
    return option;
  }

  async function handleCreateOption(handoff: StrategicActionHandoff) {
    setBusyId(handoff.trend.id);
    setMessage('');
    setError('');
    try {
      const option = await createOption(handoff);
      setMessage(`Created strategic option: ${option.title}`);
      await load();
    } catch (actionError: any) {
      setError(actionError?.message || 'Failed to create strategic option.');
    } finally {
      setBusyId('');
    }
  }

  async function handleAcceptForRoadmap(handoff: StrategicActionHandoff) {
    setBusyId(handoff.trend.id);
    setMessage('');
    setError('');
    try {
      const option = handoff.option || await createOption(handoff);
      await repository.updateStrategicOption(option.id, { status: 'accepted' });
      const roadmapItems = await repository.getRoadmapItems();
      if (!roadmapItems.some((item) => item.strategicOptionId === option.id)) {
        await repository.saveRoadmapItems(generateRoadmapItems([{ ...option, status: 'accepted' }]));
      }
      setMessage(`Accepted and added to roadmap: ${option.title}`);
      await load();
    } catch (actionError: any) {
      setError(actionError?.message || 'Failed to accept option for roadmap.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section data-testid="strategic-actions-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Strategic Actions</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              Convert approved trends into strategic options and roadmap work, with gaps shown clearly.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => goTo('options')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-4 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white"
            >
              Open Options
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => goTo('roadmap')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Roadmap
              <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {message && (
          <div role="status" className="rounded-lg border border-emerald-700 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading strategic actions...</div>
        ) : handoffs.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No approved trends ready for action</p>
            <p className="mt-1 text-sm text-gray-400">Approve trends first, then return here to create strategic options and roadmap work.</p>
            <button
              type="button"
              onClick={() => goTo('trends')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Open Trend Review
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {handoffs.map((handoff) => (
              <article key={handoff.trend.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATE_STYLES[handoff.state]}`}>
                        {STATE_LABELS[handoff.state]}
                      </span>
                      <span className="rounded-full bg-[#20203a] px-3 py-1 text-xs text-gray-300">
                        Evidence: {handoff.evidenceCount}
                      </span>
                      <span className="rounded-full bg-[#20203a] px-3 py-1 text-xs text-gray-300">
                        Impact: {pct(handoff.trend.impactScore)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{handoff.trend.name}</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-300">{handoff.trend.summary}</p>
                    </div>
                    {handoff.option && (
                      <div className="rounded-md bg-[#101021] p-3 text-sm text-gray-300">
                        <p className="font-medium text-gray-100">{handoff.option.title}</p>
                        <p className="mt-1">{handoff.option.recommendedNextStep}</p>
                      </div>
                    )}
                    <p className="text-sm text-purple-100">{handoff.recommendedAction}</p>
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-48">
                    {handoff.state === 'needs_option' && (
                      <button
                        type="button"
                        onClick={() => handleCreateOption(handoff)}
                        disabled={busyId === handoff.trend.id}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-60"
                      >
                        <PlusCircle size={16} />
                        Create option
                      </button>
                    )}
                    {(handoff.state === 'needs_option' || handoff.state === 'option_proposed' || handoff.state === 'option_accepted') && (
                      <button
                        type="button"
                        onClick={() => handleAcceptForRoadmap(handoff)}
                        disabled={busyId === handoff.trend.id}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-[#20203a] px-4 py-2 text-sm font-medium text-gray-100 hover:border-emerald-400 hover:text-white disabled:opacity-60"
                      >
                        <GitBranch size={16} />
                        Accept for roadmap
                      </button>
                    )}
                    {handoff.state === 'roadmap_planned' && (
                      <button
                        type="button"
                        onClick={() => goTo('roadmap')}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:border-emerald-400"
                      >
                        <Map size={16} />
                        View roadmap item
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => goTo('trend-timeline')}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-[#3a3a65] bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:border-purple-400 hover:text-white"
                    >
                      View evidence timeline
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
