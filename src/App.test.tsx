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
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  test('Setup tab is active by default and renders IndustrySetup', () => {
    render(<App />);
    const setupBtn = screen.getByRole('button', { name: 'Industry Setup' });
    expect(setupBtn).toBeInTheDocument();
    // IndustrySetup renders an industry-name input
    expect(screen.getByLabelText('industry-name')).toBeInTheDocument();
  });

  test('clicking Sources tab renders SourceLibrary', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sources' }));
    // SourceLibrary renders source cards
    expect(screen.getAllByTestId('source-card').length).toBeGreaterThan(0);
  });

  test('clicking Documents tab renders DocumentIntake', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Documents' }));
    // DocumentIntake renders document cards
    expect(screen.getByTestId('document-intake')).toBeInTheDocument();
  });

  test('clicking Signals tab renders SignalsScreen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Signals' }));
    // SignalsScreen renders a PESTLE category filter
    expect(screen.getByLabelText(/pestle category/i)).toBeInTheDocument();
  });

  test('clicking Trends tab renders TrendReviewBoard', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Trends' }));
    // TrendReviewBoard renders its heading or empty state
    expect(await screen.findByText(/trend review board/i)).toBeInTheDocument();
  });

  test('clicking Insights tab renders InsightsScreen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Insights' }));
    // InsightsScreen renders the new Strategic Insight Brief heading
    expect(await screen.findByRole('heading', { name: /insight brief/i })).toBeInTheDocument();
  });

  test('debug traceability route keeps the app navigation visible', async () => {
    window.location.hash = '#debug-traceability';

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(await screen.findByTestId('traceability-health-panel')).toBeInTheDocument();
  });
});
