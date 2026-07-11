/**
 * ScenariosScreen (Step 12)
 * Shows all generated scenarios by type with probability/impact.
 */
import { useState, useEffect } from 'react';
import { repository } from './repository';
import { generateScenarios } from './scenarioEngine';
import type { Scenario, ScenarioType } from './types';

const SCENARIO_CONFIG: Record<ScenarioType, { label: string; color: string; icon: string; description: string }> = {
  upside:    { label: 'Upside',    icon: '🌟', color: 'border-green-600 bg-green-950', description: 'Best case if opportunities materialise' },
  base_case: { label: 'Base Case', icon: '📊', color: 'border-blue-600 bg-blue-950',  description: 'Most likely trajectory' },
  downside:  { label: 'Downside',  icon: '⬇️',  color: 'border-red-600 bg-red-950',   description: 'If threats and blockers dominate' },
  wildcard:  { label: 'Wildcard',  icon: '⚡',  color: 'border-yellow-600 bg-yellow-950', description: 'Unexpected disruption scenario' },
};

export default function ScenariosScreen() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const fetched = await repository.getScenarios();
      setScenarios(fetched);
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
    const [implications, assumptions, indicators] = await Promise.all([
      repository.getStrategicImplications(),
      repository.getAssumptions(),
      repository.getLeadingIndicators()
    ]);
    const generated = generateScenarios(implications, assumptions, indicators, ctx);
    await repository.saveScenarios(generated);
    await refresh();
  };

  if (loading) return <div className="p-8">Loading scenarios...</div>;

  const ORDER: ScenarioType[] = ['upside', 'base_case', 'downside', 'wildcard'];
  const sorted = [...scenarios].sort((a, b) =>
    ORDER.indexOf(a.scenarioType) - ORDER.indexOf(b.scenarioType)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Scenarios
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-8">
        Explore what different futures might look like. Each scenario is grounded in your implications and assumptions.
      </p>

      {scenarios.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No scenarios yet</p>
          <p className="text-gray-600 text-sm">Generate implications and assumptions first, then click "Generate Scenarios".</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {sorted.map(scenario => {
          const cfg = SCENARIO_CONFIG[scenario.scenarioType];
          return (
            <div key={scenario.id} className={`rounded-xl border p-6 transition-colors ${cfg.color}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-widest block">{cfg.label}</span>
                      <h2 className="text-xl font-bold text-white leading-snug">{scenario.name}</h2>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{scenario.summary}</p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Probability</div>
                    <div className="text-xl font-bold text-white">{(scenario.probabilityScore * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Impact</div>
                    <div className="text-xl font-bold text-white">{(scenario.impactScore * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Trigger Conditions</p>
                <ul className="space-y-1">
                  {scenario.triggerConditions.map((c, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-gray-600 shrink-0">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {scenario.earlyWarningIndicators.length > 0 && (
                <div className="text-xs text-gray-500">
                  🔔 <span>{scenario.earlyWarningIndicators.length} early warning indicator{scenario.earlyWarningIndicators.length !== 1 ? 's' : ''} linked</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
