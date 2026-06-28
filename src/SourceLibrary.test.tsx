import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SourceLibrary from './SourceLibrary';
import { resetMockData, getSources } from './mockRepository';

describe('SourceLibrary component', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('renders all mock sources', () => {
    render(<SourceLibrary />);
    const sources = getSources();
    sources.forEach((src) => {
      expect(screen.getByText(src.name)).toBeInTheDocument();
    });
  });

  it('approves a source and changes status', () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const sourceCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    const approveBtn = within(sourceCard).getByRole('button', { name: /approve/i });
    
    fireEvent.click(approveBtn);
    
    // Find the card again as it might have moved to the "Reviewed" section
    const updatedCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    expect(updatedCard).toHaveTextContent(/approved/i);
  });

  it('rejects a source and changes status', () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const sourceCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    const rejectBtn = within(sourceCard).getByRole('button', { name: /reject/i });
    
    fireEvent.click(rejectBtn);
    
    const updatedCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    expect(updatedCard).toHaveTextContent(/rejected/i);
  });

  it('displays scores as percentages', () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    expect(screen.getByTestId(`credibility-${source.id}`)).toHaveTextContent(`${Math.round(source.credibilityScore * 100)}%`);
    expect(screen.getByTestId(`relevance-${source.id}`)).toHaveTextContent(`${Math.round(source.relevanceScore * 100)}%`);
    expect(screen.getByTestId(`freshness-${source.id}`)).toHaveTextContent(`${Math.round(source.freshnessScore * 100)}%`);
  });

  it('allows adding a note to a source', () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const sourceCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    
    const noteInput = within(sourceCard).getByPlaceholderText('Add review note...');
    const addBtn = within(sourceCard).getByRole('button', { name: /add note/i });
    
    fireEvent.change(noteInput, { target: { value: 'Important source' } });
    fireEvent.click(addBtn);
    
    expect(screen.getByTestId(`note-text-${source.id}`)).toHaveTextContent('Important source');
  });

  it('visually distinguishes rejected sources', () => {
    render(<SourceLibrary />);
    const source = getSources()[0];
    const sourceCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    const rejectBtn = within(sourceCard).getByRole('button', { name: /reject/i });
    
    fireEvent.click(rejectBtn);
    
    const updatedCard = screen.getByText(source.name).closest('[data-testid="source-card"]') as HTMLElement;
    expect(updatedCard.className).toContain('border-red-900');
  });
});
