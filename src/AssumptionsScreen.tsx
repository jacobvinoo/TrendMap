import { useState, useEffect } from 'react';
import { repository } from './repository';
import { generateAssumptionsFromTrends } from './assumptionEngine';
import type { Assumption, AssumptionType, AssumptionStatus } from './types';

const TYPE_LABELS: Record<AssumptionType, string> = {
  customer_behaviour: 'Customer Behaviour',
  technology_readiness: 'Technology Readiness',
  regulation: 'Regulation',
  economics: 'Economics',
  competitor_action: 'Competitor Action',
  operational_feasibility: 'Operational Feasibility',
};

const STATUS_COLORS: Record<AssumptionStatus, string> = {
  untested: 'bg-gray-600 text-gray-200',
  supported: 'bg-green-700 text-green-100',
  weakened: 'bg-yellow-700 text-yellow-100',
  invalidated: 'bg-red-700 text-red-100',
};

const ALL_TYPES: AssumptionType[] = [
  'customer_behaviour', 'technology_readiness', 'regulation',
  'economics', 'competitor_action', 'operational_feasibility',
];

export default function AssumptionsScreen() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [filterType, setFilterType] = useState<AssumptionType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await repository.getAssumptions();
      setAssumptions(data);
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
    const generated = generateAssumptionsFromTrends(trends, ctx);
    await repository.saveAssumptions(generated);
    await refresh();
  };

  const handleMarkStatus = async (id: string, status: AssumptionStatus) => {
    await repository.updateAssumption(id, { status });
    await refresh();
  };

  if (loading) return <div className="p-8">Loading assumptions...</div>;

  const filtered = filterType === 'all'
    ? assumptions
    : assumptions.filter(a => a.assumptionType === filterType);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Assumptions</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Assumptions
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        What needs to be true for each approved trend to have strategic impact? Test and track these assumptions over time.
      </p>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="filter-type" className="text-sm text-gray-400">
          Filter by type
        </label>
        <select
          id="filter-type"
          aria-label="Filter by type"
          value={filterType}
          onChange={e => setFilterType(e.target.value as AssumptionType | 'all')}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-2">{filtered.length} assumption{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Empty state */}
      {assumptions.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-3">No assumptions yet</p>
          <p className="text-gray-600 text-sm mb-6">Click "Generate Assumptions" to create assumptions from approved trends.</p>
        </div>
      )}

      {/* Assumption cards */}
      <div className="space-y-4">
        {filtered.map(assumption => (
          <div
            key={assumption.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 font-medium">
                    {TYPE_LABELS[assumption.assumptionType]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[assumption.status]}`}>
                    {assumption.status.charAt(0).toUpperCase() + assumption.status.slice(1)}
                  </span>
                </div>
                <p className="text-white font-medium leading-relaxed">{assumption.statement}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Confidence</div>
                  <div className="text-sm font-semibold text-blue-400">
                    {(assumption.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Importance</div>
                  <div className="text-sm font-semibold text-purple-400">
                    {(assumption.importanceScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {assumption.evidenceSummary && (
              <p className="text-xs text-gray-400 mb-3 italic border-l-2 border-gray-600 pl-3">
                {assumption.evidenceSummary}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Update status:</span>
              {assumption.status !== 'supported' && (
                <button
                  type="button"
                  aria-label="Mark Supported"
                  onClick={() => handleMarkStatus(assumption.id, 'supported')}
                  className="text-xs px-2 py-1 bg-green-900 hover:bg-green-800 text-green-300 rounded transition-colors"
                >
                  Mark Supported
                </button>
              )}
              {assumption.status !== 'weakened' && (
                <button
                  type="button"
                  aria-label="Mark Weakened"
                  onClick={() => handleMarkStatus(assumption.id, 'weakened')}
                  className="text-xs px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-300 rounded transition-colors"
                >
                  Mark Weakened
                </button>
              )}
              {assumption.status !== 'invalidated' && (
                <button
                  type="button"
                  aria-label="Mark Invalidated"
                  onClick={() => handleMarkStatus(assumption.id, 'invalidated')}
                  className="text-xs px-2 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors"
                >
                  Mark Invalidated
                </button>
              )}
              {assumption.status !== 'untested' && (
                <button
                  type="button"
                  aria-label="Reset to Untested"
                  onClick={() => handleMarkStatus(assumption.id, 'untested')}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
