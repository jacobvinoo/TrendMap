import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import { eventBus } from './eventBus';
import type { AgentActivity } from './types';
import { Activity, Play, CheckCircle2, Clock, XCircle } from 'lucide-react';

const AgentActivityScreen: React.FC = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleMessage, setCycleMessage] = useState('');

  const fetchActivities = async () => {
    const data = await repository.getAgentActivities();
    setActivities(data);
  };

  useEffect(() => {
    let active = true;
    const loadActivities = async () => {
      try {
        const data = await repository.getAgentActivities();
        if (active) setActivities(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    loadActivities();
    const interval = setInterval(loadActivities, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartCycle = async () => {
    setIsRunning(true);
    setCycleMessage('Running discovery, validation, prediction, and executive review...');
    try {
      await eventBus.publish('START_DISCOVERY_CYCLE', { scope: 'global' }, 'User');
      await fetchActivities();
      setCycleMessage('Global cycle completed. Review the latest activity, debate, and prediction timeline.');
    } catch (err) {
      console.error(err);
      setCycleMessage('Global cycle failed. Check the activity log for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock size={16} className="text-blue-400 animate-spin-slow" />;
      case 'completed': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'failed': return <XCircle size={16} className="text-red-400" />;
      default: return <Activity size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agent Activity Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time monitoring of the autonomous intelligence team.
          </p>
        </div>
        <button
          onClick={handleStartCycle}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {isRunning ? <Clock size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          {isRunning ? 'Agents Running...' : 'Trigger Global Cycle'}
        </button>
      </div>

      {cycleMessage && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
          isRunning
            ? 'bg-blue-900/30 border-blue-700/60 text-blue-100'
            : 'bg-green-900/20 border-green-700/60 text-green-100'
        }`}>
          {cycleMessage}
        </div>
      )}

      <div className="bg-[#0b0b12] border border-gray-800 rounded-xl overflow-hidden font-mono shadow-2xl">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Event Bus Log</span>
        </div>
        
        <div className="p-4 h-[600px] overflow-y-auto space-y-3 flex flex-col-reverse">
          {activities.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              No recent agent activity. Click "Trigger Global Cycle" to begin.
            </div>
          ) : (
            activities.map(activity => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-3 rounded bg-gray-900/30 border border-gray-800/50 hover:bg-gray-800/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="mt-0.5">{getStatusIcon(activity.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-blue-400">@{activity.agentRole}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-medium mb-1">[{activity.taskType}]</div>
                  <p className="text-sm text-gray-300 break-words">{activity.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentActivityScreen;
