import { seedTestData } from "./testSeed";
// @ts-nocheck
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DocumentIntake from './DocumentIntake';
import { getDocuments, getSources, resetMockData, saveDocuments, saveSources } from './mockRepository';
import { repository } from './repository';

describe('DocumentIntake', () => {
  beforeEach(() => {
    resetMockData();
    saveSources([{
      id: 'src-1',
      name: 'Approved Test Source',
      url: 'https://example.com',
      sourceType: 'report',
      credibilityScore: 0.9,
      relevanceScore: 0.9,
      freshnessScore: 0.9,
      status: 'approved',
      notes: ''
    }]);
  });

  async function runExtraction() {
    render(<DocumentIntake />);
    fireEvent.click(await screen.findByRole('button', { name: /run document extraction/i }));
    return screen.findByText(/Document extraction did not run because this session is using browser-only storage/i);
  }

  it('starts empty and prompts the user to run document extraction', async () => {
    render(<DocumentIntake />);
    expect(await screen.findByText(/No extracted documents yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run document extraction/i })).toBeInTheDocument();
  });

  it('does not fabricate documents in browser-only mode', async () => {
    await runExtraction();

    expect(screen.getByText(/npm run dev/i)).toBeInTheDocument();
    expect(screen.getByText(/Open View Logs for details/i)).toBeInTheDocument();
    expect(screen.getByText(/No extracted documents yet/i)).toBeInTheDocument();
  });

  it('extracts signals and updates button state', async () => {
    saveDocuments([{
      id: 'actual-doc-1',
      sourceId: 'src-1',
      title: 'Fetched source article',
      publishedDate: '2026-06-30',
      content: 'A fetched article says an AI assistant helps grocery shoppers with conversational search and product discovery.',
      url: 'https://example.com/fetched-article',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);

    const extractSpy = vi.spyOn(repository, 'extractSignalsFromDocument').mockResolvedValue([
      {
        id: 'sig-1',
        title: 'AI-assisted grocery discovery',
        summary: 'AI search and recommendation workflows are changing how shoppers discover grocery products and build baskets.',
        signalType: 'digital_discovery',
        strengthScore: 0.78,
      } as any
    ]);

    render(<DocumentIntake />);
    await screen.findByText('Fetched source article');
    const extractBtn = screen.getByRole('button', { name: /Extract signals from Fetched source article/i });
    expect(extractBtn).not.toBeDisabled();
    expect(extractBtn).toHaveTextContent('Extract Signals');

    fireEvent.click(extractBtn);

    // Button should now be disabled and say "Extracted"
    await waitFor(() => {
      expect(extractBtn).toBeDisabled();
      expect(extractBtn).toHaveTextContent('Extracted');
    });

    // Verify repository method was called correctly
    expect(extractSpy).toHaveBeenCalledWith('actual-doc-1');
    expect(await screen.findByRole('heading', { name: /Generated Signals/i })).toBeInTheDocument();
    expect(screen.getByText('AI-assisted grocery discovery')).toBeInTheDocument();
    expect(screen.getByText(/changing how shoppers discover grocery products/i)).toBeInTheDocument();
    expect(screen.getByText(/Strength: 78%/i)).toBeInTheDocument();
    extractSpy.mockRestore();
  });

  it('explains when processing finds no strategic signals', async () => {
    saveDocuments([{
      id: 'no-signal-doc',
      sourceId: 'src-1',
      title: 'Generic market article',
      publishedDate: '2026-07-13',
      content: 'This generic market article has enough words to be processed, but the mocked extractor will return no strategic signals for this scenario.',
      url: 'https://example.com/generic',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);
    const extractSpy = vi.spyOn(repository, 'extractSignalsFromDocument').mockResolvedValue([]);

    render(<DocumentIntake />);
    await screen.findByText('Generic market article');
    fireEvent.click(screen.getByRole('button', { name: /extract signals from generic market article/i }));

    expect(await screen.findByText(/Processed this document, but no strategic signals were extracted/i)).toBeInTheDocument();
    expect(screen.getByText('Status: processed')).toBeInTheDocument();
    expect(screen.queryByText(/Generated Signals/i)).not.toBeInTheDocument();

    extractSpy.mockRestore();
  });

  it('opens a review panel with the stored excerpt and source reference', async () => {
    saveDocuments([{
      id: 'actual-doc-1',
      sourceId: 'src-1',
      title: 'Fetched source article',
      publishedDate: '2026-06-30',
      content: 'Fetched source content from the approved URL. It contains enough words to review and enough context for signal extraction from actual stored content.',
      url: 'https://example.com/fetched-article',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);
    render(<DocumentIntake />);
    await screen.findByText('Fetched source article');
    fireEvent.click(screen.getAllByRole('button', { name: /review excerpt/i })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Stored excerpt \/ content/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fetched source content from the approved URL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/https:\/\/example.com\/fetched-article/i)).toBeInTheDocument();
  });

  it('adds a manual document or link from the UI', async () => {
    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /add \/ assess evidence/i }));
    fireEvent.change(screen.getByPlaceholderText(/Optional\. TrendMap can infer/i), {
      target: { value: 'Manual grocery insight' }
    });
    fireEvent.change(screen.getByPlaceholderText('https://news-site.com/article'), {
      target: { value: 'https://example.com/manual-insight' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste the article excerpt/i), {
      target: {
        value: 'Manual evidence says online grocery shoppers are responding to personalised loyalty pricing, delivery convenience, and supermarket checkout experience changes.'
      }
    });
    fireEvent.click(screen.getByRole('button', { name: /save for review/i }));

    expect(await screen.findByText('Manual grocery insight')).toBeInTheDocument();
    expect(screen.getByText(/Manual evidence says online grocery shoppers/i)).toBeInTheDocument();
  });

  it('shows add and assess validation errors inside the form near the clicked buttons', async () => {
    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /add \/ assess evidence/i }));
    const form = screen.getByRole('heading', { name: /add or assess evidence/i }).closest('form')!;
    fireEvent.click(within(form).getByRole('button', { name: /assess now/i }));

    expect(within(form).getByText(/Upload a file, paste document content, or enter a reference URL/i)).toBeInTheDocument();
  });

  it('uploads a document file from the UI', async () => {
    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /add \/ assess evidence/i }));
    const file = new File([
      'Uploaded file evidence says online grocery delivery, loyalty pricing, and supermarket checkout experience are changing.'
    ], 'uploaded-grocery-note.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload document file/i), {
      target: { files: [file] }
    });
    fireEvent.click(screen.getByRole('button', { name: /save for review/i }));

    expect(await screen.findByText('uploaded-grocery-note')).toBeInTheDocument();
    expect(screen.getByText(/Uploaded file evidence says online grocery delivery/i)).toBeInTheDocument();
  });

  it('assesses a pasted link immediately and creates traceable source and trend records', async () => {
    saveSources([]);
    const extractSpy = vi.spyOn(repository, 'extractSignalsFromDocument').mockResolvedValue([
      {
        id: 'sig-assess-now',
        title: 'Immediate grocery signal',
        documentId: 'doc-assess',
        sourceId: 'src-assess',
      } as any,
    ]);
    const analyzeSpy = vi.spyOn(repository, 'analyzeTrends').mockResolvedValue([
      {
        id: 'trend-assess-now',
        name: 'Immediate grocery trend',
        status: 'candidate',
      } as any,
    ]);

    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /add \/ assess evidence/i }));
    fireEvent.change(screen.getByPlaceholderText(/Optional\. TrendMap can infer/i), {
      target: { value: 'Fresh grocery market article' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://news-site.com/article'), {
      target: { value: 'https://grocery.example/news/fresh-market' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste the article excerpt/i), {
      target: {
        value: 'A fresh article says online grocery shoppers are changing basket building, delivery expectations, and value-seeking behaviour.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /assess now/i }));

    expect(await screen.findByText(/Assessed "Fresh grocery market article" now/i)).toBeInTheDocument();
    expect(screen.getByText(/Added 1 signal and 1 candidate trend/i)).toBeInTheDocument();
    expect(extractSpy).toHaveBeenCalled();
    expect(analyzeSpy).toHaveBeenCalled();
    expect(getSources().some((source) => source.name === 'grocery.example' && source.status === 'approved')).toBe(true);
    expect(getDocuments().some((document) => document.title === 'Fresh grocery market article')).toBe(true);

    extractSpy.mockRestore();
    analyzeSpy.mockRestore();
  });

  it('assesses a new link without requiring title or existing approved source', async () => {
    saveSources([]);
    const extractSpy = vi.spyOn(repository, 'extractSignalsFromDocument').mockResolvedValue([
      { id: 'sig-link-only', title: 'Link-only signal' } as any,
    ]);
    const analyzeSpy = vi.spyOn(repository, 'analyzeTrends').mockResolvedValue([]);

    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /add \/ assess evidence/i }));
    expect(screen.getByLabelText(/Use existing source/i)).toHaveValue('');
    fireEvent.change(screen.getByPlaceholderText('https://news-site.com/article'), {
      target: { value: 'https://newsource.example/retail/grocery-shift' },
    });
    fireEvent.click(screen.getByRole('button', { name: /assess now/i }));

    expect(await screen.findByText(/Assessed "newsource.example" now/i)).toBeInTheDocument();
    expect(getSources().some((source) =>
      source.name === 'newsource.example'
      && source.url === 'https://newsource.example'
      && source.status === 'approved'
    )).toBe(true);
    expect(getDocuments().some((document) =>
      document.title === 'newsource.example'
      && document.url === 'https://newsource.example/retail/grocery-shift'
    )).toBe(true);
    expect(getDocuments().find((document) => document.title === 'newsource.example')?.content).not.toContain('Manual reference URL added for review');
    expect(extractSpy).toHaveBeenCalled();
    expect(analyzeSpy).toHaveBeenCalled();

    extractSpy.mockRestore();
    analyzeSpy.mockRestore();
  });

  it('offers refresh capture for a thin URL-only document and shows the capture result near the card', async () => {
    saveDocuments([{
      id: 'thin-doc',
      sourceId: 'src-1',
      title: 'bcg.com',
      publishedDate: '2026-07-13',
      content: 'Manual reference URL added for review: https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      url: 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      ingestionStatus: 'processed',
      extractedSignalIds: [],
    }]);
    const refreshSpy = vi.spyOn(repository, 'refreshDocumentContent').mockResolvedValue({
      id: 'thin-doc',
      sourceId: 'src-1',
      title: 'How CPG retail leaders maximize AI ROI',
      publishedDate: '2026-07-13',
      content: 'CPG and retail leaders are using artificial intelligence to improve ROI, pricing, merchandising, promotions, consumer engagement, and digital commerce. The strongest retail use cases connect AI investments to measurable margin and revenue gains.',
      url: 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    });

    render(<DocumentIntake />);

    await screen.findByText('bcg.com');
    fireEvent.click(screen.getByRole('button', { name: /refresh capture for bcg\.com/i }));

    expect(await screen.findByText(/Captured \d+ words from the source URL/i)).toBeInTheDocument();
    expect(refreshSpy).toHaveBeenCalledWith('thin-doc');

    refreshSpy.mockRestore();
  });

  it('shows a useful blocked-capture message instead of raw API JSON', async () => {
    saveDocuments([{
      id: 'blocked-doc',
      sourceId: 'src-1',
      title: 'bcg.com',
      publishedDate: '2026-07-13',
      content: 'Manual reference URL added for review: https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      url: 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      ingestionStatus: 'processed',
      extractedSignalIds: [],
    }]);
    const refreshSpy = vi.spyOn(repository, 'refreshDocumentContent').mockRejectedValue(
      new Error('API Error 400: {"detail":"Could not extract readable content from the reference URL: HTTP Error 403: Forbidden"}')
    );

    render(<DocumentIntake />);

    await screen.findByText('bcg.com');
    fireEvent.click(screen.getByRole('button', { name: /refresh capture for bcg\.com/i }));

    expect(await screen.findByText(/This site blocked automated capture/i)).toBeInTheDocument();
    expect(screen.getByText(/use Paste Text on this document card/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Paste article text for this document/i)).toBeInTheDocument();
    expect(screen.queryByText(/API Error 400/i)).not.toBeInTheDocument();

    refreshSpy.mockRestore();
  });

  it('lets the user paste replacement article text on a blocked document card and save it for extraction', async () => {
    saveDocuments([{
      id: 'paste-recovery-doc',
      sourceId: 'src-1',
      title: 'Blocked BCG article',
      publishedDate: '2026-07-13',
      content: 'Capture incomplete',
      url: 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
      ingestionStatus: 'processed',
      extractedSignalIds: [],
    }]);
    const updateSpy = vi.spyOn(repository, 'updateDocumentContent');
    const pastedText = [
      'CPG and retail leaders are using artificial intelligence to improve ROI across pricing, merchandising, promotions, consumer engagement, category management, and digital commerce.',
      'The strongest grocery and supermarket use cases connect AI investment to measurable margin improvement, revenue growth, shopper experience, loyalty, and operating model productivity.',
      'Executives are prioritising initiatives where teams can track conversion, recommendation-attributed sales, waste reduction, fulfilment efficiency, and customer trust over time.'
    ].join(' ');

    render(<DocumentIntake />);

    await screen.findByText('Blocked BCG article');
    fireEvent.click(screen.getByRole('button', { name: /paste article text for blocked bcg article/i }));
    fireEvent.change(screen.getByLabelText(/Paste article text for this document/i), {
      target: { value: pastedText },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save text$/i }));

    expect(await screen.findByText(/Saved pasted article text/i)).toBeInTheDocument();
    expect(updateSpy).toHaveBeenCalledWith('paste-recovery-doc', pastedText);
    expect(getDocuments().find((document) => document.id === 'paste-recovery-doc')?.content).toBe(pastedText);
    expect(getDocuments().find((document) => document.id === 'paste-recovery-doc')?.ingestionStatus).toBe('raw');

    updateSpy.mockRestore();
  });

  it('keeps legacy extracted documents actionable when they have no extracted signals', async () => {
    saveDocuments([{
      id: 'legacy-empty-extracted-doc',
      sourceId: 'src-1',
      title: 'Legacy empty extracted document',
      publishedDate: '2026-07-13',
      content: 'This stored evidence discusses online grocery, supermarket shopping, customer behaviour, delivery convenience, retail AI, pricing, personalization, margin pressure, and digital commerce changes.',
      url: 'https://example.com/legacy-empty',
      ingestionStatus: 'extracted',
      extractedSignalIds: [],
    }]);

    render(<DocumentIntake />);

    await screen.findByText('Legacy empty extracted document');
    expect(screen.getByText('Status: processed')).toBeInTheDocument();
    const extractButton = screen.getByRole('button', { name: /extract signals from legacy empty extracted document/i });
    expect(extractButton).not.toBeDisabled();
    expect(extractButton).toHaveTextContent('Extract Signals');
  });

  it('deletes a manually added document after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    saveDocuments([{
      id: 'manual-doc-delete',
      sourceId: 'src-1',
      title: 'Manual document to delete',
      publishedDate: '2026-06-30',
      content: 'Manual evidence that should be removable from the document intake queue.',
      url: 'https://example.com/delete-me',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);

    render(<DocumentIntake />);
    await screen.findByText('Manual document to delete');
    fireEvent.click(screen.getByRole('button', { name: /delete document manual document to delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('Manual document to delete')).not.toBeInTheDocument();
    });
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Manual document to delete'));
    expect(getDocuments().some((document) => document.id === 'manual-doc-delete')).toBe(false);

    confirmSpy.mockRestore();
  });

  it('does not delete a document when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    saveDocuments([{
      id: 'manual-doc-keep',
      sourceId: 'src-1',
      title: 'Manual document to keep',
      publishedDate: '2026-06-30',
      content: 'Manual evidence that should remain when deletion is cancelled.',
      url: 'https://example.com/keep-me',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);

    render(<DocumentIntake />);
    await screen.findByText('Manual document to keep');
    fireEvent.click(screen.getByRole('button', { name: /delete document manual document to keep/i }));

    expect(screen.getByText('Manual document to keep')).toBeInTheDocument();
    expect(getDocuments().some((document) => document.id === 'manual-doc-keep')).toBe(true);

    confirmSpy.mockRestore();
  });

  it('does not show delete action for documents imported by an extraction run', async () => {
    saveDocuments([{
      id: 'agent-doc',
      sourceId: 'src-1',
      extractionRunId: 'run-1',
      title: 'Agent extracted document',
      publishedDate: '2026-06-30',
      content: 'Extracted evidence from an approved source should remain managed by the extraction workflow.',
      url: 'https://example.com/agent-doc',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);

    render(<DocumentIntake />);
    await screen.findByText('Agent extracted document');

    expect(screen.queryByRole('button', { name: /delete document agent extracted document/i })).not.toBeInTheDocument();
  });

  it('downloads the stored excerpt as a text artifact', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:document-review');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    saveDocuments([{
      id: 'actual-doc-1',
      sourceId: 'src-1',
      title: 'Fetched source article',
      publishedDate: '2026-06-30',
      content: 'Fetched source content from the approved URL.',
      url: 'https://example.com/fetched-article',
      ingestionStatus: 'raw',
      extractedSignalIds: [],
    }]);
    render(<DocumentIntake />);
    await screen.findByText('Fetched source article');
    const click = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = click;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    fireEvent.click(screen.getByRole('button', { name: /download stored excerpt for fetched source article/i }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(createElement).toHaveBeenCalledWith('a');
    expect(click).toHaveBeenCalled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElement.mockRestore();
  });
});
