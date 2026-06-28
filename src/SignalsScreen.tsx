import React, { useState, useEffect } from 'react';
import { getSignals, getSources, getDocuments, saveTrends, addEvidence } from './mockRepository';
import { clusterSignalsIntoTrends } from './trendClustering';
import { generateEvidenceLinks } from './evidenceLinking';
import { X, Filter, BarChart2, Calendar, FileText, Globe, ArrowRight } from 'lucide-react';

import type { Signal, Source, Document } from './types';

const SignalsScreen: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pestleFilter, setPestleFilter] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<string>('');
  const [selected, setSelected] = useState<Signal | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setSignals(getSignals());
    setSources(getSources());
    setDocuments(getDocuments());
  }, []);

  const filtered = signals.filter((s) => {
    if (pestleFilter && s.pestleCategory !== pestleFilter) return false;
    if (minConfidence) {
      const min = parseFloat(minConfidence);
      if (Number.isNaN(min) ? false : s.confidenceScore < min) return false;
    }
    return true;
  });

  const getSourceName = (id: string) => {
    const src = sources.find((s) => s.id === id);
    return src ? src.name : id;
  };

  const getDocumentTitle = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    return doc ? doc.title : id;
  };

  const handleGenerateTrends = () => {
    setIsGenerating(true);
    // Simulate slight processing delay for UX
    setTimeout(() => {
      const candidateTrends = clusterSignalsIntoTrends(signals);
      if (candidateTrends.length === 0) {
        setFeedbackMsg('No candidate trends could be generated from current signals.');
        setIsGenerating(false);
        return;
      }

      const evidenceLinks = generateEvidenceLinks(candidateTrends, signals, documents, sources);
      const validTrends = candidateTrends.filter(t => 
        evidenceLinks.some(e => e.trendId === t.id)
      );

      if (validTrends.length === 0) {
        setFeedbackMsg('No candidate trends could be generated (insufficient approved evidence).');
        setIsGenerating(false);
        return;
      }

      saveTrends(validTrends);
      evidenceLinks.forEach(link => addEvidence(link));

      setFeedbackMsg(`Generated ${validTrends.length} candidate trend(s) mapped with ${evidenceLinks.length} quotes.`);
      setIsGenerating(false);
      setTimeout(() => setFeedbackMsg(''), 5000);
    }, 600);
  };

  const uniqueCategories = [...new Set(signals.map((s) => s.pestleCategory))].filter(Boolean);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Extracted Signals</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review raw signals extracted from documents and cluster them into candidate trends.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {feedbackMsg && (
            <span className="text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full text-sm font-medium animate-in fade-in slide-in-from-right-4">
              {feedbackMsg}
            </span>
          )}
          <button 
            onClick={handleGenerateTrends}
            disabled={isGenerating || signals.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            {isGenerating ? 'Clustering...' : 'Generate Candidate Trends'}
          </button>
          <a href="#trends" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
            Next: Trends <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 text-gray-400 font-medium text-sm mr-4">
          <Filter size={16} /> Filters
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <select
              aria-label="PESTLE category"
              value={pestleFilter}
              onChange={(e) => setPestleFilter(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              aria-label="Min confidence"
              type="number"
              step="0.05"
              min="0"
              max="1"
              placeholder="Min Confidence (0-1)"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-500 ml-auto whitespace-nowrap">
          Showing {filtered.length} of {signals.length} signals
        </div>
      </div>

      {/* Signals Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl bg-gray-800/50">
          <p className="text-gray-400">No signals extracted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <div
              key={s.id}
              data-testid="signal-card"
              onClick={() => setSelected(s)}
              className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/80 rounded-xl p-5 cursor-pointer transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 capitalize">
                  {s.pestleCategory}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <BarChart2 size={12} /> {Math.round(s.confidenceScore * 100)}%
                </span>
              </div>
              
              <h3 className="text-base font-semibold text-white mb-2 leading-tight group-hover:text-indigo-200 transition-colors">
                {s.title}
              </h3>
              
              <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">
                {s.summary}
              </p>
              
              <div className="pt-3 border-t border-gray-700/50 flex flex-col gap-1.5 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <Globe size={12} className="flex-shrink-0" />
                    <span className="truncate">{getSourceName(s.sourceId)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <Calendar size={12} />
                    {new Date(s.evidenceDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            data-testid="signal-detail-panel"
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 capitalize">
                  {selected.pestleCategory}
                </span>
                <span className="text-sm text-gray-400 font-medium">Signal Details</span>
              </div>
              <button 
                type="button" 
                aria-label="Close" 
                onClick={() => setSelected(null)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4 leading-snug">
                {selected.title}
              </h3>
              
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 mb-6">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Novelty</div>
                  <div className="text-lg font-medium text-white">{Math.round(selected.noveltyScore * 100)}%</div>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Strength</div>
                  <div className="text-lg font-medium text-white">{Math.round(selected.strengthScore * 100)}%</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                <div className="flex items-start gap-3">
                  <Globe size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Source</div>
                    <div className="text-sm text-gray-200">{getSourceName(selected.sourceId)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Origin Document</div>
                    <div className="text-sm text-gray-200">{getDocumentTitle(selected.documentId)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Evidence Date</div>
                    <div className="text-sm text-gray-200">
                      {new Date(selected.evidenceDate).toLocaleDateString(undefined, { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-end">
              <button 
                type="button" 
                onClick={() => setSelected(null)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalsScreen;
