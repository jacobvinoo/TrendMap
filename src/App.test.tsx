// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import App from './App';
import { resetMockData } from './mockRepository';

describe('App shell', () => {
  beforeEach(() => {
    resetMockData();
    // Reset hash so each test starts on the Setup tab
    window.location.hash = '';
  });

  test('renders navigation with all five tabs', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    for (const label of ['Industry Setup', 'Sources', 'Documents', 'Signals', 'Trends', 'Insights']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  test('Setup tab is active by default and renders IndustrySetup', () => {
    render(<App />);
    const setupLink = screen.getByRole('link', { name: 'Industry Setup' });
    expect(setupLink).toHaveAttribute('aria-current', 'page');
    // IndustrySetup renders an industry-name input
    expect(screen.getByLabelText('industry-name')).toBeInTheDocument();
  });

  test('clicking Sources tab renders SourceLibrary', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Sources' }));
    // SourceLibrary renders source cards
    expect(screen.getAllByTestId('source-card').length).toBeGreaterThan(0);
  });

  test('clicking Documents tab renders DocumentIntake', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Documents' }));
    // DocumentIntake renders document cards
    expect(screen.getByTestId('document-intake')).toBeInTheDocument();
  });

  test('clicking Signals tab renders SignalsScreen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Signals' }));
    // SignalsScreen renders a PESTLE category filter
    expect(screen.getByLabelText(/pestle category/i)).toBeInTheDocument();
  });

  test('clicking Trends tab renders TrendReviewBoard', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Trends' }));
    // TrendReviewBoard renders its heading or empty state
    expect(await screen.findByText(/trend review board/i)).toBeInTheDocument();
  });

  test('clicking Insights tab renders InsightsScreen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Insights' }));
    // InsightsScreen renders the new Strategic Insight Brief heading
    expect(await screen.findByRole('heading', { name: /insight brief/i })).toBeInTheDocument();
  });
});
