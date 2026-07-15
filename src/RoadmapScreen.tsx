/**
 * RoadmapScreen (Phase 3 — Step 18/19)
 * Strategic Roadmap View — displays roadmap items in a Now / Next / Later horizon layout.
 * Users can generate roadmap items from accepted strategic options and update their status.
 */
import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import { generateRoadmapItems } from './roadmapEngine';
import { summarizeRoadmapExecution } from './roadmapExecution';
import type { RoadmapItem, RoadmapHorizon, RoadmapStatus } from './types';
import { Zap, Calendar, Telescope, DollarSign, FlaskConical, Users, Eye, Shield, LogOut, Wrench } from 'lucide-react';

const HORIZONS: Array<{ id: RoadmapHorizon; label: string; description: string; color: string; icon: React.ReactNode }> = [
  { id: 'now',  label: 'Now',  description: '0 – 3 months',  color: 'border-green-600 bg-green-950',  icon: <Zap size={20} /> },
  { id: 'next', label: 'Next', description: '3 – 12 months', color: 'border-blue-600 bg-blue-950',    icon: <Calendar size={20} /> },
  { id: 'later',label: 'Later',description: '12+ months',    color: 'border-purple-600 bg-purple-950',icon: <Telescope size={20} /> },
];

const STATUS_OPTIONS: Array<{ value: RoadmapStatus; label: string }> = [
  { value: 'proposed',   label: 'Proposed' },
  { value: 'accepted',   label: 'Accepted' },
  { value: 'in_progress',label: 'In Progress' },
  { value: 'blocked',    label: 'Blocked' },
  { value: 'completed',  label: 'Completed' },
  { value: 'rejected',   label: 'Rejected' },
];

const STATUS_COLORS: Record<RoadmapStatus, string> = {
  proposed:    'bg-gray-700 text-gray-300',
  accepted:    'bg-blue-900 text-blue-300',
  in_progress: 'bg-green-900 text-green-300',
  blocked:     'bg-yellow-900 text-yellow-200',
  completed:   'bg-emerald-900 text-emerald-200',
  rejected:    'bg-red-900 text-red-300',
};

const OPTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  invest: <DollarSign size={16} />, experiment: <FlaskConical size={16} />, partner: <Users size={16} />, monitor: <Eye size={16} />,
  defend: <Shield size={16} />, exit: <LogOut size={16} />, build_capability: <Wrench size={16} />,
};

