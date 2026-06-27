import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const approveBtn = screen.getAllByRole('button', { name: /approve/i })[0];
    fireEvent.click(approveBtn);
    // After approval, status text in the first card changes to 'approved'
    const cards = screen.getAllByTestId('source-card');
    expect(cards[0]).toHaveTextContent('approved');
  });

  it('rejects a source and changes status', () => {
    render(<SourceLibrary />);
    const rejectBtn = screen.getAllByRole('button', { name: /reject/i })[0];
    fireEvent.click(rejectBtn);
    // After rejection, status text in the first card changes to 'rejected'
    const cards = screen.getAllByTestId('source-card');
    expect(cards[0]).toHaveTextContent('rejected');
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
    const noteInput = screen.getAllByPlaceholderText('Add note')[0];
    const addBtn = screen.getAllByRole('button', { name: /add note/i })[0];
    fireEvent.change(noteInput, { target: { value: 'Important source' } });
    fireEvent.click(addBtn);
    expect(screen.getByTestId(`note-text-${source.id}`)).toHaveTextContent('Important source');
  });

  it('visually distinguishes rejected sources', () => {
    render(<SourceLibrary />);
    const rejectBtn = screen.getAllByRole('button', { name: /reject/i })[0];
    fireEvent.click(rejectBtn);
    const rejectedCard = screen.getAllByTestId('source-card')[0];
    // assuming rejected cards have class 'rejected'
    expect(rejectedCard).toHaveClass('rejected');
  });
});
