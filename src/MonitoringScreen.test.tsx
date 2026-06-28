// @ts-nocheck

import { vi, describe, it, expect, beforeEach } from 'vitest'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import userEvent from '@testing-library/user-event';
import MonitoringScreen from './MonitoringScreen';
import { getSources, saveMonitoringRule, getMonitoringRules, getIndustryProfile } from './mockRepository'; 
import type { Source, MonitoringRule, IndustryProfile } from './types'; 

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let mockSources: Source[] = [];
  let mockRules: MonitoringRule[] = [];
  let mockProfile: IndustryProfile | null = { id: 'ind-1' } as any;

  return {
    ...actual,
    getSources: vi.fn(() => mockSources),
    setMockSources: (sources: Source[]) => { mockSources = sources; },
    getMonitoringRules: vi.fn(() => [...mockRules]),
    setMockRules: (rules: MonitoringRule[]) => { mockRules = [...rules]; },
    saveMonitoringRule: vi.fn((rule: MonitoringRule) => {
      const idx = mockRules.findIndex(r => r.sourceId === rule.sourceId);
      if (idx !== -1) mockRules[idx] = rule;
      else mockRules.push(rule);
    }),
    getIndustryProfile: vi.fn(() => mockProfile),
  };
});

// Utility to set mocks
const { setMockSources, setMockRules } = vi.mocked(await import('./mockRepository')) as any;

describe('MonitoringScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockSources([
      { id: 's-approved', name: 'Approved Source', status: 'approved' } as Source,
      { id: 's-rejected', name: 'Rejected Source', status: 'rejected' } as Source,
      { id: 's-suggested', name: 'Suggested Source', status: 'suggested' } as Source,
    ]);
    setMockRules([]);
  });

  it('shows approved sources as monitorable and excludes/disables rejected ones', () => {
    render(<MonitoringScreen />);
    
    // Approved source should be in the list
    expect(screen.getByText('Approved Source')).toBeInTheDocument();
    
    // Rejected source should not appear as a monitorable source
    expect(screen.queryByText('Rejected Source')).not.toBeInTheDocument();
    
    // Suggested source should not appear as a monitorable source
    expect(screen.queryByText('Suggested Source')).not.toBeInTheDocument();
  });

  it('allows enabling monitoring, changing frequency, and adding keywords', async () => {
    render(<MonitoringScreen />);
    
    // Click "Enable Monitoring" for the approved source
    const enableBtn = screen.getByRole('button', { name: /Enable Monitoring/i });
    fireEvent.click(enableBtn);
    
    expect(saveMonitoringRule).toHaveBeenCalled();
    const saveCall = vi.mocked(saveMonitoringRule).mock.calls[0][0];
    expect(saveCall.enabled).toBe(true);
    expect(saveCall.sourceId).toBe('s-approved');
    expect(saveCall.frequency).toBe('weekly'); // Default

    // Should now show controls
    const select = screen.getByRole('combobox', { name: /frequency/i });
    fireEvent.change(select, { target: { value: 'daily' } });
    
    expect(saveMonitoringRule).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveMonitoringRule).mock.calls[1][0].frequency).toBe('daily');

    // Add a keyword
    const keywordInput = screen.getByPlaceholderText(/add keyword/i);
    await userEvent.type(keywordInput, 'AI{enter}');
    
    expect(saveMonitoringRule).toHaveBeenCalledTimes(3);
    expect(vi.mocked(saveMonitoringRule).mock.calls[2][0].keywords).toContain('AI');
  });

  it('allows disabling an active rule', () => {
    setMockRules([
      {
        id: 'r1',
        sourceId: 's-approved',
        industryProfileId: 'ind-1',
        enabled: true,
        frequency: 'weekly',
        keywords: [],
        includePatterns: [],
        excludePatterns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    
    render(<MonitoringScreen />);
    
    const disableBtn = screen.getByRole('button', { name: /Disable Monitoring/i });
    fireEvent.click(disableBtn);
    
    expect(saveMonitoringRule).toHaveBeenCalled();
    expect(vi.mocked(saveMonitoringRule).mock.calls[0][0].enabled).toBe(false);
  });
});
