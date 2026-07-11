// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { repository } from './repository';
import { extractSignalsFromDocument } from './signalExtraction';
import type { Document, Source } from './types';
import { Download, ExternalLink, FileText, RefreshCw, Plus, Trash2 } from 'lucide-react';
import LogViewerModal from './LogViewerModal';
import { MovableModal } from './MovableModal';

interface DocumentWithSource extends Document {
  sourceName: string;
  sourceStatus: string;
}

const DocumentIntake: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithSource | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [totalSignalsExtracted, setTotalSignalsExtracted] = useState(0);
  const [lastExtractedDate, setLastExtractedDate] = useState<string | null>(null);
  const [showManualDocumentForm, setShowManualDocumentForm] = useState(false);
  const [manualDocument, setManualDocument] = useState({
    sourceId: '',
    title: '',
    url: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    content: '',
  });
  const [manualDocumentFile, setManualDocumentFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const docs = await repository.getDocuments();
      const fetchedSources = await repository.getSources();
      const signals = await repository.getSignals();

      setTotalSignalsExtracted(signals.length);
      if (signals.length > 0) {
        const sorted = signals
          .filter(s => s.created_at)
          .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
        if (sorted.length > 0 && sorted[0].created_at) {
          setLastExtractedDate(new Date(sorted[0].created_at).toLocaleString());
        }
      }

      setSources(fetchedSources);
      if (!manualDocument.sourceId) {
        const preferredSource = fetchedSources.find((source) => source.status === 'approved') || fetchedSources[0];
        if (preferredSource) {
          setManualDocument((current) => ({ ...current, sourceId: current.sourceId || preferredSource.id }));
        }
      }
      const sourceMap = new Map<string, Source>(fetchedSources.map(s => [s.id, s]));

      const enriched = docs.map(doc => {
        const source = sourceMap.get(doc.sourceId);
        return {
          ...doc,
          sourceName: source?.name ?? 'Unknown Source',
          sourceStatus: source?.status ?? 'suggested',
        };
      });

      setDocuments(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExtract = async (doc: DocumentWithSource) => {
    setExtractingIds((prev) => new Set(prev).add(doc.id));
    try {
      const newSignals = await repository.extractSignalsFromDocument(doc.id);
      
      // Save extracted signal IDs back to the document to complete traceability
      const signalIds = newSignals.map((s: any) => s.id);
      await repository.updateDocumentExtractedSignals(doc.id, signalIds);
      
      await repository.updateDocumentIngestionStatus(doc.id, 'extracted');
      await loadData(); // Refresh UI
    } catch (err) {
      console.error(err);
      setNotice(`Failed to extract signals for ${doc.title}. Ensure backend is running.`);
    } finally {
      setExtractingIds((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const displayedDocs = documents.filter(doc => showAll || doc.sourceStatus === 'approved');

  const handleToggleDoc = (docId: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedDocs.size === displayedDocs.length && displayedDocs.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(displayedDocs.map(d => d.id)));
    }
  };

  const handleExtractSelected = async () => {
    const docsToExtract = selectedDocs.size > 0 
      ? displayedDocs.filter(d => selectedDocs.has(d.id) && d.ingestionStatus !== 'extracted')
      : displayedDocs.filter(d => d.ingestionStatus !== 'extracted');
      
    if (docsToExtract.length === 0) {
      setNotice('No pending documents to extract signals from.');
      return;
    }
    
    // Extract sequentially to avoid overloading the LLM
    for (const doc of docsToExtract) {
      await handleExtract(doc);
    }
    setNotice(`Successfully processed ${docsToExtract.length} document(s).`);
    setSelectedDocs(new Set());
  };

  const handleRunDocumentExtraction = async () => {
    setIsRefreshing(true);
    setNotice('');
    try {
      const latestSources = await repository.getSources();
      const approvedSources = latestSources.filter((source) => source.status === 'approved');
      if (approvedSources.length === 0) {
        setNotice('Approve at least one source before running document extraction.');
        return;
      }

      const result = await repository.extractDocumentsFromSources();
      const baseMessage = result.message || `Document extraction refreshed ${result.importedCount} document record${result.importedCount === 1 ? '' : 's'} from approved sources.`;
      const restartHint = baseMessage.includes('browser-only storage') ? ' Restart with npm run dev.' : '';
      const failureSummary = result.errors?.length
        ? ` ${result.errors.length} source${result.errors.length === 1 ? '' : 's'} could not be fetched or did not match the saved industry context. Open View Logs for details.`
        : '';
      setNotice(`${baseMessage}${restartHint}${failureSummary}`);
      await loadData();
    } catch (error) {
      console.error(error);
      setNotice('Document extraction failed. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateManualDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = manualDocument.title.trim();
    const content = manualDocument.content.trim();
    const url = manualDocument.url.trim();
    if (!manualDocument.sourceId) {
      setNotice('Add or approve a source before adding a manual document.');
      return;
    }
    if (!title) {
      setNotice('Enter a document title.');
      return;
    }
    if (!content && !url && !manualDocumentFile) {
      setNotice('Upload a file, paste document content, or enter a reference URL.');
      return;
    }

    try {
      const metadata = {
        sourceId: manualDocument.sourceId,
        title,
        url,
        publishedDate: manualDocument.publishedDate ? new Date(manualDocument.publishedDate).toISOString() : new Date().toISOString(),
        ingestionStatus: 'raw',
        extractedSignalIds: [],
      };
      const created = manualDocumentFile
        ? await repository.uploadDocument(manualDocumentFile, metadata)
        : await repository.createDocument({
            ...metadata,
            content: content || `Manual reference URL added for review: ${url}`,
          });
      setNotice(`Added document "${created.title}". Review it, then extract signals when ready.`);
      setManualDocument({
        sourceId: manualDocument.sourceId,
        title: '',
        url: '',
        publishedDate: new Date().toISOString().slice(0, 10),
        content: '',
      });
      setManualDocumentFile(null);
      setShowManualDocumentForm(false);
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to add document.');
    }
  };

  const buildReviewText = (doc: DocumentWithSource) => [
    `Title: ${doc.title}`,
    `Source: ${doc.sourceName}`,
    `Source status: ${doc.sourceStatus}`,
    `Published: ${doc.publishedDate}`,
    `Reference URL: ${doc.url || 'No URL stored'}`,
    `Ingestion status: ${doc.ingestionStatus}`,
    '',
    'Stored excerpt / content',
    '------------------------',
    doc.content || 'No excerpt stored for this document.',
  ].join('\n');

  const handleDownload = (doc: DocumentWithSource) => {
    const blob = new Blob([buildReviewText(doc)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || doc.id}.txt`;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDocument = async (doc: DocumentWithSource) => {
    const confirmed = window.confirm(`Delete "${doc.title}" from TrendMap? This also removes extracted signals and evidence links created from this document.`);
    if (!confirmed) return;

    try {
      await repository.deleteDocument(doc.id);
      setSelectedDocs((current) => {
        const next = new Set(current);
        next.delete(doc.id);
        return next;
      });
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument(null);
      }
      setNotice(`Deleted document "${doc.title}".`);
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Failed to delete document "${doc.title}".`);
    }
  };


  const excerptIsThin = (doc: DocumentWithSource) => (doc.content || '').trim().split(/\s+/).filter(Boolean).length < 40;
  const isManualDocument = (doc: DocumentWithSource) => !doc.extractionRunId;
  const previewExcerpt = (content?: string) => {
    const trimmed = (content || '').trim();
    if (trimmed.length <= 360) return trimmed;
    return `${trimmed.slice(0, 360).trim()}...`;
  };

  return (
    <div data-testid="document-intake" className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Document Intake</h2>
          <p className="text-sm text-gray-400 mt-1">
            Run extraction from approved sources, then review stored excerpts before extracting signals.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
             <div className="rounded-lg bg-gray-800/80 px-3 py-1.5 text-gray-300 border border-gray-700">
               <span className="font-semibold text-white">{totalSignalsExtracted}</span> signals extracted
             </div>
             {lastExtractedDate && (
               <div className="text-gray-500">
                 Last extracted: {lastExtractedDate}
               </div>
             )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowManualDocumentForm((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            <Plus size={16} />
            Add Document
          </button>
          <button
            type="button"
            onClick={handleRunDocumentExtraction}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing Documents...' : 'Run Document Extraction'}
          </button>
          <button
            type="button"
            onClick={handleExtractSelected}
            disabled={extractingIds.size > 0 || isRefreshing || (selectedDocs.size === 0 && displayedDocs.filter(d => d.ingestionStatus !== 'extracted').length === 0)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <RefreshCw size={16} className={extractingIds.size > 0 ? 'animate-spin' : ''} />
            {extractingIds.size > 0 
              ? `Extracting ${extractingIds.size} Signal(s)...` 
              : selectedDocs.size > 0 
                ? `Extract ${selectedDocs.size} Selected` 
                : 'Extract All Signals'}
          </button>
          <button
            type="button"
            onClick={() => setShowLogs(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            View Logs
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedDocs.size === displayedDocs.length && displayedDocs.length > 0}
              onChange={handleToggleAll}
              className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
              aria-label="show-all-toggle"
            />
            <span className="text-sm font-medium text-gray-300">Select All</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-300">Show all</span>
          </label>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-blue-700/60 bg-blue-900/20 px-4 py-3 text-sm text-blue-100">
          {notice}
        </div>
      )}

      {showLogs && <LogViewerModal onClose={() => setShowLogs(false)} />}

      {showManualDocumentForm && (
        <form onSubmit={handleCreateManualDocument} className="mb-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Add Manual Document or Link</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-300">Source</span>
              <select
                value={manualDocument.sourceId}
                onChange={(event) => setManualDocument({ ...manualDocument, sourceId: event.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a source</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-300">Published date</span>
              <input
                type="date"
                value={manualDocument.publishedDate}
                onChange={(event) => setManualDocument({ ...manualDocument, publishedDate: event.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Document title</span>
              <input
                value={manualDocument.title}
                onChange={(event) => setManualDocument({ ...manualDocument, title: event.target.value })}
                placeholder="Article, report, or document title"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Reference URL</span>
              <input
                value={manualDocument.url}
                onChange={(event) => setManualDocument({ ...manualDocument, url: event.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Upload document</span>
              <input
                aria-label="Upload document file"
                type="file"
                accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.docx,.pdf,text/*,application/json,text/html"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setManualDocumentFile(file);
                  if (file && !manualDocument.title.trim()) {
                    setManualDocument({ ...manualDocument, title: file.name.replace(/\.[^.]+$/, '') });
                  }
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Supports text, Markdown, CSV, JSON, HTML, DOCX, and PDF when the backend has PDF parsing installed.
              </p>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Excerpt or full document text</span>
              <textarea
                value={manualDocument.content}
                onChange={(event) => setManualDocument({ ...manualDocument, content: event.target.value })}
                rows={8}
                placeholder="Paste the article excerpt, report section, notes, or full text you want TrendMap to use as evidence."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm leading-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowManualDocumentForm(false)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Add Document
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading documents...</div>
      ) : displayedDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/40 p-8 text-gray-300">
          <p className="mb-2 font-medium text-white">No extracted documents yet.</p>
          <p className="text-sm text-gray-400">
            {sources.some((source) => source.status === 'approved')
              ? 'Run document extraction to generate reviewable document records from approved sources.'
              : 'Approve sources first, then return here to run document extraction.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {displayedDocs.map(doc => (
            <div
              key={doc.id}
              data-testid="document-card"
              style={{
                background: '#1a1a2e',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #2a2a4a',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => handleToggleDoc(doc.id)}
                    disabled={doc.ingestionStatus === 'extracted'}
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e0e0ff' }}>{doc.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                      {doc.sourceName} • {doc.publishedDate}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: doc.sourceStatus === 'approved' ? '#2a4a2a' : '#4a2a2a',
                    color: doc.sourceStatus === 'approved' ? '#a0ffa0' : '#ffa0a0',
                  }}
                  data-testid="source-status-text"
                >
                  Source: {doc.sourceStatus}
                </span>
              </div>
              
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <FileText size={14} />
                  Stored excerpt
                  {excerptIsThin(doc) && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300 normal-case tracking-normal">
                      Needs fuller capture
                    </span>
                  )}
                </div>
                <p className="m-0 text-sm leading-6 text-gray-300">
                  {doc.content ? previewExcerpt(doc.content) : 'No excerpt stored for this document.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-700 pt-3 md:flex-row md:items-center md:justify-between">
                <span style={{ fontSize: '0.85rem', color: doc.ingestionStatus === 'extracted' ? '#a0ffa0' : '#888' }}>
                  Status: {doc.ingestionStatus}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocument(doc)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700"
                  >
                    <FileText size={16} />
                    Review Excerpt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700"
                    aria-label={`Download stored excerpt for ${doc.title}`}
                  >
                    <Download size={16} />
                    Download
                  </button>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700"
                    >
                      <ExternalLink size={16} />
                      Open Source
                    </a>
                  )}
                  {isManualDocument(doc) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-800/70 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-900/60"
                      aria-label={`Delete document ${doc.title}`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => handleExtract(doc)}
                    disabled={doc.ingestionStatus === 'extracted' || extractingIds.has(doc.id)}
                    aria-label={`Extract signals from ${doc.title}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: doc.ingestionStatus === 'extracted' ? '#2a2a4a' : extractingIds.has(doc.id) ? '#3a3a8a' : '#5a5aff',
                      color: doc.ingestionStatus === 'extracted' ? '#888' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: doc.ingestionStatus === 'extracted' || extractingIds.has(doc.id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {extractingIds.has(doc.id) && <RefreshCw size={14} className="animate-spin" />}
                    {doc.ingestionStatus === 'extracted' 
                      ? 'Extracted' 
                      : extractingIds.has(doc.id) 
                        ? 'Extracting...' 
                        : 'Extract Signals'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <MovableModal
          title={selectedDocument.title}
          subtitle={`${selectedDocument.sourceName} • ${selectedDocument.publishedDate}`}
          onClose={() => setSelectedDocument(null)}
          width="w-[768px]"
          height="max-h-[85vh]"
          testId="document-review-modal"
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 grid gap-2 text-sm text-gray-300">
                <div><span className="text-gray-500">Source status:</span> {selectedDocument.sourceStatus}</div>
                <div><span className="text-gray-500">Reference URL:</span> {selectedDocument.url || 'No URL stored'}</div>
                <div><span className="text-gray-500">Ingestion status:</span> {selectedDocument.ingestionStatus}</div>
              </div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">Stored excerpt / content</h4>
              {excerptIsThin(selectedDocument) && (
                <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-900/20 p-3 text-sm text-amber-100">
                  This document only has a thin stored excerpt. It is enough to preserve a reference, but not enough for strong evidence review.
                </div>
              )}
              <pre className="whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-950/70 p-4 text-sm leading-6 text-gray-200">
                {selectedDocument.content || 'No excerpt stored for this document.'}
              </pre>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-700 p-4 bg-gray-900/50">
              <button
                type="button"
                onClick={() => handleDownload(selectedDocument)}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              >
                <Download size={16} />
                Download Stored Excerpt
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};

export default DocumentIntake;
