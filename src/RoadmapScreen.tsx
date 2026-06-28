/**
 * RoadmapScreen (Phase 3 — Step 18/19)
 * Strategic Roadmap View — displays roadmap items in a Now / Next / Later horizon layout.
 * Users can generate roadmap items from accepted strategic options and update their status.
 */
import React, { useState } from 'react';
import {
  getRoadmapItems, saveRoadmapItems, updateRoadmapItem, getStrategicOptions,
} from './mockRepository';
import { generateRoadmapItems } from './roadmapEngine';
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
  { value: 'rejected',   label: 'Rejected' },
];

const STATUS_COLORS: Record<RoadmapStatus, string> = {
  proposed:    'bg-gray-700 text-gray-300',
  accepted:    'bg-blue-900 text-blue-300',
  in_progress: 'bg-green-900 text-green-300',
  rejected:    'bg-red-900 text-red-300',
};

const OPTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  invest: <DollarSign size={16} />, experiment: <FlaskConical size={16} />, partner: <Users size={16} />, monitor: <Eye size={16} />,
  defend: <Shield size={16} />, exit: <LogOut size={16} />, build_capability: <Wrench size={16} />,
};

export default function RoadmapScreen() {
  const [items, setItems] = useState<RoadmapItem[]>(() => getRoadmapItems());
  const options = getStrategicOptions();

  const optionMap = Object.fromEntries(options.map(o => [o.id, o]));

  const refresh = () => setItems(getRoadmapItems());

  const handleGenerate = () => {
    const accepted = options.filter(o => o.status === 'accepted' || !o.status);
    const generated = generateRoadmapItems(accepted.length > 0 ? accepted : options);
    saveRoadmapItems(generated);
    refresh();
  };

  const handleStatusChange = (id: string, status: RoadmapStatus) => {
    updateRoadmapItem(id, { status });
    refresh();
  };

  const byHorizon = (h: RoadmapHorizon) => items.filter(r => r.horizon === h);

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

                        {/* Success metric (compact) */}
                        <div className="text-xs text-gray-400 border-t border-gray-700/50 pt-2">
                          <span className="font-semibold text-gray-500 mr-1">KPI:</span> 
                          <span className="line-clamp-2" title={item.successMetric}>{item.successMetric}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
