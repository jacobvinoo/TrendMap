/**
 * ImplicationsScreen (Step 10) — Opportunity and Threat dashboard
 * Shows all strategic implications grouped by type with priority indicators.
 */
import { useState, useEffect } from 'react';
import { repository } from './repository';
import { generateStrategicImplications } from './implicationEngine';
import type { StrategicImplication, ImplicationType } from './types';

const TYPE_CONFIG: Record<ImplicationType, { label: string; color: string; icon: string }> = {
  opportunity: { label: 'Opportunity', color: 'border-green-600 bg-green-950', icon: '🚀' },
  threat:      { label: 'Threat',      color: 'border-red-600 bg-red-950',   icon: '⚠️' },
  risk:        { label: 'Risk',        color: 'border-yellow-600 bg-yellow-950', icon: '🔶' },
  watch_item:  { label: 'Watch',       color: 'border-blue-600 bg-blue-950', icon: '👁' },
};

const FILTERS: Array<ImplicationType | 'all'> = ['all', 'opportunity', 'threat', 'risk', 'watch_item'];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-700 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
    </div>
  );
}

export default function ImplicationsScreen() {
  const [implications, setImplications] = useState<StrategicImplication[]>([]);
  const [filter, setFilter] = useState<ImplicationType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await repository.getStrategicImplications();
      setImplications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = async () => {
    await loadData();
  };

  const handleGenerate = async () => {
    const [trends, ctx] = await Promise.all([
      repository.getTrends(),
      repository.getStrategicContext()
    ]);
    if (!ctx) return;
    const generated = generateStrategicImplications(trends, ctx);
    await repository.saveStrategicImplications(generated);
    await refresh();
  };

  if (loading) return <div className="p-8">Loading implications...</div>;

  const filtered = filter === 'all' ? implications : implications.filter(si => si.implicationType === filter);
  const sorted = [...filtered].sort((a, b) => (b.urgencyScore + b.impactScore) - (a.urgencyScore + a.impactScore));

  const counts = {
    opportunity: implications.filter(si => si.implicationType === 'opportunity').length,
    threat: implications.filter(si => si.implicationType === 'threat').length,
    risk: implications.filter(si => si.implicationType === 'risk').length,
    watch_item: implications.filter(si => si.implicationType === 'watch_item').length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Opportunities &amp; Threats</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Implications
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Strategic implications derived from approved trends — sorted by urgency and impact.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(Object.entries(counts) as Array<[ImplicationType, number]>).map(([type, count]) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`rounded-xl p-4 border text-left transition-all ${TYPE_CONFIG[type].color} ${filter === type ? 'ring-1 ring-white/20' : ''}`}
          >
            <div className="text-2xl mb-1">{TYPE_CONFIG[type].icon}</div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs text-gray-400">{TYPE_CONFIG[type].label}{count !== 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {f === 'all' ? `All (${implications.length})` : `${TYPE_CONFIG[f].label}s (${counts[f]})`}
          </button>
        ))}
      </div>

      {implications.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No implications yet</p>
          <p className="text-gray-600 text-sm">Click "Generate Implications" to derive strategic implications from approved trends.</p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map(si => {
          const cfg = TYPE_CONFIG[si.implicationType];
          return (
            <div key={si.id} className={`rounded-xl border p-5 transition-colors ${cfg.color}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{cfg.label}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg leading-snug mb-1">{si.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{si.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Urgency</span><span>{(si.urgencyScore * 100).toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={si.urgencyScore} color="bg-orange-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Impact</span><span>{(si.impactScore * 100).toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={si.impactScore} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Confidence</span><span>{(si.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={si.confidenceScore} color="bg-purple-500" />
                </div>
              </div>

              {si.affectedCapabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {si.affectedCapabilities.map(c => (
                    <span key={c} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