export default function RoadmapScreen() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [executionDrafts, setExecutionDrafts] = useState<Record<string, Partial<RoadmapItem>>>({});

  const loadData = async () => {
    try {
      const [fetchedItems, fetchedOptions] = await Promise.all([
        repository.getRoadmapItems(),
        repository.getStrategicOptions()
      ]);
      setItems(fetchedItems);
      setOptions(fetchedOptions);
      setExecutionDrafts(Object.fromEntries(fetchedItems.map((item) => [item.id, {
        owner: item.owner || '',
        targetDate: item.targetDate || item.target_date || '',
        progressPercent: item.progressPercent ?? item.progress_percent ?? 0,
        progressNote: item.progressNote || item.progress_note || '',
      }])));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const optionMap = Object.fromEntries(options.map(o => [o.id, o]));

  const refresh = async () => {
    await loadData();
  };

  const handleGenerate = async () => {
    const accepted = options.filter(o => o.status === 'accepted');
    if (accepted.length === 0) {
      setMessage('Accept strategic options before generating roadmap items.');
      return;
    }
    const existingOptionIds = new Set(items.map((item) => item.strategicOptionId));
    const generated = generateRoadmapItems(accepted).filter((item) => !existingOptionIds.has(item.strategicOptionId));
    if (generated.length === 0) {
      setMessage('Accepted strategic options are already on the roadmap.');
      return;
    }
    await repository.saveRoadmapItems(generated);
    setMessage(`Added ${generated.length} accepted strategic option${generated.length === 1 ? '' : 's'} to the roadmap.`);
    await refresh();
  };

  const handleStatusChange = async (id: string, status: RoadmapStatus) => {
    await repository.updateRoadmapItem(id, { status });
    await refresh();
  };

  const updateDraft = (id: string, patch: Partial<RoadmapItem>) => {
    setExecutionDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), ...patch },
    }));
  };

  const handleExecutionSave = async (id: string) => {
    const draft = executionDrafts[id] || {};
    await repository.updateRoadmapItem(id, {
      owner: draft.owner || '',
      targetDate: draft.targetDate || '',
      progressPercent: Number(draft.progressPercent ?? 0),
      progressNote: draft.progressNote || '',
      lastReviewedAt: new Date().toISOString(),
    });
    setMessage('Execution details saved.');
    await refresh();
  };

  const byHorizon = (h: RoadmapHorizon) => items.filter(r => r.horizon === h);
  const executionSummary = summarizeRoadmapExecution(items);
  const readinessLabel = (item: RoadmapItem): string => {
    const targetDate = item.targetDate || item.target_date;
    if (!item.owner && !targetDate) return 'Needs owner and target date';
    if (!item.owner) return 'Needs owner';
    if (!targetDate) return 'Needs target date';
    return 'Execution ready';
  };

  if (loading) return <div className="p-8">Loading roadmap...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Strategic Roadmap</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Roadmap
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-8">
        Strategic options mapped across planning horizons. Update item status as work progresses.
      </p>
      {message && (
        <div role="status" className="mb-6 rounded-lg border border-purple-700 bg-purple-950 px-4 py-3 text-sm text-purple-100">
          {message}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No roadmap items yet</p>
          <p className="text-gray-600 text-sm mb-6">
            Generate and accept strategic options first, then click "Generate Roadmap" to place them on the timeline.
          </p>
        </div>
      )}

      {/* Horizon columns */}
      {items.length > 0 && (
        <>
          <section className="mb-8 rounded-xl border border-gray-700 bg-gray-800 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Execution Health</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Operating review of roadmap delivery risk, target dates, blockers, and progress.
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-right">
                <div className="text-xs text-gray-500">Avg progress</div>
                <div className="text-2xl font-bold text-purple-200">{executionSummary.averageProgressPercent}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: 'Overdue', value: executionSummary.overdueCount, color: 'text-red-300' },
                { label: 'Due next 30 days', value: executionSummary.dueSoonCount, color: 'text-blue-300' },
                { label: 'Blocked', value: executionSummary.blockedCount, color: 'text-yellow-200' },
                { label: 'Completed', value: executionSummary.completedCount, color: 'text-emerald-200' },
                { label: 'Missing details', value: executionSummary.missingExecutionDetailsCount, color: 'text-orange-200' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                  <div className="mt-1 text-xs text-gray-500">{metric.label}</div>
                </div>
              ))}
            </div>
            {executionSummary.attentionItems.length > 0 && (
              <div className="mt-5 border-t border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-yellow-200">Needs attention</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {executionSummary.attentionItems.slice(0, 6).map((item) => (
                    <span key={item.id} className="rounded-full border border-yellow-800 bg-yellow-950 px-3 py-1 text-xs text-yellow-100">
                      {item.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {HORIZONS.map(horizon => {
            const horizonItems = byHorizon(horizon.id);
            return (
              <div key={horizon.id}>
                {/* Column header */}
                <div className={`rounded-xl border p-4 mb-4 ${horizon.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{horizon.icon}</span>
                    <span className="text-lg font-bold text-white">{horizon.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{horizon.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {horizonItems.length} item{horizonItems.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {horizonItems.map(item => {
                    const linkedOption = optionMap[item.strategicOptionId];
                    const draft = executionDrafts[item.id] || {};
                    const readiness = readinessLabel(item);
                    const progress = Number(draft.progressPercent ?? item.progressPercent ?? item.progress_percent ?? 0);
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-3 flex flex-col gap-2 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white leading-tight">
                              {item.title}
                            </h3>
                            {linkedOption && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-gray-400">
                                  {OPTION_TYPE_ICONS[linkedOption.optionType] ?? <Zap size={12} />}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                                  {linkedOption.optionType.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Compact Status Selector replacing the bulky select + badge */}
                          <select
                            aria-label={`Status for ${item.id}`}
                            value={item.status}
                            onChange={e => handleStatusChange(item.id, e.target.value as RoadmapStatus)}
                            className={`text-[10px] px-2 py-1 rounded font-medium border-0 cursor-pointer outline-none flex-shrink-0 ${STATUS_COLORS[item.status]}`}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', textAlign: 'center' }}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value} className="bg-gray-800 text-white">{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className={`text-[11px] font-semibold ${readiness === 'Execution ready' ? 'text-green-300' : 'text-yellow-300'}`}>
                          {readiness}
                        </div>

                        {/* Success metric (compact) */}
                        <div className="text-xs text-gray-400 border-t border-gray-700/50 pt-2">
                          <span className="font-semibold text-gray-500 mr-1">KPI:</span> 
                          <span className="line-clamp-2" title={item.successMetric}>{item.successMetric}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 border-t border-gray-700/50 pt-2">
                          <label className="text-[11px] text-gray-400">
                            Owner
                            <input
                              aria-label={`Owner for ${item.id}`}
                              value={String(draft.owner ?? item.owner ?? '')}
                              onChange={(event) => updateDraft(item.id, { owner: event.target.value })}
                              className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                              placeholder="Team or accountable owner"
                            />
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[11px] text-gray-400">
                              Target date
                              <input
                                aria-label={`Target date for ${item.id}`}
                                type="date"
                                value={String(draft.targetDate ?? item.targetDate ?? item.target_date ?? '')}
                                onChange={(event) => updateDraft(item.id, { targetDate: event.target.value })}
                                className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                              />
                            </label>
                            <label className="text-[11px] text-gray-400">
                              Progress %
                              <input
                                aria-label={`Progress percent for ${item.id}`}
                                type="number"
                                min="0"
                                max="100"
                                value={Number.isFinite(progress) ? String(progress) : '0'}
                                onChange={(event) => updateDraft(item.id, { progressPercent: Number(event.target.value) })}
                                className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                              />
                            </label>
                          </div>
                          <label className="text-[11px] text-gray-400">
                            Progress note
                            <textarea
                              aria-label={`Progress note for ${item.id}`}
                              value={String(draft.progressNote ?? item.progressNote ?? item.progress_note ?? '')}
                              onChange={(event) => updateDraft(item.id, { progressNote: event.target.value })}
                              className="mt-1 min-h-16 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                              placeholder="Latest progress, blocker, or next checkpoint"
                            />
                          </label>
                          <button
                            type="button"
                            aria-label={`Save execution details for ${item.id}`}
                            onClick={() => handleExecutionSave(item.id)}
                            className="rounded bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600"
                          >
                            Save Execution Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}

      {/* Summary footer */}
      {items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: 'Total Items', value: items.length, color: 'text-white' },
            { label: 'In Progress', value: items.filter(r => r.status === 'in_progress').length, color: 'text-green-400' },
            { label: 'Accepted', value: items.filter(r => r.status === 'accepted').length, color: 'text-blue-400' },
            { label: 'Proposed', value: items.filter(r => r.status === 'proposed').length, color: 'text-gray-400' },
          ] as const).map(s => (
            <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
