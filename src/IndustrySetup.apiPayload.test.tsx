import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

const mocks = vi.hoisted(() => ({
  getIndustryProfile: vi.fn(),
  saveIndustryProfile: vi.fn(),
}));

vi.mock('./repository', () => ({
  getRepositoryMode: vi.fn(async () => 'api'),
  repository: {
    getIndustryProfile: mocks.getIndustryProfile,
    saveIndustryProfile: mocks.saveIndustryProfile,
  },
}));

vi.mock('./eventBus', () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

import IndustrySetup from './IndustrySetup';

describe('IndustrySetup API payload rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Strategic Context and Market Dynamics fields from a backend-shaped industry row', async () => {
    mocks.getIndustryProfile.mockResolvedValue({
      id: 'ind-api',
      name: 'Online Grocery Supermarket',
      geography: 'New Zealand',
      description: 'Saved through the API',
      strategic_priorities: ['Growth', 'Customer experience'],
      time_horizons: '["6 months","18 months"]',
      customer_segments: ['Families', 'Busy professionals'],
      competitors: 'Countdown, PaknSave',
    });

    render(<IndustrySetup />);

    expect(await screen.findByDisplayValue('Online Grocery Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Customer experience')).toBeInTheDocument();
    expect(screen.getByText('6 months')).toBeInTheDocument();
    expect(screen.getByText('18 months')).toBeInTheDocument();
    expect(screen.getByText('Families')).toBeInTheDocument();
    expect(screen.getByText('Busy professionals')).toBeInTheDocument();
    expect(screen.getByText('Countdown')).toBeInTheDocument();
    expect(screen.getByText('PaknSave')).toBeInTheDocument();
  });

  it('still renders the setup form when loading the saved profile fails', async () => {
    mocks.getIndustryProfile.mockRejectedValue(new Error('API unavailable'));

    render(<IndustrySetup />);

    expect(await screen.findByLabelText('industry-name')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not load the saved industry profile/i);
  });
});
