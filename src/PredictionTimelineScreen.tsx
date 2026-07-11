import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import type { Prediction } from './types';
import { Network, TrendingUp, AlertTriangle } from 'lucide-react';

const PredictionTimelineScreen: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    let active = true;
    const fetchPredictions = async () => {
      try {
        const data = await repository.getPredictions();
        if (active) setPredictions(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prediction Timeline</h1>
          <p className="text-gray-400 text-sm mt-1">
            Forecasted trends mapped across future horizons with calculated likelihood and confidence.
          </p>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl bg-gray-800/50">
          <TrendingUp size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No predictions generated yet. Run the autonomous team cycle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {predictions.map(pred => (
            <div key={pred.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors shadow-lg animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold capitalize text-white">{pred.trendId.replace(/-/g, ' ')}</h3>
                <span className="bg-blue-900/40 border border-blue-800/50 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  {pred.targetDate ? new Date(pred.targetDate).toLocaleDateString() : 'TBD'}
                </span>
              </div>
              
              <div className="mb-4 text-sm text-gray-300">
                {pred.predictionStatement}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Impact</div>
                  <div className="text-sm font-medium text-white">{pred.impact || 'Unknown'}</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Confidence</div>
                  <div className="text-2xl font-medium text-white">{Math.round((pred.confidenceScore || 0) * 100)}%</div>
                  <div className="w-full h-1 bg-gray-800 rounded-full mt-2">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(pred.confidenceScore || 0) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Network size={14} /> Key Indicators
                  </h4>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                    {pred.indicators || 'None'}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Assumptions
                  </h4>
                  <div className="text-sm text-gray-300">
                    {pred.assumptions || 'None'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionTimelineScreen;
