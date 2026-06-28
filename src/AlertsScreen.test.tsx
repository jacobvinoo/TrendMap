// @ts-nocheck

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsScreen from './AlertsScreen';
 
import type { Alert } from './types'; 

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let mockAlerts: Alert[] = [];
  return {
    ...actual,
    getAlerts: vi.fn(() => [...mockAlerts]),
    acknowledgeAlert: vi.fn((id: string) => {
      const idx = mockAlerts.findIndex(a => a.id === id);
      if (idx >= 0) {
        mockAlerts[idx] = { ...mockAlerts[idx], acknowledged: true };
      }
    }),
    setMockAlerts: (alerts: Alert[]) => { mockAlerts = alerts; },
  };
});

const { setMockAlerts, acknowledgeAlert: mockAcknowledgeAlert } = vi.mocked(await import('./mockRepository')) as any;

describe('Alerts Screen UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockAlerts([]);
  });

  it('renders empty state', () => {
    render(<AlertsScreen />);
    expect(screen.getByText(/No alerts generated/i)).toBeInTheDocument();
  });

  it('renders alerts and allows acknowledging them', () => {
    const alert: Alert = {
      id: 'a1', trendId: 't1', alertType: 'score_threshold_crossed', severity: 'critical',
      message: 'Critical impact threshold', createdAt: '2026-01-01', acknowledged: false
    } as any;
    setMockAlerts([alert]);

    render(<AlertsScreen />);
    expect(screen.getByText(/Critical impact threshold/i)).toBeInTheDocument();

    const ackBtn = screen.getByRole('button', { name: /Acknowledge/i });
    fireEvent.click(ackBtn);

    expect(mockAcknowledgeAlert).toHaveBeenCalledWith(alert.id);
  });

  it('allows filtering by severity', () => {
    setMockAlerts([
      { id: 'a1', trendId: 't1', alertType: 'score_threshold_crossed', severity: 'critical', message: 'Critical alert', createdAt: '2026-01-01', acknowledged: false },
      { id: 'a2', trendId: 't2', alertType: 'new_candidate', severity: 'info', message: 'Info alert', createdAt: '2026-01-01', acknowledged: false }
    ]);

    render(<AlertsScreen />);
    
    expect(screen.getByText('Critical alert')).toBeInTheDocument();
    expect(screen.getByText('Info alert')).toBeInTheDocument();

    // Select critical filter
    const select = screen.getByRole('combobox', { name: /Filter by Severity/i });
    fireEvent.change(select, { target: { value: 'critical' } });

    expect(screen.getByText('Critical alert')).toBeInTheDocument();
    expect(screen.queryByText('Info alert')).not.toBeInTheDocument();
  });
});
