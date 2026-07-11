// @ts-nocheck

import { vi, describe, it, expect, beforeEach } from 'vitest'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import userEvent from '@testing-library/user-event';
import MonitoringScreen from './MonitoringScreen';
import { repository } from './repository';
import type { Source, MonitoringRule, IndustryProfile } from './types';

vi.mock('./repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repository')>();
  let mockSources: Source[] = [];
  let mockRules: MonitoringRule[] = [];
  let mockProfile: IndustryProfile | null = { id: 'ind-1' } as any;

  return {
    ...actual,
    repository: {
      getSources: vi.fn(() => mockSources),
      getMonitoringRules: vi.fn(() => [...mockRules]),
      saveMonitoringRule: vi.fn((rule: MonitoringRule) => {
        const idx = mockRules.findIndex(r => r.sourceId === rule.sourceId);
        if (idx !== -1) mockRules[idx] = rule;
        else mockRules.push(rule);
      }),
      getIndustryProfile: vi.fn(() => mockProfile),
    },
    setMockSources: (sources: Source[]) => { mockSources = sources; },
    setMockRules: (rules: MonitoringRule[]) => { mockRules = [...rules]; },
  };
});

// Utility to set mocks
const { setMockSources, setMockRules, repository: mockRepoObj } = vi.mocked(await import('./repository')) as any;
const saveMonitoringRule = mockRepoObj.saveMonitoringRule;

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

  it('shows approved sources as monitorable and excludes/disables rejected ones', async () => {
    render(<MonitoringScreen />);
    
    // Approved source should be in the list
    expect(await screen.findByText('Approved Source')).toBeInTheDocument();
    
    // Rejected source should not appear as a monitorable source
    expect(screen.queryByText('Rejected Source')).not.toBeInTheDocument();
    
    // Suggested source should not appear as a monitorable source
    expect(screen.queryByText('Suggested Source')).not.toBeInTheDocument();
  });

  it('allows enabling monitoring, changing frequency, and adding keywords', async () => {
    render(<MonitoringScreen />);
    
    // Click "Enable Monitoring" for the approved source
    const enableBtn = await screen.findByRole('button', { name: /Enable Monitoring/i });
    fireEvent.click(enableBtn);
    
    expect(saveMonitoringRule).toHaveBeenCalled();
    const saveCall = vi.mocked(saveMonitoringRule).mock.calls[0][0];
    expect(saveCall.enabled).toBe(true);
    expect(saveCall.sourceId).toBe('s-approved');
    expect(saveCall.frequency).toBe('weekly'); // Default

    // Should now show controls
    const select = await screen.findByRole('combobox', { name: /frequency/i });
    fireEvent.change(select, { target: { value: 'daily' } });
    
    expect(saveMonitoringRule).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveMonitoringRule).mock.calls[1][0].frequency).toBe('daily');

    // Add a keyword
    const keywordInput = await screen.findByPlaceholderText(/add keyword/i);
    await userEvent.type(keywordInput, 'AI{enter}');
    
    expect(saveMonitoringRule).toHaveBeenCalledTimes(3);
    expect(vi.mocked(saveMonitoringRule).mock.calls[2][0].keywords).toContain('AI');
  });

  it('allows disabling an active rule', async () => {
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
    
    const disableBtn = await screen.findByRole('button', { name: /Disable Monitoring/i });
    fireEvent.click(disableBtn);
    
    expect(saveMonitoringRule).toHaveBeenCalled();
    expect(vi.mocked(saveMonitoringRule).mock.calls[0][0].enabled).toBe(false);
  });
});
