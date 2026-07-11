import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TrendThemesScreen from './TrendThemesScreen';
import { getSources, resetMockData, saveIndustryProfile } from './mockRepository';

describe('TrendThemesScreen', () => {
  beforeEach(() => {
    resetMockData();
    window.location.hash = '';
    saveIndustryProfile({
      id: 'ind-theme-test',
      name: 'Online Grocery Supermarket',
      geography: 'New Zealand',
      description: 'Track pricing, delivery, customer behaviour, digital commerce, logistics, and experience.',
      strategicPriorities: ['Growth', 'Customer experience'],
      customerSegments: ['Families'],
      competitors: ['Countdown'],
      timeHorizons: ['12 months'],
    });
  });

  it('derives and approves strategic trend themes', async () => {
    render(<TrendThemesScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /find themes/i }));

    expect(await screen.findByText('Shopper value and affordability')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /approve shopper value and affordability/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 approved/i)).toBeInTheDocument();
    });
    const approvedSection = screen.getByRole('heading', { name: /approved themes/i }).closest('section');
    expect(approvedSection).not.toBeNull();
    expect(within(approvedSection as HTMLElement).getByText('Shopper value and affordability')).toBeInTheDocument();
  });

  it('adds a manual approved theme', async () => {
    render(<TrendThemesScreen />);

    fireEvent.change(await screen.findByPlaceholderText(/local quick-commerce pressure/i), {
      target: { value: 'Local quick-commerce pressure' },
    });
    fireEvent.change(screen.getByPlaceholderText(/delivery, convenience/i), {
      target: { value: 'delivery, convenience, quick commerce' },
    });
    fireEvent.change(screen.getByPlaceholderText(/strategic reason/i), {
      target: { value: 'Track whether fast delivery changes customer expectations.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add theme$/i }));

    expect(await screen.findByText('Local quick-commerce pressure')).toBeInTheDocument();
    expect(screen.getByText(/1 approved/i)).toBeInTheDocument();
  });

  it('finds sources only after at least one approved theme exists', async () => {
    render(<TrendThemesScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /find themes/i }));
    fireEvent.click(await screen.findByRole('button', { name: /approve shopper value and affordability/i }));
    await waitFor(() => expect(screen.getByText(/1 approved/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /find sources from themes/i }));

    await waitFor(() => {
      expect(window.location.hash).toBe('#sources');
      expect(window.sessionStorage.getItem('trendmap.sources.notice')).toMatch(/guided by approved themes/i);
    });
    expect(getSources().some((source) => source.notes.includes('Shopper value and affordability'))).toBe(true);
  });
});
