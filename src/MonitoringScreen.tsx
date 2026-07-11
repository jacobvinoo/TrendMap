// @ts-nocheck

import { useState, useEffect } from 'react'; 
import { repository } from './repository';
import type { Source, MonitoringRule, IndustryProfile } from './types'; 

export default function MonitoringScreen() {
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [localRules, setLocalRules] = useState<MonitoringRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fetchedProfile, fetchedSources, fetchedRules] = await Promise.all([
        repository.getIndustryProfile(),
        repository.getSources(),
        repository.getMonitoringRules()
      ]);
      setProfile(fetchedProfile);
      setSources(fetchedSources.filter(s => s.status === 'approved'));
      setLocalRules(fetchedRules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnable = async (sourceId: string) => {
    if (!profile) return;
    const newRule: MonitoringRule = {
      id: `rule-${Date.now()}`,
      sourceId,
      industryProfileId: profile.id,
      frequency: 'weekly',
      enabled: true,
      keywords: [],
      includePatterns: [],
      excludePatterns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await repository.saveMonitoringRule(newRule);
    await loadData();
  };

  const handleDisable = async (rule: MonitoringRule) => {
    const updated = { ...rule, enabled: false, updatedAt: new Date().toISOString() };
    await repository.saveMonitoringRule(updated);
    await loadData();
  };

  const handleFrequencyChange = async (rule: MonitoringRule, freq: 'daily'|'weekly'|'monthly'|'manual') => {
    const updated = { ...rule, frequency: freq, updatedAt: new Date().toISOString() };
    await repository.saveMonitoringRule(updated);
    await loadData();
  };

  const handleAddKeyword = async (rule: MonitoringRule, keyword: string) => {
    if (!keyword.trim()) return;
    const updated = { ...rule, keywords: [...rule.keywords, keyword.trim()], updatedAt: new Date().toISOString() };
    await repository.saveMonitoringRule(updated);
    await loadData();
  };

  if (loading) return <div className="p-8">Loading configuration...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Monitoring Configuration</h1>
      <p className="text-gray-400 mb-8">Configure continuous monitoring for approved sources.</p>
      
      <div className="space-y-6">
        {sources.length === 0 ? (
          <p className="text-gray-400 italic">No approved sources available for monitoring. Approve sources in the Source Library first.</p>
        ) : (
          sources.map(source => {
            const rule = localRules.find(r => r.sourceId === source.id);
            const isEnabled = String(rule?.enabled) === 'true';
            
            return (
              <div key={source.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{source.name}</h2>
                    <p className="text-sm text-gray-400 mt-1">{source.url}</p>
                  </div>
                  <div>
                    {!isEnabled ? (
                      <button 
                         onClick={async () => {
                          if (rule) {
                             const updated = { ...rule, enabled: true, updatedAt: new Date().toISOString() };
                             await repository.saveMonitoringRule(updated);
                             await loadData();
                          } else {
                             await handleEnable(source.id);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
                      >
                        Enable Monitoring
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDisable(rule!)}
                        className="bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded font-medium border border-red-800"
                      >
                        Disable Monitoring
                      </button>
                    )}
                  </div>
                </div>

                {isEnabled && rule && (
                  <div className="mt-4 border-t border-gray-700 pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor={`freq-${rule.id}`}>Frequency</label>
                      <select 
                        id={`freq-${rule.id}`}
                        aria-label="Frequency"
                        value={rule.frequency}
                        onChange={(e) => handleFrequencyChange(rule, e.target.value as any)}
                        className="w-48 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor={`kw-${rule.id}`}>Keywords (Press Enter to add)</label>
                      <input 
                        id={`kw-${rule.id}`}
                        placeholder="Add keyword..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddKeyword(rule, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rule.keywords.map(kw => ( 
                          <span key={kw} className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
