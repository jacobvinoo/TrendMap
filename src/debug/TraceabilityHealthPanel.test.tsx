import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import TraceabilityHealthPanel from './TraceabilityHealthPanel';
import * as validationModule from '../traceabilityValidation';

// Mock the validation module
vi.mock('../traceabilityValidation', () => ({
  validateTraceability: vi.fn(),
}));

describe('TraceabilityHealthPanel', () => {
  it('renders correctly and initially shows no results', () => {
    render(<TraceabilityHealthPanel />);
    expect(screen.getByText('🔍 Traceability Health')).toBeInTheDocument();
    expect(screen.queryByTestId('traceability-result')).not.toBeInTheDocument();
  });

  it('displays success message when no issues are found', async () => {
    (validationModule.validateTraceability as any).mockResolvedValueOnce([]);
    
    render(<TraceabilityHealthPanel />);
    fireEvent.click(screen.getByTestId('run-traceability-check'));

    await waitFor(() => {
      expect(screen.getByTestId('traceability-result')).toBeInTheDocument();
      expect(screen.getByText(/All traceability chains are healthy/i)).toBeInTheDocument();
    });
  });

  it('displays issues grouped by type when issues are found', async () => {
    const mockIssues = [
      { type: 'trend', id: 't1', message: 'no evidence links for approved trend' },
      { type: 'signal', id: 's1', message: 'documentId doc1 not found' },
    ];
    (validationModule.validateTraceability as any).mockResolvedValueOnce(mockIssues);
    
    render(<TraceabilityHealthPanel />);
    fireEvent.click(screen.getByTestId('run-traceability-check'));

    await waitFor(() => {
      expect(screen.getByTestId('traceability-result')).toBeInTheDocument();
      expect(screen.getByText(/2 issues found:/i)).toBeInTheDocument();
      expect(screen.getByText(/trend issues \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/signal issues \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/t1/)).toBeInTheDocument();
      expect(screen.getByText(/no evidence links for approved trend/)).toBeInTheDocument();
      expect(screen.getByText(/s1/)).toBeInTheDocument();
      expect(screen.getByText(/documentId doc1 not found/)).toBeInTheDocument();
    });
  });
});
