import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import DocumentIntake from './DocumentIntake';
import { resetMockData, getSignals } from './mockRepository';

describe('DocumentIntake', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('renders default view showing only documents from approved sources', () => {
    render(<DocumentIntake />);
    // In our mock data, src-1 is approved and has two documents (doc-1 and doc-3)
    // src-2 is rejected and has doc-2
    expect(screen.getByText('AI‑assisted grocery search')).toBeInTheDocument();
    expect(screen.getByText('Already Extracted Doc')).toBeInTheDocument();
    expect(screen.queryByText('Retail media sponsored placements')).not.toBeInTheDocument();
  });

  it('shows all documents when toggle is checked', () => {
    render(<DocumentIntake />);
    const toggle = screen.getByLabelText('show-all-toggle');
    fireEvent.click(toggle);
    
    // Now doc-2 (from rejected source) should also be visible
    expect(screen.getByText('Retail media sponsored placements')).toBeInTheDocument();
  });

  it('extracts signals and updates button state', () => {
    render(<DocumentIntake />);
    
    // Before extraction, we should have no signals in the repository
    expect(getSignals().length).toBe(0);

    const extractBtn = screen.getByRole('button', { name: /Extract signals from AI‑assisted grocery search/i });
    expect(extractBtn).not.toBeDisabled();
    expect(extractBtn).toHaveTextContent('Extract Signals');

    fireEvent.click(extractBtn);

    // Button should now be disabled and say "Extracted"
    expect(extractBtn).toBeDisabled();
    expect(extractBtn).toHaveTextContent('Extracted');

    // Should have extracted signals
    const signals = getSignals();
    expect(signals.length).toBeGreaterThan(0);
  });

  it('disables button for already extracted documents', () => {
    render(<DocumentIntake />);
    const alreadyExtractedBtn = screen.getByRole('button', { name: /Extract signals from Already Extracted Doc/i });
    expect(alreadyExtractedBtn).toBeDisabled();
    expect(alreadyExtractedBtn).toHaveTextContent('Extracted');
  });
});
