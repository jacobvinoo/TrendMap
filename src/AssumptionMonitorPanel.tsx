import { useState } from 'react';
import { getAssumptions, getLeadingIndicators, updateLeadingIndicator } from './mockRepository';
import type { Assumption, LeadingIndicator, IndicatorStatus } from './types';

const STATUS_LABELS: Record<IndicatorStatus, string> = {
  not_started: 'Not Started',
  weak_signal: 'Weak Signal',
  emerging: 'Emerging',
  accelerating: 'Accelerating',
  declining: 'Declining',
};

const STATUS_COLORS: Record<IndicatorStatus, string> = {
  not_started: 'bg-gray-700 text-gray-300',
  weak_signal: 'bg-yellow-900 text-yellow-300',
  emerging: 'bg-blue-900 text-blue-300',
  accelerating: 'bg-green-900 text-green-300',
  declining: 'bg-red-900 text-red-300',
};

const ALL_STATUSES: IndicatorStatus[] = ['not_started', 'weak_signal', 'emerging', 'accelerating', 'declining'];

export default function AssumptionMonitorPanel() {
  const [indicators, setIndicators] = useState<LeadingIndicator[]>(() => getLeadingIndicators());
  const assumptions = getAssumptions();

  const assumptionMap = Object.fromEntries(assumptions.map((a: Assumption) => [a.id, a]));

  const refresh = () => setIndicators(getLeadingIndicators());

  const handleStatusChange = (id: string, status: IndicatorStatus) => {
    updateLeadingIndicator(id, { currentStatus: status });
    refresh();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Assumption Monitoring</h1>
      <p className="text-gray-400 text-sm mb-6">
        Track leading indicators linked to each assumption. Update their status as new signals emerge.
      </p>

      {indicators.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-500 text-lg mb-2">No indicators yet</p>
          <p className="text-gray-600 text-sm">Generate assumptions and indicators from the Assumptions screen first.</p>
        </div>
      )}

      <div className="space-y-4">
        {indicators.map(indicator => {
          const assumption = assumptionMap[indicator.assumptionId];
          return (
            <div
              key={indicator.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 font-medium capitalize">
                      {indicator.indicatorType.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[indicator.currentStatus]}`}>
                      {STATUS_LABELS[indicator.currentStatus]}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{indicator.name}</h3>
                  {assumption && (
                    <p className="text-xs text-indigo-400 mb-2">
                      Linked to: <span className="italic">{assumption.statement.substring(0, 80)}…</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-400 font-medium mb-1">Monitoring Question</p>
                <p className="text-sm text-gray-200">{indicator.monitoringQuestion}</p>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs text-gray-500 mt-1 shrink-0">Threshold:</span>
                <p className="text-xs text-gray-300">{indicator.threshold}</p>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor={`status-${indicator.id}`}
                  className="text-xs text-gray-500 shrink-0"
                >
                  Update status:
                </label>
                <select
                  id={`status-${indicator.id}`}
                  aria-label={`Update status for ${indicator.id}`}
                  value={indicator.currentStatus}
                  onChange={e => handleStatusChange(indicator.id, e.target.value as IndicatorStatus)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
