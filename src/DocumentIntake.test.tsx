import { seedTestData } from "./testSeed";
// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DocumentIntake from './DocumentIntake';
import { getDocuments, resetMockData, saveDocuments, saveSources } from './mockRepository';
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
      { id: 'sig-1', title: 'Mock Signal' } as any
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

    fireEvent.click(await screen.findByRole('button', { name: /^add document$/i }));
    fireEvent.change(screen.getByPlaceholderText(/Article, report, or document title/i), {
      target: { value: 'Manual grocery insight' }
    });
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://example.com/manual-insight' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste the article excerpt/i), {
      target: {
        value: 'Manual evidence says online grocery shoppers are responding to personalised loyalty pricing, delivery convenience, and supermarket checkout experience changes.'
      }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /^add document$/i }).at(-1)!);

    expect(await screen.findByText('Manual grocery insight')).toBeInTheDocument();
    expect(screen.getByText(/Manual evidence says online grocery shoppers/i)).toBeInTheDocument();
  });

  it('uploads a document file from the UI', async () => {
    render(<DocumentIntake />);

    fireEvent.click(await screen.findByRole('button', { name: /^add document$/i }));
    const file = new File([
      'Uploaded file evidence says online grocery delivery, loyalty pricing, and supermarket checkout experience are changing.'
    ], 'uploaded-grocery-note.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload document file/i), {
      target: { files: [file] }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /^add document$/i }).at(-1)!);

    expect(await screen.findByText('uploaded-grocery-note')).toBeInTheDocument();
    expect(screen.getByText(/Uploaded file evidence says online grocery delivery/i)).toBeInTheDocument();
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
