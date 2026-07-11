import { seedTestData } from "./testSeed";
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import SourceLibrary from './SourceLibrary';
import { resetMockData, getSources } from './mockRepository';

describe('SourceLibrary component', () => {
  beforeEach(() => {
    resetMockData();
    seedTestData();
  });

  it('renders all mock sources', async () => {
    render(<SourceLibrary />);
    const sources = getSources();
    for (const src of sources) {
      expect(await screen.findByText(src.name)).toBeInTheDocument();
    }
  });

  it('approves a source and changes status', async () => {
    render(<SourceLibrary />);
    const source = getSources().find(s => s.status === 'suggested')!;
    const sourceNameEl = await screen.findByText(source.name);
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    const approveBtn = within(sourceCard).getByRole('button', { name: /approve/i });
    
    fireEvent.click(approveBtn);
    
    await waitFor(() => {
      const updatedNameEl = screen.getByText(source.name);
      const updatedCard = updatedNameEl.closest('[data-testid="source-card"]') as HTMLElement;
      expect(updatedCard).toHaveTextContent(/approved/i);
    });
  });

  it('rejects a source and changes status', async () => {
    render(<SourceLibrary />);
    const source = getSources().find(s => s.status === 'suggested')!;
    const sourceNameEl = await screen.findByText(source.name);
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    const rejectBtn = within(sourceCard).getByRole('button', { name: /reject/i });
    
    fireEvent.click(rejectBtn);
    
    await waitFor(() => {
      const updatedNameEl = screen.getByText(source.name);
      const updatedCard = updatedNameEl.closest('[data-testid="source-card"]') as HTMLElement;
      expect(updatedCard).toHaveTextContent(/rejected/i);
    });
  });

  it('displays scores as percentages', async () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const credibilityEl = await screen.findByTestId(`credibility-${source.id}`);
    expect(credibilityEl).toHaveTextContent(`${Math.round(source.credibilityScore * 100)}%`);
    expect(screen.getByTestId(`relevance-${source.id}`)).toHaveTextContent(`${Math.round(source.relevanceScore * 100)}%`);
    expect(screen.getByTestId(`freshness-${source.id}`)).toHaveTextContent(`${Math.round(source.freshnessScore * 100)}%`);
  });

  it('shows the retrieved date for each source', async () => {
    render(<SourceLibrary />);
    const sourceNameEl = await screen.findByText('Test Source');
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    expect(sourceCard).toHaveTextContent('Retrieved 2026-01-06');
  });

  it('allows adding a note to a source', async () => {
    render(<SourceLibrary />);
    const source = getSources().find(s => s.status === 'suggested')!;
    const sourceNameEl = await screen.findByText(source.name);
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    
    const noteInput = within(sourceCard).getByPlaceholderText('Add review note...');
    const addBtn = within(sourceCard).getByRole('button', { name: /add note/i });
    
    fireEvent.change(noteInput, { target: { value: 'Important source' } });
    fireEvent.click(addBtn);
    
    expect(await screen.findByTestId(`note-text-${source.id}`)).toHaveTextContent('Important source');
  });

  it('adds a manual source from the UI', async () => {
    render(<SourceLibrary />);

    fireEvent.click(await screen.findByRole('button', { name: /^add source$/i }));
    fireEvent.change(screen.getByPlaceholderText(/Example: Grocery industry report/i), {
      target: { value: 'Manual Grocery Source' }
    });
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://example.com/manual-grocery' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /^add source$/i }).at(-1)!);

    expect(await screen.findByText('Manual Grocery Source')).toBeInTheDocument();
    expect(getSources().some((source) => source.name === 'Manual Grocery Source')).toBe(true);
  });

  it('visually distinguishes rejected sources', async () => {
    render(<SourceLibrary />);
    const source = getSources().find(s => s.status === 'suggested')!;
    const sourceNameEl = await screen.findByText(source.name);
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    const rejectBtn = within(sourceCard).getByRole('button', { name: /reject/i });
    
    fireEvent.click(rejectBtn);
    
    await waitFor(() => {
      const updatedNameEl = screen.getByText(source.name);
      const updatedCard = updatedNameEl.closest('[data-testid="source-card"]') as HTMLElement;
      expect(updatedCard.className).toContain('border-red-900');
    });
  });

  it('deletes a source from the UI', async () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const sourceNameEl = await screen.findByText(source.name);
    const sourceCard = sourceNameEl.closest('[data-testid="source-card"]') as HTMLElement;
    const deleteBtn = within(sourceCard).getByRole('button', { name: /delete source/i });
    
    fireEvent.click(deleteBtn);
    
    // Wait for the confirmation modal and click the confirm button
    const confirmBtn = await screen.findByRole('button', { name: /delete forever/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(screen.queryByText(source.name)).not.toBeInTheDocument();
    });
  });
});
