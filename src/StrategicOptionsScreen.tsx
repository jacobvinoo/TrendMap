/**
 * StrategicOptionsScreen (Step 15)
 * Shows prioritised strategic options with scores, next steps and effort.
 */
import { useState } from 'react';
import {
  getStrategicOptions, saveStrategicOptions, updateStrategicOption,
  getStrategicImplications, getScenarios, getAssumptions, getStrategicContext,
} from './mockRepository';
import { generateStrategicOptions } from './optionEngine';
import type { StrategicOption, OptionType } from './types';

const OPTION_ICONS: Record<OptionType, string> = {
  invest: '💰',
  experiment: '🧪',
  partner: '🤝',
  monitor: '👁',
  defend: '🛡',
  exit: '🚪',
  build_capability: '🔧',
};

const EFFORT_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const TIME_LABELS: Record<string, string> = {
  now: 'Now',
  '3_months': '3 months',
  '6_months': '6 months',
  '12_months': '12 months',
  '24_months': '24 months',
};

const STATUS_OPTIONS = ['proposed', 'accepted', 'rejected', 'in_progress'] as const;

export default function StrategicOptionsScreen() {
  const [options, setOptions] = useState<StrategicOption[]>(() => getStrategicOptions());

  const refresh = () => setOptions(getStrategicOptions());

  const handleGenerate = () => {
    const ctx = getStrategicContext();
    if (!ctx) return;
    const implications = getStrategicImplications();
    const scenarios = getScenarios();
    const assumptions = getAssumptions();
    const generated = generateStrategicOptions(implications, scenarios, assumptions, ctx);
    saveStrategicOptions(generated);
    refresh();
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStrategicOption(id, { status: status as StrategicOption['status'] });
    refresh();
  };

  const sorted = [...options].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Strategic Options</h1>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate Options
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Prioritised strategic options — sorted by impact, feasibility, urgency and confidence.
      </p>

      {options.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No options yet</p>
          <p className="text-gray-600 text-sm">Generate implications and scenarios first, then click "Generate Options".</p>
        </div>
      )}

      <div className="space-y-5">
        {sorted.map((option, idx) => (
          <div key={option.id} className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-6 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-3xl mt-0.5">{OPTION_ICONS[option.optionType]}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize">
                      {option.optionType.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-semibold ${EFFORT_COLORS[option.estimatedEffort]}`}>
                      {option.estimatedEffort} effort
                    </span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-400">{TIME_LABELS[option.timeToValue]}</span>
                  </div>
                  <h2 className="text-white font-bold text-lg leading-snug">
                    <span className="text-gray-500 text-base mr-2">#{idx + 1}</span>
                    {option.title}
                  </h2>
                  <p className="text-sm text-gray-300 mt-1 leading-relaxed">{option.description}</p>
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-xs text-gray-500 mb-1">Priority</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: option.priorityScore >= 0.7 ? '#4ade80' : option.priorityScore >= 0.4 ? '#facc15' : '#f87171' }}
                >
                  {(option.priorityScore * 100).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Score grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Impact', value: option.impactScore, color: '#60a5fa' },
                { label: 'Feasibility', value: option.feasibilityScore, color: '#a78bfa' },
                { label: 'Urgency', value: option.urgencyScore, color: '#f97316' },
                { label: 'Confidence', value: option.confidenceScore, color: '#34d399' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{s.label}</span><span style={{ color: s.color }}>{(s.value * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${s.value * 100}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Next step highlight */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-400 font-semibold mb-1">Recommended Next Step</p>
              <p className="text-sm text-gray-200">{option.recommendedNextStep}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Status:</span>
              <select
                aria-label={`Status for ${option.id}`}
                value={option.status ?? 'proposed'}
                onChange={e => handleStatusChange(option.id, e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
