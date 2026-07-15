import { seedTestData } from "./testSeed";
// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import App from './App';
import { repository } from './repository';
import { resetMockData } from './mockRepository';

describe('App shell', () => {
  beforeEach(() => {
    resetMockData();
    seedTestData();
    // Reset hash so each test starts on the Setup tab
    window.location.hash = '';
    window.localStorage.clear();
  });

  test('renders navigation with all five tabs', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    for (const label of ['Industry Setup', 'Themes', 'Sources', 'Documents', 'Signals', 'Trends', 'Insights']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  test('Setup tab is active by default and renders IndustrySetup', async () => {
    render(<App />);
    const setupBtn = screen.getByRole('button', { name: 'Industry Setup' });
    expect(setupBtn).toBeInTheDocument();
    // IndustrySetup renders an industry-name input
    expect(await screen.findByLabelText('industry-name')).toBeInTheDocument();
  });

  test('clicking Sources tab renders SourceLibrary', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sources' }));
    // SourceLibrary renders source cards
    expect((await screen.findAllByTestId('source-card')).length).toBeGreaterThan(0);
  });

  test('clicking Themes tab renders TrendThemesScreen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Themes' }));
    expect(await screen.findByRole('heading', { name: /trend themes/i })).toBeInTheDocument();
  });

  test('desktop navigation can collapse and expand while keeping phase buttons accessible', () => {
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    fireEvent.click(screen.getByRole('button', { name: /collapse navigation menu/i }));

    expect(nav.className).toContain('md:w-20');
    expect(screen.getByRole('button', { name: 'Phase 1: Discover' })).toBeInTheDocument();
    expect(window.localStorage.getItem('trendmap.sidebarCollapsed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /expand navigation menu/i }));
    expect(nav.className).toContain('md:w-64');
    expect(window.localStorage.getItem('trendmap.sidebarCollapsed')).toBe('false');
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
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /trend review board/i })).toBeInTheDocument();
    });
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

  test('direct #options route renders Strategic Options screen', async () => {
    window.location.hash = '#options';

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /strategic options/i })).toBeInTheDocument();
  });

  test('direct #roadmap route renders Strategic Roadmap screen', async () => {
    window.location.hash = '#roadmap';

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /strategic roadmap/i })).toBeInTheDocument();
  });

  test('direct #audit route renders Audit Trail screen', async () => {
    window.history.replaceState(null, '', '#audit');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('audit-trail-screen')).toBeInTheDocument();
  });

  test('direct #members route renders Workspace Members screen', async () => {
    window.history.replaceState(null, '', '#members');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('workspace-members-screen')).toBeInTheDocument();
  });

  test('direct #operations route renders Operations Overview screen', async () => {
    window.history.replaceState(null, '', '#operations');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('operations-overview-screen')).toBeInTheDocument();
  });

  test('direct #trend-timeline route renders Trend Timeline screen', async () => {
    window.history.replaceState(null, '', '#trend-timeline');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('trend-timeline-screen')).toBeInTheDocument();
  });

  test('direct #strategic-actions route renders Strategic Actions screen', async () => {
    window.history.replaceState(null, '', '#strategic-actions');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('strategic-actions-screen')).toBeInTheDocument();
  });

  test('direct #watchlist route renders Watchlist Topics screen', async () => {
    window.history.replaceState(null, '', '#watchlist');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-topics-screen')).toBeInTheDocument();
  });

  test('direct #topic-timeline route renders Topic Timeline screen', async () => {
    window.history.replaceState(null, '', '#topic-timeline');

    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('topic-timeline-screen')).toBeInTheDocument();
  });

  test('shows the active workspace in the app shell and can create a new workspace', async () => {
    render(<App />);

    expect(await screen.findByLabelText(/active workspace/i)).toHaveDisplayValue('Company-wide Trends');
    expect(screen.getByText(/Role: Owner/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /new workspace/i }));
    fireEvent.change(screen.getByLabelText(/workspace name/i), { target: { value: 'Search' } });
    fireEvent.change(screen.getByLabelText(/workspace purpose/i), { target: { value: 'Search-specific trend monitoring' } });
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/active workspace/i)).toHaveDisplayValue('Search');
    });
    expect((await repository.getActiveWorkspace())?.name).toBe('Search');
  });

  test('switching workspace refreshes the current screen scope', async () => {
    window.location.hash = '#findings';
    const company = await repository.getActiveWorkspace();
    const search = await repository.createWorkspace({ name: 'Search' });

    await repository.setActiveWorkspace(company!.id);
    await repository.createFinding({
      findingType: 'news_snippet',
      title: 'Company finding',
      summary: 'Company-wide evidence for review.',
      status: 'new',
    });
    await repository.setActiveWorkspace(search.id);
    await repository.createFinding({
      findingType: 'news_snippet',
      title: 'Search finding',
      summary: 'Search-specific evidence for review.',
      status: 'new',
    });
    await repository.setActiveWorkspace(company!.id);

    render(<App />);

    expect(await screen.findByText(/Company finding/i)).toBeInTheDocument();
    expect(screen.queryByText(/Search finding/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/active workspace/i), { target: { value: search.id } });

    expect(await screen.findByText(/Search finding/i)).toBeInTheDocument();
    expect(screen.queryByText(/Company finding/i)).not.toBeInTheDocument();
  });
});
