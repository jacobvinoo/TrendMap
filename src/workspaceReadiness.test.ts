import { describe, expect, it } from 'vitest';
import { buildWorkspaceReadiness } from './workspaceReadiness';

const baseInput = {
  workspace: { id: 'ws-search', name: 'Search' },
  industryProfile: null,
  themes: [],
  findings: [],
  sources: [],
  documents: [],
  signals: [],
  trends: [],
  alerts: [],
  monitoringRules: [],
  strategicContext: null,
  members: [],
};

describe('buildWorkspaceReadiness', () => {
  it('recommends setup when the workspace has no industry profile', () => {
    const summary = buildWorkspaceReadiness(baseInput);

    expect(summary.status).toBe('needs_setup');
    expect(summary.recommendedRoute).toBe('setup');
    expect(summary.items.find((item) => item.id === 'industry')?.state).toBe('missing');
  });

  it('prioritizes review when setup exists but decisions are waiting', () => {
    const summary = buildWorkspaceReadiness({
      ...baseInput,
      industryProfile: {
        id: 'ind-1',
        name: 'Online Grocery',
        geography: 'New Zealand',
        description: '',
        strategicPriorities: [],
        customerSegments: [],
        competitors: [],
        timeHorizons: [],
      },
      themes: [{ id: 'theme-1', name: 'Search', description: '', keywords: [], status: 'approved', origin: 'manual' }],
      sources: [{ id: 'src-1', name: 'Retail Source', url: 'https://example.com', sourceType: 'news', credibilityScore: 0.8, relevanceScore: 0.8, freshnessScore: 0.8, status: 'approved', notes: '' }],
      findings: [{ id: 'finding-1', findingType: 'news_snippet', title: 'Finding', summary: 'Review', status: 'new' }],
    });

    expect(summary.status).toBe('needs_review');
    expect(summary.recommendedRoute).toBe('findings');
    expect(summary.counts.newFindings).toBe(1);
  });

  it('marks a workspace ready when the pipeline and monitoring are in place', () => {
    const summary = buildWorkspaceReadiness({
      ...baseInput,
      industryProfile: {
        id: 'ind-1',
        name: 'Online Grocery',
        geography: 'New Zealand',
        description: '',
        strategicPriorities: [],
        customerSegments: [],
        competitors: [],
        timeHorizons: [],
      },
      themes: [{ id: 'theme-1', name: 'Search', description: '', keywords: [], status: 'approved', origin: 'manual' }],
      sources: [{ id: 'src-1', name: 'Retail Source', url: 'https://example.com', sourceType: 'news', credibilityScore: 0.8, relevanceScore: 0.8, freshnessScore: 0.8, status: 'approved', notes: '' }],
      documents: [{ id: 'doc-1', sourceId: 'src-1', title: 'Doc', publishedDate: '2026-07-01', content: 'Useful evidence', url: 'https://example.com/doc', ingestionStatus: 'extracted', extractedSignalIds: ['sig-1'] }],
      signals: [{ id: 'sig-1' }],
      trends: [{ id: 'trend-1', name: 'AI discovery', summary: '', status: 'approved', horizon: '2027', likelihoodScore: 0.7, confidenceScore: 0.8, impactScore: 0.7, maturityStage: 'emerging', relatedSignalIds: [], drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [] }],
      monitoringRules: [{ id: 'rule-1', name: 'Weekly scan', sourceIds: [], keywords: [], cadence: 'weekly', enabled: true }],
      strategicContext: {
        id: 'ctx-1',
        industryProfileId: 'ind-1',
        companyName: 'Grocer',
        businessModel: 'Online grocery',
        targetCustomers: [],
        strategicGoals: ['Grow digital conversion'],
        currentCapabilities: [],
        constraints: [],
        riskAppetite: 'balanced',
        planningHorizons: [],
      },
    });

    expect(summary.status).toBe('ready');
    expect(summary.headline).toMatch(/ready for regular monitoring/i);
  });
});
