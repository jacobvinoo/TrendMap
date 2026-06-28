import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { getSources, updateSourceStatus, updateSourceNote } from './mockRepository';
import type { Source, SourceStatus } from './types';
import { Check, X, MessageSquarePlus, FileText, Globe, AlertTriangle } from 'lucide-react';

const formatScore = (score: number) => `${Math.round(score * 100)}%`;

const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
};

const SourceLibrary: React.FC = () => {
  const [sources, setSources] = useState<Source[]>(() => getSources());
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const refresh = () => setSources(getSources());

  const handleStatusChange = (id: string, status: SourceStatus) => {
    updateSourceStatus(id, status);
    refresh();
  };

  const handleNoteChange = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    setNoteInputs({ ...noteInputs, [id]: e.target.value });
  };

  const handleAddNote = (id: string) => {
    const note = noteInputs[id]?.trim();
    if (note) {
      updateSourceNote(id, note);
      setNoteInputs({ ...noteInputs, [id]: '' });
      refresh();
    }
  };

  const pending = sources.filter(s => s.status === 'suggested');
  const reviewed = sources.filter(s => s.status !== 'suggested');

  const renderSourceCard = (src: Source) => {
    const isRejected = src.status === 'rejected';
    const isApproved = src.status === 'approved';

    return (
      <div
        key={src.id}
        data-testid="source-card"
        className={`flex flex-col bg-gray-800 border rounded-xl overflow-hidden transition-all duration-200 shadow-sm
          ${isRejected ? 'border-red-900/50 opacity-75' : isApproved ? 'border-green-900/50' : 'border-gray-700 hover:border-purple-500/50'}`}
      >
        {/* Card Header */}
        <div className={`p-4 border-b ${isRejected ? 'bg-red-950/20 border-red-900/30' : isApproved ? 'bg-green-950/20 border-green-900/30' : 'bg-gray-800/50 border-gray-700'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate" title={src.name}>
                {src.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded-full capitalize border border-gray-700">
                  {src.sourceType === 'report' ? <FileText size={12} /> : src.sourceType === 'news' ? <Globe size={12} /> : <Globe size={12} />}
                  {src.sourceType}
                </span>
                {isRejected && <span className="text-red-400 font-medium flex items-center gap-1"><AlertTriangle size={12} /> Rejected</span>}
                {isApproved && <span className="text-green-400 font-medium flex items-center gap-1"><Check size={12} /> Approved</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="p-4 grid grid-cols-3 gap-3 bg-gray-900/30 flex-1">
          {[
            { label: 'Credibility', value: src.credibilityScore, testId: `credibility-${src.id}` },
            { label: 'Relevance', value: src.relevanceScore, testId: `relevance-${src.id}` },
            { label: 'Freshness', value: src.freshnessScore, testId: `freshness-${src.id}` },
          ].map(score => (
            <div key={score.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{score.label}</span>
                <span className="text-xs font-medium text-gray-300" data-testid={score.testId}>
                  {formatScore(score.value)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getScoreColor(score.value)}`} 
                  style={{ width: `${score.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Notes Section */}
        {src.notes && (
          <div className="px-4 py-3 bg-blue-900/10 border-t border-blue-900/30 text-sm" data-testid={`notes-${src.id}`}>
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider block mb-1">Analyst Note</span>
            <span className="text-gray-300 italic line-clamp-3" data-testid={`note-text-${src.id}`}>"{src.notes}"</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/80 mt-auto">
          {src.status === 'suggested' && (
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                aria-label="Approve"
                onClick={() => handleStatusChange(src.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Check size={16} /> Approve
              </button>
              <button
                type="button"
                aria-label="Reject"
                onClick={() => handleStatusChange(src.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <X size={16} /> Reject
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add review note..."
              value={noteInputs[src.id] || ''}
              onChange={(e) => handleNoteChange(e, src.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote(src.id)}
              aria-label={`add-note-${src.id}`}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
            />
            <button 
              type="button" 
              aria-label="Add Note" 
              onClick={() => handleAddNote(src.id)}
              disabled={!noteInputs[src.id]?.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center"
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Source Library</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve data sources for document extraction and signal generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="#documents" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
            Next: Documents →
          </a>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
            Requires Review
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pending.map(renderSourceCard)}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-700">{reviewed.length}</span>
            Reviewed Sources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80 hover:opacity-100 transition-opacity">
            {reviewed.map(renderSourceCard)}
          </div>
        </div>
      )}

      {sources.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl bg-gray-800/50">
          <p className="text-gray-400">No sources found in the repository.</p>
        </div>
      )}
    </div>
  );
};

export default SourceLibrary;
