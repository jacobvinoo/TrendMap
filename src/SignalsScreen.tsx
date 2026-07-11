import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import { Filter, BarChart2, Calendar, FileText, Globe, ArrowRight } from 'lucide-react';
import LogViewerModal from './LogViewerModal';
import { MovableModal } from './MovableModal';

import type { Signal, Source, Document } from './types';

const SignalsScreen: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pestleFilter, setPestleFilter] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<string>('');
  const [selected, setSelected] = useState<Signal | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const allSignals = await repository.getSignals();
      setSignals(allSignals);

      const allSources = await repository.getSources();
      setSources(allSources);

      const allDocs = await repository.getDocuments();
      setDocuments(allDocs);
    } catch (err) {
      console.error('Failed to load signal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selected) {
      setShowHistory(false);
    }
  }, [selected]);

  const filtered = signals.filter((s) => {
    if (pestleFilter && s.pestleCategory !== pestleFilter) return false;
    if (minConfidence) {
      const min = parseFloat(minConfidence);
      if (Number.isNaN(min) ? false : s.confidenceScore < min) return false;
    }
    return true;
  });

  const approvedSourceIds = new Set(sources.filter((source) => source.status === 'approved').map((source) => source.id));
  const reviewableDocumentIds = new Set(
    documents
      .filter((document) => {
        const content = (document.content || '').toLowerCase();
        return approvedSourceIds.has(document.sourceId)
          && ['raw', 'processed', 'extracted'].includes(document.ingestionStatus)
          && !content.includes('mock extracted content');
      })
      .map((document) => document.id)
  );
  const eligibleSignals = filtered.filter((signal) =>
    approvedSourceIds.has(signal.sourceId) && reviewableDocumentIds.has(signal.documentId)
  );

  const getSourceName = (id: string) => {
    const src = sources.find((s) => s.id === id);
    return src ? src.name : id;
  };

  const getDocumentTitle = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    return doc ? doc.title : id;
  };

  const handleGenerateTrends = async () => {
    setIsGenerating(true);
    setFeedbackMsg('');
    
    try {
      const savedTrends = await repository.analyzeTrends();
      if (savedTrends.length === 0) {
        setFeedbackMsg('No candidate trends were generated. Review the latest documents and extract signals from the current run first.');
      } else {
        setFeedbackMsg(`Generated ${savedTrends.length} candidate trend${savedTrends.length === 1 ? '' : 's'} from the current evidence run.`);
      }
    } catch (err) {
      console.error('Failed to generate trends:', err);
      setFeedbackMsg(`Error: ${err instanceof Error ? err.message : 'Failed to generate trends.'}`);
    } finally {
      setIsGenerating(false);
    }
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
            type="button"
            onClick={() => setShowLogs(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            View Logs
          </button>
          <button 
            onClick={handleGenerateTrends}
            disabled={loading || isGenerating || eligibleSignals.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            {isGenerating ? 'Clustering...' : 'Generate Candidate Trends'}
          </button>
          <a href="#trends" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
            Next: Trends <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {showLogs && <LogViewerModal onClose={() => setShowLogs(false)} />}

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
          Showing {filtered.length} of {signals.length} signals · {eligibleSignals.length} eligible for trend generation
        </div>
      </div>

      {/* Signals Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading signals...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-800/30">
          <p>No signals match current filters.</p>
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

      {/* Detail Modal */}
      {selected && (
        <MovableModal
          title={`Signal: ${selected.pestleCategory}`}
          subtitle="Signal Details"
          onClose={() => setSelected(null)}
          width="w-[700px]"
          height="max-h-[85vh]"
          testId="signal-detail-panel"
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="mb-4 text-xl font-bold leading-snug text-white">
                {selected.title}
              </h3>
              
              {!showHistory ? (
                <>
                  <div className="mb-6 rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {selected.summary}
                    </p>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/30 p-3">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Novelty</div>
                      <div className="text-lg font-medium text-white">{Math.round(selected.noveltyScore * 100)}%</div>
                    </div>
                    <div className="rounded-lg border border-gray-700/30 bg-gray-800/30 p-3">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Strength</div>
                      <div className="text-lg font-medium text-white">{Math.round(selected.strengthScore * 100)}%</div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-gray-800 pt-4">
                    <div className="flex items-start gap-3">
                      <Globe size={16} className="mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs font-medium text-gray-500">Source</div>
                        <div className="text-sm text-gray-200">{getSourceName(selected.sourceId)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs font-medium text-gray-500">Origin Document</div>
                        <div className="text-sm text-gray-200">{getDocumentTitle(selected.documentId)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar size={16} className="mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs font-medium text-gray-500">Evidence Date</div>
                        <div className="text-sm text-gray-200">
                          {new Date(selected.evidenceDate).toLocaleDateString(undefined, { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {!selected.logs || selected.logs.length === 0 ? (
                    <div className="text-sm italic text-gray-500">No logs available for this signal.</div>
                  ) : (
                    selected.logs.map((log, i) => (
                      <div key={i} className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-4 text-sm">
                        <div className="mb-2 text-xs text-gray-500">
                          {new Date(log.date).toLocaleString()}
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-300">
                          {log.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-between border-t border-gray-800 bg-gray-900/50 p-5">
              <button 
                type="button" 
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-600/30"
              >
                {showHistory ? 'View Details' : 'View History'}
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};

export default SignalsScreen;
