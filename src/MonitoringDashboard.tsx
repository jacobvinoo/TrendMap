
import { useState, useEffect } from 'react'; 
import { repository } from './repository';
import type { MonitoringRule, WhatChangedSummary, MonitoringRun } from './types'; 

export default function MonitoringDashboard() {
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [summaries, setSummaries] = useState<WhatChangedSummary[]>([]);
  const [runs, setRuns] = useState<MonitoringRun[]>([]);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [scenario, setScenario] = useState<'baseline' | 'new_activity' | 'contradictory_activity'>('new_activity');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fetchedRules, fetchedSummaries, fetchedRuns] = await Promise.all([
        repository.getMonitoringRules(),
        repository.getWhatChangedSummaries(),
        repository.getMonitoringRuns()
      ]);
      setRules(fetchedRules.filter(r => r.enabled));
      setSummaries(fetchedSummaries);
      setRuns(fetchedRuns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRun = async (ruleId: string) => {
    setIsRunning(ruleId);
    try {
      await repository.runMonitoringRule(ruleId, scenario);
      await loadData();
    } finally {
      setIsRunning(null);
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;


  const latestSummary = summaries.length > 0 ? summaries[summaries.length - 1] : null;
  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Monitoring Dashboard</h1>
      
      {/* Operational Health Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">System Health</div>
          <div className={`text-xl font-bold capitalize ${
            latestRun?.status === 'failed' || latestRun?.status === 'error' ? 'text-red-400' :
            latestRun?.status === 'running' ? 'text-blue-400' :
            latestRun?.status === 'completed' ? 'text-green-400' :
            'text-gray-400'
          }`}>{latestRun ? latestRun.status : 'Idle'}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Last Run</div>
          <div className="text-xl font-bold text-white">{latestRun ? new Date(latestRun.completedAt || latestRun.startedAt).toLocaleTimeString() : 'Never'}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Next Run</div>
          <div className="text-xl font-bold text-gray-300">
            {rules.some(r => r.nextRunAt) 
              ? new Date(Math.min(...rules.map(r => r.nextRunAt ? new Date(r.nextRunAt).getTime() : Infinity))).toLocaleTimeString() 
              : 'Unscheduled'}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Sources Monitored</div>
          <div className="text-xl font-bold text-white">{rules.length}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Documents Scanned</div>
          <div className="text-xl font-bold text-blue-400">{latestRun ? latestRun.documentsScanned : 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Alerts Generated</div>
          <div className="text-xl font-bold text-red-400">{latestSummary ? latestSummary.alerts.length : 0}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Active Monitoring Rules</h2>
          <div className="mb-4 flex items-center gap-4">
            <label htmlFor="scenario-select" className="text-sm text-gray-300">Simulate Scenario:</label>
            <select
              id="scenario-select"
              value={scenario}
              onChange={e => setScenario(e.target.value as any)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-700 text-sm"
            >
              <option value="new_activity">New Activity (Default)</option>
              <option value="baseline">Baseline (No Change)</option>
              <option value="contradictory_activity">Contradictory / Cooling</option>
            </select>
          </div>
          {rules.length === 0 ? (
            <p className="text-gray-400 italic bg-gray-800 p-6 rounded-lg border border-gray-700">No active monitoring rules. Configure them in the setup screen.</p>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Active Rule for Source: {rule.sourceId}</h3>
                    <p className="text-sm text-gray-400">Frequency: {rule.frequency} | Keywords: {rule.keywords.join(', ') || 'None'}</p>
                  </div>
                  <button 
                    onClick={() => handleRun(rule.id)}
                    disabled={isRunning === rule.id}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded font-medium"
                  >
                    {isRunning === rule.id ? 'Running...' : 'Run Monitoring Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Latest Scan Summary</h2>
          {latestSummary ? (
            <div className="bg-blue-900/30 border border-blue-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">{latestSummary.headline}</h3>
              
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-purple-300 bg-purple-900/40 px-2 py-1 rounded">New Signals: {latestSummary.newSignals.length}</span>
                <span className="text-blue-300 bg-blue-900/40 px-2 py-1 rounded">Changed Trends: {latestSummary.changedTrends.length}</span>
              </div>
              
              {latestSummary.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Recommended Actions:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {latestSummary.recommendedActions.map((action, i) => ( 
                      <li key={i} className="text-sm text-gray-200">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic bg-gray-800 p-6 rounded-lg border border-gray-700">No monitoring runs have completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
