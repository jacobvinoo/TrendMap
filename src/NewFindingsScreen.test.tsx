// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import NewFindingsScreen from './NewFindingsScreen';
import { repository } from './repository';
import { resetMockData } from './mockRepository';

describe('NewFindingsScreen', () => {
  beforeEach(async () => {
    resetMockData();
    window.localStorage.clear();
    const workspace = await repository.createWorkspace({ name: 'Search' });
    await repository.setActiveWorkspace(workspace.id);
  });

  it('shows new findings for the active workspace and lets the user approve one', async () => {
    await repository.createFinding({
      findingType: 'merge_proposal',
      title: 'Merge value-seeking grocery behaviour into Shopper value and affordability',
      summary: 'Two topics appear to describe the same strategic area.',
      whyItMatters: 'Merging keeps the timeline and importance score from fragmenting.',
      evidenceSnippet: 'Shared keywords: value, affordability, shopper, promotion.',
      recommendedAction: 'Merge into existing topic',
      confidenceScore: 0.86,
      impactScore: 0.72,
      status: 'new',
    });

    render(<NewFindingsScreen />);

    expect(await screen.findByRole('heading', { name: /new findings/i })).toBeInTheDocument();
    expect(screen.getByText(/Merge value-seeking grocery behaviour/i)).toBeInTheDocument();
    expect(screen.getByText(/Merging keeps the timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 86%/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /approve finding/i }));

    await waitFor(async () => {
      expect(screen.queryByText(/Merge value-seeking grocery behaviour/i)).not.toBeInTheDocument();
      expect((await repository.getFindings({ status: 'approved' }))[0].status).toBe('approved');
    });
  });

  it('does not show findings from another workspace', async () => {
    const searchWorkspace = await repository.getActiveWorkspace();
    const marketingWorkspace = await repository.createWorkspace({ name: 'Digital Marketing' });
    await repository.setActiveWorkspace(marketingWorkspace.id);
    await repository.createFinding({
      findingType: 'news_snippet',
      title: 'Marketing-only finding',
      summary: 'A marketing finding should stay in its own workspace.',
      status: 'new',
    });
    await repository.setActiveWorkspace(searchWorkspace.id);

    render(<NewFindingsScreen />);

    expect(await screen.findByText(/No new findings/i)).toBeInTheDocument();
    expect(screen.queryByText(/Marketing-only finding/i)).not.toBeInTheDocument();
  });

  it('approves a merge proposal and keeps the candidate name as a topic alias', async () => {
    const canonical = await repository.createTrendTheme({
      name: 'Shopper value and affordability',
      keywords: ['value', 'affordability', 'pricing'],
      status: 'approved',
      origin: 'manual',
    });
    await repository.createFinding({
      findingType: 'merge_proposal',
      title: 'Merge Value-seeking grocery behaviour into Shopper value and affordability',
      summary: 'The candidate overlaps with the approved topic.',
      status: 'new',
      metadata: {
        canonicalThemeId: canonical.id,
        candidateThemeName: 'Value-seeking grocery behaviour',
        candidateKeywords: ['value', 'price'],
      },
    });

    render(<NewFindingsScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /approve merge/i }));

    await waitFor(async () => {
      const [theme] = await repository.getTrendThemes();
      expect(theme.aliases).toContain('Value-seeking grocery behaviour');
      expect((await repository.getFindings({ status: 'merged' }))[0].title).toMatch(/Value-seeking grocery behaviour/i);
    });
  });

  it('disables finding approval for analyst workspaces', async () => {
    const analystWorkspace = await repository.createWorkspace({
      name: 'Analyst Workspace',
      currentUserRole: 'analyst',
    });
    await repository.setActiveWorkspace(analystWorkspace.id);
    await repository.createFinding({
      findingType: 'trend_candidate',
      title: 'Finding that needs strategy approval',
      summary: 'This should be visible but not approvable by an analyst.',
      status: 'new',
    });

    render(<NewFindingsScreen />);

    expect(await screen.findByText(/Finding that needs strategy approval/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve finding/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeEnabled();
  });
});
