import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { repository } from './repository';
import type { Source, SourceStatus, Workspace } from './types';
import { eventBus } from './eventBus';
import { Check, X, MessageSquarePlus, FileText, Globe, AlertTriangle, Trash2, Newspaper, Plus } from 'lucide-react';
import { approvalRestrictionMessage, canApproveSources } from './workspacePermissions';

const formatScore = (score: number) => `${Math.round(score * 100)}%`;

const sourceTypeLabel = (source: Source) => source.sourceType || source.source_type || 'source';

const sourceRetrievedDate = (source: Source) => {
  const value = source.retrievedAt || source.retrieved_at || source.updatedAt || source.updated_at || source.createdAt || source.created_at;
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
};

const SourceLibrary: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [isScanningNews, setIsScanningNews] = useState(false);
  const [showManualSourceForm, setShowManualSourceForm] = useState(false);
  const [manualSource, setManualSource] = useState({
    name: '',
    url: '',
    sourceType: 'news',
    status: 'approved' as SourceStatus,
    notes: '',
  });

  const refresh = async () => {
    try {
      const [activeWorkspace, data] = await Promise.all([
        repository.getActiveWorkspace(),
        repository.getSources(),
      ]);
      setWorkspace(activeWorkspace);
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const message = window.sessionStorage.getItem('trendmap.sources.notice');
      if (message) {
        setNotice(message);
        window.sessionStorage.removeItem('trendmap.sources.notice');
      }
    }
    refresh();

    const unsub = eventBus.subscribe('DISCOVERY_CYCLE_COMPLETED', async () => {
      await refresh();
    });
    return () => {
      unsub();
    };
  }, []);

  const handleStatusChange = async (id: string, status: SourceStatus) => {
    if (!canApproveSources(workspace)) {
      setNotice(approvalRestrictionMessage('source'));
      return;
    }
    await repository.updateSourceStatus(id, status);
    await refresh();
  };

  const handleDeleteSource = async (id: string) => {
    await repository.deleteSource(id);
    await refresh();
  };

  const handleNoteChange = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    setNoteInputs({ ...noteInputs, [id]: e.target.value });
  };

  const handleAddNote = async (id: string) => {
    const note = noteInputs[id]?.trim();
    if (note) {
      await repository.updateSourceNote(id, note);
      setNoteInputs({ ...noteInputs, [id]: '' });
      await refresh();
    }
  };

  const handleScanNews = async () => {
    setIsScanningNews(true);
    setNotice('');
    try {
      const result = await repository.scanNewsForSources();
      setNotice(`${result.run.summary || 'News scan completed.'} ${result.sourcesCreated} new source candidate${result.sourcesCreated === 1 ? '' : 's'} added from relevant news snippets.`);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'News scan failed.');
    } finally {
      setIsScanningNews(false);
    }
  };

  const handleCreateManualSource = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = manualSource.name.trim();
    const url = manualSource.url.trim();
    if (!name || !url) {
      setNotice('Enter both a source name and URL.');
      return;
    }

    try {
      const created = await repository.createSource({
        name,
        url,
        sourceType: manualSource.sourceType,
        status: canApproveSources(workspace) ? manualSource.status : 'suggested',
        credibilityScore: 0.7,
        relevanceScore: 0.7,
        freshnessScore: 0.7,
        notes: manualSource.notes.trim() || 'Manually added by analyst.',
      });
      setNotice(`Added source "${created.name}". ${created.status === 'approved' ? 'It is ready for document extraction.' : 'Review and approve it before extraction.'}`);
      setManualSource({ name: '', url: '', sourceType: 'news', status: 'approved', notes: '' });
      setShowManualSourceForm(false);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to add source.');
    }
  };

  const pending = sources.filter(s => s.status === 'suggested');
  const reviewed = sources.filter(s => s.status !== 'suggested');
  const canReviewSources = canApproveSources(workspace);

  const renderSourceCard = (src: Source) => {
    const isRejected = src.status === 'rejected';
    const isApproved = src.status === 'approved';
    const typeLabel = sourceTypeLabel(src);

    return (
      <div
        key={src.id}
        data-testid="source-card"
        className={`relative flex flex-col bg-gray-800 border rounded-xl overflow-hidden transition-all duration-200 shadow-sm
          ${isRejected ? 'border-red-900/50 opacity-75' : isApproved ? 'border-green-900/50' : 'border-gray-700 hover:border-purple-500/50'}`}
      >
        {deletingSourceId === src.id && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle size={32} className="text-red-500 mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Delete Source?</h4>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete this source and all its associated documents, signals, and evidence links. This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeletingSourceId(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDeleteSource(src.id);
                  setDeletingSourceId(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        )}

        {/* Card Header */}
        <div className={`p-4 border-b ${isRejected ? 'bg-red-950/20 border-red-900/30' : isApproved ? 'bg-green-950/20 border-green-900/30' : 'bg-gray-800/50 border-gray-700'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate" title={src.name}>
                {src.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded-full capitalize border border-gray-700">
                  {typeLabel === 'report' ? <FileText size={12} /> : typeLabel === 'news' ? <Globe size={12} /> : <Globe size={12} />}
                  {typeLabel}
                </span>
                <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700">
                  Retrieved {sourceRetrievedDate(src)}
                </span>
                {isRejected && <span className="text-red-400 font-medium flex items-center gap-1"><AlertTriangle size={12} /> Rejected</span>}
                {isApproved && <span className="text-green-400 font-medium flex items-center gap-1"><Check size={12} /> Approved</span>}
              </div>
            </div>
            <button
              onClick={() => setDeletingSourceId(src.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
              aria-label="Delete source"
              title="Delete Source"
            >
              <Trash2 size={16} />
            </button>
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
                disabled={!canReviewSources}
                title={!canReviewSources ? approvalRestrictionMessage('source') : 'Approve source'}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 border border-green-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Check size={16} /> Approve
              </button>
              <button
                type="button"
                aria-label="Reject"
                onClick={() => handleStatusChange(src.id, 'rejected')}
                disabled={!canReviewSources}
                title={!canReviewSources ? approvalRestrictionMessage('source') : 'Reject source'}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
          <button
            type="button"
            onClick={() => setShowManualSourceForm((value) => !value)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 border border-gray-700"
          >
            <Plus size={16} />
            Add Source
          </button>
          <button
            type="button"
            onClick={handleScanNews}
            disabled={isScanningNews}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 border border-gray-700"
          >
            <Newspaper size={16} />
            {isScanningNews ? 'Scanning News...' : 'Scan News'}
          </button>
          <a href="#documents" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
            Next: Documents →
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading sources...</div>
      ) : (
        <>
          {showManualSourceForm && (
            <form onSubmit={handleCreateManualSource} className="mb-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Plus size={18} className="text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Add Manual Source</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Source name</span>
                  <input
                    value={manualSource.name}
                    onChange={(event) => setManualSource({ ...manualSource, name: event.target.value })}
                    placeholder="Example: Grocery industry report"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Source URL</span>
                  <input
                    value={manualSource.url}
                    onChange={(event) => setManualSource({ ...manualSource, url: event.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Type</span>
                  <select
                    value={manualSource.sourceType}
                    onChange={(event) => setManualSource({ ...manualSource, sourceType: event.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="news">News</option>
                    <option value="report">Report</option>
                    <option value="research">Research</option>
                    <option value="publication">Publication</option>
                    <option value="academic">Academic</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Initial status</span>
                  <select
                    value={manualSource.status}
                    onChange={(event) => setManualSource({ ...manualSource, status: event.target.value as SourceStatus })}
                    disabled={!canReviewSources}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="approved">Approved</option>
                    <option value="suggested">Suggested</option>
                  </select>
                  {!canReviewSources && (
                    <p className="mt-1 text-xs text-amber-200">Your role can add source suggestions. A source curator, admin, or owner must approve them.</p>
                  )}
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Notes</span>
                  <input
                    value={manualSource.notes}
                    onChange={(event) => setManualSource({ ...manualSource, notes: event.target.value })}
                    placeholder="Why this source is useful"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualSourceForm(false)}
                  className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                >
                  Add Source
                </button>
              </div>
            </form>
          )}

          {notice && (
            <div className="mb-6 bg-indigo-900/30 border border-indigo-700/60 rounded-xl px-4 py-3 text-indigo-100">
              {notice}
            </div>
          )}

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
      </>
      )}
    </div>
  );
};

export default SourceLibrary;
