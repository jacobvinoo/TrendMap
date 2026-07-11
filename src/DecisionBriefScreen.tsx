/**
 * DecisionBriefScreen (Step 17)
 * Generates and displays the strategic decision brief.
 */
import { useState, useEffect } from 'react';
import { repository } from './repository';
import { generateDecisionBrief } from './decisionBriefEngine';
import type { DecisionBrief } from './types';

export default function DecisionBriefScreen() {
  const [briefs, setBriefs] = useState<DecisionBrief[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const fetched = await repository.getDecisionBriefs();
      setBriefs(fetched);
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
    const ctx = await repository.getStrategicContext();
    if (!ctx) return;
    const [implications, options, assumptions, indicators] = await Promise.all([
      repository.getStrategicImplications(),
      repository.getStrategicOptions(),
      repository.getAssumptions(),
      repository.getLeadingIndicators()
    ]);
    const brief = generateDecisionBrief(ctx, implications, options, assumptions, indicators);
    await repository.saveDecisionBrief(brief);
    await refresh();
  };

  if (loading) return <div className="p-8">Loading decision briefs...</div>;

  const latest = briefs.length > 0
    ? briefs.reduce((a, b) => (a.generatedAt > b.generatedAt ? a : b))
    : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Decision Brief</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Brief
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-8">
        A synthesised strategic summary — ready to share with leadership.
      </p>

      {!latest && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No decision brief yet</p>
          <p className="text-gray-600 text-sm">Complete the upstream steps — implications, options, assumptions — then click "Generate Brief".</p>
        </div>
      )}

      {latest && (
        <div className="space-y-6">
          {/* Header card */}
          <div className="bg-gradient-to-br from-purple-950 to-indigo-950 border border-purple-700 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{latest.headline}</h2>
                <p className="text-xs text-gray-400">
                  Generated {new Date(latest.generatedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{latest.executiveSummary}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Top Opportunities', count: latest.topOpportunities.length, color: 'text-green-400', bg: 'bg-green-950 border-green-800' },
              { label: 'Top Threats', count: latest.topThreats.length, color: 'text-red-400', bg: 'bg-red-950 border-red-800' },
              { label: 'Recommended Options', count: latest.recommendedOptions.length, color: 'text-blue-400', bg: 'bg-blue-950 border-blue-800' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Assumptions to test */}
          {latest.assumptionsToTest.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                🧪 Assumptions to Test ({latest.assumptionsToTest.length})
              </h3>
              <p className="text-xs text-gray-500">
                {latest.assumptionsToTest.join(', ')}
              </p>
            </div>
          )}

          {/* Indicators to monitor */}
          {latest.indicatorsToMonitor.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                🔔 Indicators to Monitor ({latest.indicatorsToMonitor.length})
              </h3>
              <p className="text-xs text-gray-500">
                {latest.indicatorsToMonitor.join(', ')}
              </p>
            </div>
          )}

          {/* Evidence */}
          {latest.evidenceIds.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">
                📎 Evidence Sources ({latest.evidenceIds.length})
              </h3>
              <p className="text-xs text-gray-500">{latest.evidenceIds.join(', ')}</p>
            </div>
          )}

          {/* History */}
          {briefs.length > 1 && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2">Previous Briefs ({briefs.length - 1})</h3>
              <div className="space-y-2">
                {[...briefs]
                  .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
                  .slice(1)
                  .map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs text-gray-500">
                      <span>{b.headline}</span>
                      <span>{new Date(b.generatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
