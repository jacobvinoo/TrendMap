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

interface AssessmentResult {
  title: string;
  wordCount: number;
  snippets: string[];
  signalCount: number;
  trendCount: number;
  reasons: string[];
}

interface SignalFeedback {
  id: string;
  title: string;
  summary?: string;
  signalType?: string;
  strengthScore?: number;
}

const DocumentIntake: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithSource | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssessingNow, setIsAssessingNow] = useState(false);
  const [toolbarNotice, setToolbarNotice] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [documentNotices, setDocumentNotices] = useState<Record<string, string>>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [signalsByDocument, setSignalsByDocument] = useState<Record<string, SignalFeedback[]>>({});
  const [recentSignalsByDocument, setRecentSignalsByDocument] = useState<Record<string, SignalFeedback[]>>({});
  const [pasteRecoveryDocId, setPasteRecoveryDocId] = useState<string | null>(null);
  const [pastedArticleText, setPastedArticleText] = useState('');
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
      const groupedSignals = signals.reduce((groups: Record<string, SignalFeedback[]>, signal: any) => {
        const documentId = signal.documentId || signal.document_id || signal.document;
        if (!documentId) return groups;
        groups[documentId] = groups[documentId] || [];
        groups[documentId].push({
          id: signal.id,
          title: signal.title || 'Untitled signal',
          summary: signal.summary || '',
          signalType: signal.signalType || signal.signal_type || '',
          strengthScore: signal.strengthScore ?? signal.strength_score,
        });
        return groups;
      }, {});
      setSignalsByDocument(groupedSignals);
      if (signals.length > 0) {
        const sorted = signals
          .filter(s => s.created_at)
          .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
        if (sorted.length > 0 && sorted[0].created_at) {
          setLastExtractedDate(new Date(sorted[0].created_at).toLocaleString());
        }
      }

      setSources(fetchedSources);
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
    setDocumentNotices((current) => ({ ...current, [doc.id]: '' }));
    setExtractingIds((prev) => new Set(prev).add(doc.id));
    try {
      const newSignals = await repository.extractSignalsFromDocument(doc.id);
      
      // Save extracted signal IDs back to the document to complete traceability
      const signalIds = newSignals.map((s: any) => s.id);
      await repository.updateDocumentExtractedSignals(doc.id, signalIds);
      
      await repository.updateDocumentIngestionStatus(doc.id, newSignals.length > 0 ? 'extracted' : 'processed');
      setRecentSignalsByDocument((current) => ({
        ...current,
        [doc.id]: newSignals.map((signal: any) => ({
          id: signal.id,
          title: signal.title || 'Untitled signal',
          summary: signal.summary || '',
          signalType: signal.signalType || signal.signal_type || '',
          strengthScore: signal.strengthScore ?? signal.strength_score,
        })),
      }));
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: newSignals.length > 0
          ? `Extracted ${newSignals.length} signal${newSignals.length === 1 ? '' : 's'} from this document. Review the generated signals and key takeaways below.`
          : 'Processed this document, but no strategic signals were extracted. The article may be too general, too thin, or not specific enough to the saved industry themes.',
      }));
      await loadData(); // Refresh UI
    } catch (err) {
      console.error(err);
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: friendlyEvidenceError(err, `Failed to extract signals for ${doc.title}. Ensure backend is running.`),
      }));
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
    const selectableDocs = displayedDocs.filter((doc) => documentNeedsExtraction(doc));
    if (selectedDocs.size === selectableDocs.length && selectableDocs.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(selectableDocs.map(d => d.id)));
    }
  };

  const handleExtractSelected = async () => {
    const docsToExtract = selectedDocs.size > 0 
      ? displayedDocs.filter(d => selectedDocs.has(d.id) && documentNeedsExtraction(d))
      : displayedDocs.filter(d => documentNeedsExtraction(d));
      
    if (docsToExtract.length === 0) {
      setToolbarNotice('No pending documents to extract signals from.');
      return;
    }
    
    // Extract sequentially to avoid overloading the LLM
    for (const doc of docsToExtract) {
      await handleExtract(doc);
    }
    setToolbarNotice(`Successfully processed ${docsToExtract.length} document(s).`);
    setSelectedDocs(new Set());
  };

  const handleRunDocumentExtraction = async () => {
    setIsRefreshing(true);
    setToolbarNotice('');
    setAssessmentResult(null);
    try {
      const latestSources = await repository.getSources();
      const approvedSources = latestSources.filter((source) => source.status === 'approved');
      if (approvedSources.length === 0) {
        setToolbarNotice('Approve at least one source before running document extraction.');
        return;
      }

      const result = await repository.extractDocumentsFromSources();
      const baseMessage = result.message || `Document extraction refreshed ${result.importedCount} document record${result.importedCount === 1 ? '' : 's'} from approved sources.`;
      const restartHint = baseMessage.includes('browser-only storage') ? ' Restart with npm run dev.' : '';
      const failureSummary = result.errors?.length
        ? ` ${result.errors.length} source${result.errors.length === 1 ? '' : 's'} could not be fetched or did not match the saved industry context. Open View Logs for details.`
        : '';
      setToolbarNotice(`${baseMessage}${restartHint}${failureSummary}`);
      await loadData();
    } catch (error) {
      console.error(error);
      setToolbarNotice('Document extraction failed. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const sourceNameFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  const sourceUrlFromReference = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return '';
    }
  };

  const sameSourceUrl = (left?: string, right?: string) => {
    if (!left || !right) return false;
    const normalize = (value: string) => value.replace(/\/$/, '').toLowerCase();
    return normalize(left) === normalize(right);
  };

  const apiErrorDetail = (error: unknown) => {
    if (!(error instanceof Error)) return '';
    const message = error.message || '';
    const jsonMatch = message.match(/API Error \d+:\s*(\{.*\})/);
    if (!jsonMatch) return message;
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.detail || message;
    } catch {
      return message;
    }
  };

  const friendlyEvidenceError = (error: unknown, fallback: string) => {
    const detail = apiErrorDetail(error) || fallback;
    const lower = detail.toLowerCase();
    if (lower.includes('403') || lower.includes('forbidden') || lower.includes('blocked automated capture')) {
      return 'This site blocked automated capture. Open the source, copy the article text, then use Paste Text on this document card. You can also upload a saved copy/PDF from Add / Assess Evidence.';
    }
    if (lower.includes('too thin') || lower.includes('not contain enough readable text')) {
      return 'TrendMap reached the link but could not capture enough article text. Paste the relevant article section or upload the document so it can be assessed.';
    }
    if (lower.includes('landing page') || lower.includes('site metadata') || lower.includes('low-value resource')) {
      return 'TrendMap reached the link, but the captured page looked like navigation, metadata, or a landing page rather than article evidence. Paste the article text or use a more direct article/PDF link.';
    }
    return detail;
  };

  const evidenceSentences = (text: string) => (text || '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 8);

  const keyEvidenceSnippets = (text: string) => {
    const priorityTerms = [
      'grocery', 'retail', 'consumer', 'customer', 'shopper', 'cpg', 'ai', 'artificial intelligence',
      'roi', 'revenue', 'margin', 'cost', 'personalization', 'personalisation', 'supply chain', 'pricing',
      'promotion', 'loyalty', 'commerce', 'digital'
    ];
    return evidenceSentences(text)
      .filter((sentence) => priorityTerms.some((term) => sentence.toLowerCase().includes(term)))
      .slice(0, 4);
  };

  const assessmentReasons = (document: Document, signalCount: number, trendCount: number) => {
    const content = document.content || '';
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const reasons: string[] = [];
    if (wordCount < 40) {
      reasons.push('The capture is still too thin for reliable extraction. Use Refresh Capture or paste the relevant article text.');
    }
    if (signalCount === 0 && wordCount >= 40) {
      reasons.push('No signal matched the current extraction rules strongly enough. Review the captured snippets and paste a more specific excerpt if the article is strategic.');
    }
    if (signalCount > 0 && trendCount === 0) {
      reasons.push('Signals were extracted, but candidate trend creation requires enough strategy-grade evidence and may need supporting evidence from another approved source.');
    }
    if (signalCount === 0 && trendCount === 0 && wordCount >= 40) {
      reasons.push('The article may discuss AI or retail broadly, but the extractor did not find enough grocery/customer/commerce context in the captured text.');
    }
    return reasons;
  };

  const ensureEvidenceSource = async () => {
    if (manualDocument.sourceId) {
      const existing = sources.find((source) => source.id === manualDocument.sourceId);
      if (existing) return existing;
    }

    const url = manualDocument.url.trim();
    const title = manualDocument.title.trim() || manualDocumentFile?.name || 'Manual evidence';
    const sourceName = sourceNameFromUrl(url) || `${title} source`;
    const sourceUrl = sourceUrlFromReference(url) || `manual-upload://${Date.now()}`;
    const existingByUrl = sources.find((source) => sameSourceUrl(source.url, sourceUrl));
    if (existingByUrl) {
      if (existingByUrl.status !== 'approved') {
        await repository.updateSourceStatus(existingByUrl.id, 'approved');
        return { ...existingByUrl, status: 'approved' as const };
      }
      return existingByUrl;
    }

    const created = await repository.createSource({
      name: sourceName,
      url: sourceUrl,
      sourceType: manualDocumentFile ? 'document' : 'news',
      status: 'approved',
      credibilityScore: 0.7,
      relevanceScore: 0.75,
      freshnessScore: 0.8,
      notes: 'Auto-created from immediate evidence intake.',
    });
    return created;
  };

  const createManualDocument = async (assessNow: boolean) => {
    setFormNotice('');
    const content = manualDocument.content.trim();
    const url = manualDocument.url.trim();
    if (!content && !url && !manualDocumentFile) {
      setFormNotice('Upload a file, paste document content, or enter a reference URL.');
      return;
    }
    const title = manualDocument.title.trim()
      || manualDocumentFile?.name.replace(/\.[^.]+$/, '')
      || sourceNameFromUrl(url)
      || `Pasted evidence ${new Date().toISOString().slice(0, 10)}`;

    try {
      if (assessNow) setIsAssessingNow(true);
      const source = await ensureEvidenceSource();
      const metadata = {
        sourceId: source.id,
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
            content,
          });

      if (assessNow) {
        const newSignals = await repository.extractSignalsFromDocument(created.id);
        const signalIds = newSignals.map((signal: any) => signal.id);
        await repository.updateDocumentExtractedSignals(created.id, signalIds);
        await repository.updateDocumentIngestionStatus(created.id, newSignals.length > 0 ? 'extracted' : 'processed');
        const trends = await repository.analyzeTrends();
        const wordCount = (created.content || '').trim().split(/\s+/).filter(Boolean).length;
        setToolbarNotice(
          newSignals.length || trends.length
            ? `Assessed "${created.title}" now. Added ${newSignals.length} signal${newSignals.length === 1 ? '' : 's'} and ${trends.length} candidate trend${trends.length === 1 ? '' : 's'}.`
            : `Assessed "${created.title}" now. Captured ${wordCount} words, but no signal or trend passed the extraction rules.`
        );
        setAssessmentResult({
          title: created.title,
          wordCount,
          snippets: keyEvidenceSnippets(created.content || ''),
          signalCount: newSignals.length,
          trendCount: trends.length,
          reasons: assessmentReasons(created, newSignals.length, trends.length),
        });
      } else {
        setToolbarNotice(`Added document "${created.title}". Review it, then extract signals when ready.`);
        setAssessmentResult(null);
      }

      setManualDocument({
        sourceId: '',
        title: '',
        url: '',
        publishedDate: new Date().toISOString().slice(0, 10),
        content: '',
      });
      setManualDocumentFile(null);
      setShowManualDocumentForm(false);
      await loadData();
    } catch (error) {
      const fallback = assessNow ? 'Failed to assess evidence.' : 'Failed to add document.';
      setFormNotice(friendlyEvidenceError(error, fallback));
    } finally {
      if (assessNow) setIsAssessingNow(false);
    }
  };

  const handleRefreshCapture = async (doc: DocumentWithSource) => {
    setDocumentNotices((current) => ({ ...current, [doc.id]: '' }));
    try {
      const refreshed = await repository.refreshDocumentContent(doc.id);
      const wordCount = (refreshed.content || '').trim().split(/\s+/).filter(Boolean).length;
      setPasteRecoveryDocId(null);
      setPastedArticleText('');
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: `Captured ${wordCount} words from the source URL. Review the excerpt, then extract signals again.`,
      }));
      await loadData();
    } catch (error) {
      setPasteRecoveryDocId(doc.id);
      setPastedArticleText('');
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: friendlyEvidenceError(error, `Could not refresh capture for "${doc.title}".`),
      }));
    }
  };

  const handleStartPasteRecovery = (doc: DocumentWithSource) => {
    setPasteRecoveryDocId(doc.id);
    setPastedArticleText('');
    setDocumentNotices((current) => ({
      ...current,
      [doc.id]: 'Paste the article text below. TrendMap will store it against this document and use it for extraction.',
    }));
  };

  const handleSavePastedContent = async (doc: DocumentWithSource, extractNow: boolean) => {
    const content = pastedArticleText.trim();
    if (content.split(/\s+/).filter(Boolean).length < 40) {
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: 'Paste at least a few paragraphs of article text, about 40 words or more, so TrendMap can extract reliable signals.',
      }));
      return;
    }

    try {
      const updated = await repository.updateDocumentContent(doc.id, content);
      setPasteRecoveryDocId(null);
      setPastedArticleText('');
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: extractNow
          ? 'Saved pasted article text. Extracting signals now...'
          : 'Saved pasted article text. Review the excerpt, then extract signals when ready.',
      }));
      await loadData();
      if (extractNow) {
        await handleExtract({
          ...doc,
          ...updated,
          sourceName: doc.sourceName,
          sourceStatus: doc.sourceStatus,
          ingestionStatus: 'raw',
          extractedSignalIds: [],
        });
      }
    } catch (error) {
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: friendlyEvidenceError(error, `Could not save pasted text for "${doc.title}".`),
      }));
    }
  };

  const handleCreateManualDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    await createManualDocument(false);
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
      setToolbarNotice(`Deleted document "${doc.title}".`);
      await loadData();
    } catch (error) {
      setDocumentNotices((current) => ({
        ...current,
        [doc.id]: error instanceof Error ? error.message : `Failed to delete document "${doc.title}".`,
      }));
    }
  };


  const excerptIsThin = (doc: DocumentWithSource) => (doc.content || '').trim().split(/\s+/).filter(Boolean).length < 40;
  const isManualDocument = (doc: DocumentWithSource) => !doc.extractionRunId;
  const extractedSignalCount = (doc: DocumentWithSource) => (
    doc.extractedSignalIds || doc.extracted_signal_ids || []
  ).length;
  const effectiveIngestionStatus = (doc: DocumentWithSource) => (
    doc.ingestionStatus === 'extracted' && extractedSignalCount(doc) === 0
      ? 'processed'
      : doc.ingestionStatus
  );
  const documentNeedsExtraction = (doc: DocumentWithSource) => effectiveIngestionStatus(doc) !== 'extracted';
  const documentSignals = (doc: DocumentWithSource) => {
    const recent = recentSignalsByDocument[doc.id] || [];
    const saved = signalsByDocument[doc.id] || [];
    const byId = new Map<string, SignalFeedback>();
    [...saved, ...recent].forEach((signal) => {
      if (signal.id) byId.set(signal.id, signal);
    });
    return Array.from(byId.values());
  };
  const signalTakeaway = (signal: SignalFeedback) => {
    const text = (signal.summary || '').trim();
    if (!text) return 'No summary was stored for this signal.';
    return text.length > 220 ? `${text.slice(0, 220).trim()}...` : text;
  };
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
            Add / Assess Evidence
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
            disabled={extractingIds.size > 0 || isRefreshing || (selectedDocs.size === 0 && displayedDocs.filter(d => documentNeedsExtraction(d)).length === 0)}
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
              checked={selectedDocs.size === displayedDocs.filter((doc) => documentNeedsExtraction(doc)).length && displayedDocs.filter((doc) => documentNeedsExtraction(doc)).length > 0}
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

      {toolbarNotice && (
        <div className="mb-6 rounded-xl border border-blue-700/60 bg-blue-900/20 px-4 py-3 text-sm text-blue-100">
          {toolbarNotice}
        </div>
      )}

      {assessmentResult && (
        <div className="mb-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Assessment Details</h3>
            <span className="text-xs text-gray-400">{assessmentResult.wordCount} captured words</span>
          </div>
          {assessmentResult.snippets.length > 0 ? (
            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Key captured parts</div>
              <ul className="space-y-2 text-sm leading-6 text-gray-300">
                {assessmentResult.snippets.map((snippet, index) => (
                  <li key={`${assessmentResult.title}-${index}`} className="rounded-lg border border-gray-700 bg-gray-900/60 p-3">
                    {snippet}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-900/20 p-3 text-sm text-amber-100">
              TrendMap did not find strong article snippets in the captured text.
            </div>
          )}
          {assessmentResult.reasons.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Why no stronger output was generated</div>
              <ul className="space-y-2 text-sm leading-6 text-gray-300">
                {assessmentResult.reasons.map((reason) => (
                  <li key={reason} className="rounded-lg border border-gray-700 bg-gray-900/60 p-3">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showLogs && <LogViewerModal onClose={() => setShowLogs(false)} />}

      {showManualDocumentForm && (
        <form onSubmit={handleCreateManualDocument} className="mb-6 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Add or Assess Evidence</h3>
          </div>
          <p className="mb-4 text-sm text-gray-400">
            Paste a news link and TrendMap will infer the source from the domain. You can also upload a document or paste an excerpt, then save it for review or assess it immediately.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Link to assess</span>
              <input
                value={manualDocument.url}
                onChange={(event) => setManualDocument({ ...manualDocument, url: event.target.value, sourceId: '' })}
                placeholder="https://news-site.com/article"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Source will be inferred as {sourceNameFromUrl(manualDocument.url) || 'the link domain'} and added automatically if needed.
              </p>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-300">Title</span>
              <input
                value={manualDocument.title}
                onChange={(event) => setManualDocument({ ...manualDocument, title: event.target.value })}
                placeholder="Optional. TrendMap can infer one from the link or file."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-300">Use existing source</span>
              <select
                value={manualDocument.sourceId}
                onChange={(event) => setManualDocument({ ...manualDocument, sourceId: event.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Infer from link or file</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.status})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Optional. Leave this blank for new sources.
              </p>
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
              disabled={isAssessingNow}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssessingNow}
              className="rounded-lg border border-blue-600/40 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-600/30 disabled:opacity-50"
            >
              Save for Review
            </button>
            <button
              type="button"
              disabled={isAssessingNow}
              onClick={() => createManualDocument(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {isAssessingNow ? 'Assessing...' : 'Assess Now'}
            </button>
          </div>
          {formNotice && (
            <div className="mt-3 rounded-lg border border-amber-700/60 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
              {formNotice}
            </div>
          )}
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
          {displayedDocs.map(doc => {
            const generatedSignals = documentSignals(doc);
            return (
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
                    disabled={!documentNeedsExtraction(doc)}
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
                      Capture incomplete
                    </span>
                  )}
                </div>
                <p className="m-0 text-sm leading-6 text-gray-300">
                  {doc.content ? previewExcerpt(doc.content) : 'No excerpt stored for this document.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-700 pt-3 md:flex-row md:items-center md:justify-between">
                <span style={{ fontSize: '0.85rem', color: effectiveIngestionStatus(doc) === 'extracted' ? '#a0ffa0' : '#888' }}>
                  Status: {effectiveIngestionStatus(doc)}
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
                  {excerptIsThin(doc) && doc.url && (
                    <button
                      type="button"
                      onClick={() => handleRefreshCapture(doc)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-700/70 bg-amber-950/40 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/60"
                      aria-label={`Refresh capture for ${doc.title}`}
                    >
                      <RefreshCw size={16} />
                      Refresh Capture
                    </button>
                  )}
                  {excerptIsThin(doc) && (
                    <button
                      type="button"
                      onClick={() => handleStartPasteRecovery(doc)}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-700/70 bg-blue-950/40 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-900/60"
                      aria-label={`Paste article text for ${doc.title}`}
                    >
                      <FileText size={16} />
                      Paste Text
                    </button>
                  )}
                  <button
                    onClick={() => handleExtract(doc)}
                    disabled={!documentNeedsExtraction(doc) || extractingIds.has(doc.id)}
                    aria-label={`Extract signals from ${doc.title}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: !documentNeedsExtraction(doc) ? '#2a2a4a' : extractingIds.has(doc.id) ? '#3a3a8a' : '#5a5aff',
                      color: !documentNeedsExtraction(doc) ? '#888' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: !documentNeedsExtraction(doc) || extractingIds.has(doc.id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {extractingIds.has(doc.id) && <RefreshCw size={14} className="animate-spin" />}
                    {!documentNeedsExtraction(doc) 
                      ? 'Extracted' 
                      : extractingIds.has(doc.id) 
                        ? 'Extracting...' 
                        : 'Extract Signals'}
                  </button>
                </div>
              </div>
              {documentNotices[doc.id] && (
                <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
                  {documentNotices[doc.id]}
                </div>
              )}
              {generatedSignals.length > 0 && (
                <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/20 p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
                      Generated Signals
                    </h4>
                    <span className="text-xs text-emerald-300">
                      {generatedSignals.length} signal{generatedSignals.length === 1 ? '' : 's'} found
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {generatedSignals.slice(0, 4).map((signal) => (
                      <div key={signal.id} className="rounded-lg border border-emerald-900/70 bg-gray-950/60 p-3">
                        <div className="mb-1 text-sm font-semibold text-white">{signal.title}</div>
                        <div className="text-sm leading-6 text-gray-300">{signalTakeaway(signal)}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-200/80">
                          {signal.signalType && <span>Type: {signal.signalType}</span>}
                          {typeof signal.strengthScore === 'number' && (
                            <span>Strength: {Math.round(signal.strengthScore * 100)}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {generatedSignals.length > 4 && (
                    <p className="mt-3 text-xs text-emerald-200/80">
                      Showing 4 of {generatedSignals.length}. Open the Signals screen to review the full set.
                    </p>
                  )}
                </div>
              )}
              {pasteRecoveryDocId === doc.id && (
                <div className="rounded-xl border border-blue-700/60 bg-blue-950/30 p-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-blue-100">Paste article text for this document</span>
                    <textarea
                      value={pastedArticleText}
                      onChange={(event) => setPastedArticleText(event.target.value)}
                      rows={8}
                      placeholder="Paste the article body, report excerpt, or saved PDF text here. TrendMap will replace the thin capture with this evidence."
                      className="w-full rounded-lg border border-blue-800 bg-gray-950 px-3 py-2 text-sm leading-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasteRecoveryDocId(null);
                        setPastedArticleText('');
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePastedContent(doc, false)}
                      className="rounded-lg border border-blue-600/40 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-600/30"
                    >
                      Save Text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePastedContent(doc, true)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      Save & Extract Signals
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
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
