import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import type { AgentDebate } from './types';
import { MessagesSquare, ShieldAlert, CheckCircle, BrainCircuit } from 'lucide-react';

const AgentDebateScreen: React.FC = () => {
  const [debates, setDebates] = useState<AgentDebate[]>([]);

  useEffect(() => {
    let active = true;
    const fetchDebates = async () => {
      try {
        const data = await repository.getDebates();
        if (active) setDebates(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchDebates();
    const interval = setInterval(fetchDebates, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const getAgentColor = (role: string) => {
    switch(role) {
      case 'DiscoveryAgent': return 'text-purple-400 bg-purple-400/10 border-purple-800/50';
      case 'ValidationAgent': return 'text-red-400 bg-red-400/10 border-red-800/50';
      case 'PredictionAgent': return 'text-amber-400 bg-amber-400/10 border-amber-800/50';
      case 'ExecutiveAgent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-800/50';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-800/50';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agent Debate Console</h1>
        <p className="text-gray-400 text-sm mt-1">
          Review live arguments, contradictory evidence, and consensus building among specialized agents.
        </p>
      </div>

      {debates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl bg-gray-800/50">
          <BrainCircuit size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No active debates. Trigger an analysis cycle to begin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {debates.map(debate => (
            <div key={debate.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
              {/* Debate Header */}
              <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MessagesSquare size={20} className="text-indigo-400" />
                  <h3 className="font-semibold text-lg">{debate.topic}</h3>
                </div>
                <div className="flex gap-2">
                  {debate.status === 'active' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800/50 text-xs font-semibold uppercase tracking-wider animate-pulse">
                      <ShieldAlert size={14} /> Active Argument
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 text-xs font-semibold uppercase tracking-wider">
                      <CheckCircle size={14} /> Consensus Reached
                    </span>
                  )}
                </div>
              </div>

              {/* Debate Messages */}
              <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                {debate.messages.map((msg, i) => (
                  <div key={msg.id} className="flex gap-4 animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${getAgentColor(msg.agentRole)}`}>
                      {msg.agentRole.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-900/40 border border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className={`text-xs font-bold ${getAgentColor(msg.agentRole).split(' ')[0]}`}>
                          {msg.agentRole}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Consensus Summary */}
              {debate.consensusSummary && (
                <div className="bg-indigo-900/20 p-5 border-t border-indigo-800/50">
                  <h4 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} /> Final Consensus Resolution
                  </h4>
                  <p className="text-sm text-indigo-100">{debate.consensusSummary}</p>
                  
                  {debate.confidenceDelta !== undefined && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                      <span className="text-gray-400">Confidence Calibration:</span>
                      <span className={debate.confidenceDelta < 0 ? 'text-red-400' : 'text-green-400'}>
                        {debate.confidenceDelta > 0 ? '+' : ''}{Math.round(debate.confidenceDelta * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentDebateScreen;
