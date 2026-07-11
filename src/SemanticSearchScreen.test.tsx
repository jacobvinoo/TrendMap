import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SemanticSearchScreen from './SemanticSearchScreen';
import { repository } from './repository';

vi.mock('./repository', () => ({
  repository: {
    searchSemantic: vi.fn(),
  },
}));

describe('SemanticSearchScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly initially', () => {
    render(<SemanticSearchScreen />);
    expect(screen.getByRole('heading', { name: 'Semantic Search' })).toBeInTheDocument();
  });

  it('handles search input and button click', async () => {
    // @ts-ignore
    repository.searchSemantic.mockResolvedValue([
      { id: '1', entityType: 'trend', entityId: 't1', relevanceScore: 0.9, evidenceSnippet: 'Test trend snippet', metadata: { title: 'Test Title' } }
    ]);

    render(<SemanticSearchScreen />);

    const input = screen.getByPlaceholderText('Search for signals about AI grocery discovery');
    const btn = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'AI test' } });
    
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(repository.searchSemantic).toHaveBeenCalledWith('AI test', undefined, undefined, 12);
    expect(screen.getByText('Test trend snippet')).toBeInTheDocument();
    expect(screen.getByText('trend')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('does not search if query is empty', async () => {
    render(<SemanticSearchScreen />);

    const btn = screen.getByRole('button', { name: /Search/i });
    
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(repository.searchSemantic).not.toHaveBeenCalled();
  });
});
