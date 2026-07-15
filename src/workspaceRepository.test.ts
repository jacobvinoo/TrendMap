// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { repository } from './repository';
import { resetMockData } from './mockRepository';

describe('workspace-scoped repository flow', () => {
  beforeEach(() => {
    resetMockData();
    window.localStorage.clear();
  });

  it('keeps pipeline data separate for each active workspace', async () => {
    const company = await repository.createWorkspace({
      name: 'Company-wide Trends',
      purpose: 'Broad strategic trend monitoring',
    });
    const search = await repository.createWorkspace({
      name: 'Search',
      purpose: 'Search-specific trend monitoring',
    });

    await repository.setActiveWorkspace(company.id);
    await repository.createSource({
      name: 'Company Source',
      url: 'https://example.com/company',
      status: 'approved',
    });
    await repository.createFinding({
      findingType: 'source_candidate',
      title: 'Company-wide finding',
      summary: 'A company-wide source needs review.',
      recommendedAction: 'Approve source',
      status: 'new',
    });

    await repository.setActiveWorkspace(search.id);
    await repository.createSource({
      name: 'Search Source',
      url: 'https://example.com/search',
      status: 'approved',
    });
    await repository.createFinding({
      findingType: 'signal',
      title: 'Search finding',
      summary: 'A search-specific signal needs review.',
      recommendedAction: 'Review signal',
      status: 'new',
    });

    expect((await repository.getSources()).map((source) => source.name)).toEqual(['Search Source']);
    expect((await repository.getFindings()).map((finding) => finding.title)).toEqual(['Search finding']);

    await repository.setActiveWorkspace(company.id);
    expect((await repository.getSources()).map((source) => source.name)).toEqual(['Company Source']);
    expect((await repository.getFindings()).map((finding) => finding.title)).toEqual(['Company-wide finding']);
  });

  it('persists the active workspace for regular use', async () => {
    const workspace = await repository.createWorkspace({ name: 'Digital Marketing' });

    await repository.setActiveWorkspace(workspace.id);

    expect((await repository.getActiveWorkspace())?.name).toBe('Digital Marketing');
    expect(window.localStorage.getItem('trendmap.activeWorkspaceId')).toBe(workspace.id);
  });

  it('creates a merge proposal instead of adding a duplicate approved theme', async () => {
    await repository.createTrendTheme({
      name: 'Shopper value and affordability',
      description: 'Price sensitivity, promotions, and affordability pressure.',
      keywords: ['value', 'affordability', 'pricing', 'promotions'],
      status: 'approved',
      origin: 'manual',
    });

    await repository.createTrendTheme({
      name: 'Value-seeking grocery behaviour',
      description: 'Shoppers are looking harder for value and deals.',
      keywords: ['value', 'price', 'deals', 'shopper behaviour'],
      status: 'approved',
      origin: 'manual',
    });

    const themes = await repository.getTrendThemes();
    expect(themes.map((theme) => theme.name)).toEqual(['Shopper value and affordability']);

    const findings = await repository.getFindings({ status: 'new' });
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('merge_proposal');
    expect(findings[0].title).toMatch(/Merge Value-seeking grocery behaviour into Shopper value and affordability/i);
    expect(findings[0].metadata?.canonicalThemeId).toBe(themes[0].id);
  });

  it('approving a theme merge proposal preserves the candidate as an alias', async () => {
    const canonical = await repository.createTrendTheme({
      name: 'Shopper value and affordability',
      keywords: ['value', 'affordability', 'pricing'],
      status: 'approved',
      origin: 'manual',
    });
    const finding = await repository.createFinding({
      findingType: 'merge_proposal',
      title: 'Merge Value-seeking grocery behaviour into Shopper value and affordability',
      summary: 'The candidate overlaps with the approved topic.',
      status: 'new',
      metadata: {
        canonicalThemeId: canonical.id,
        candidateThemeName: 'Value-seeking grocery behaviour',
        candidateKeywords: ['value', 'price', 'deals'],
      },
    });

    await repository.updateFinding(finding.id, { status: 'approved' });

    const [updated] = await repository.getTrendThemes();
    expect(updated.aliases).toContain('Value-seeking grocery behaviour');
    expect((await repository.getFindings({ status: 'merged' }))[0].id).toBe(finding.id);
  });

  it('keeps strategic options separate by active workspace', async () => {
    const company = await repository.createWorkspace({ name: 'Company-wide Trends' });
    const search = await repository.createWorkspace({ name: 'Search' });

    await repository.setActiveWorkspace(company.id);
    await repository.saveStrategicOptions([{
      id: 'option-company',
      title: 'Company option',
      description: 'Company-wide action',
      optionType: 'monitor',
      linkedTrendIds: ['trend-company'],
      linkedScenarioIds: [],
      linkedAssumptionIds: [],
      expectedBenefits: [],
      keyRisks: [],
      requiredCapabilities: [],
      estimatedEffort: 'low',
      timeToValue: '12_months',
      impactScore: 0.5,
      feasibilityScore: 0.5,
      urgencyScore: 0.5,
      confidenceScore: 0.5,
      priorityScore: 0.5,
      recommendedNextStep: 'Review later',
      status: 'proposed',
    }]);

    await repository.setActiveWorkspace(search.id);
    await repository.saveStrategicOptions([{
      id: 'option-search',
      title: 'Search option',
      description: 'Search-focused action',
      optionType: 'experiment',
      linkedTrendIds: ['trend-search'],
      linkedScenarioIds: [],
      linkedAssumptionIds: [],
      expectedBenefits: [],
      keyRisks: [],
      requiredCapabilities: [],
      estimatedEffort: 'medium',
      timeToValue: '6_months',
      impactScore: 0.8,
      feasibilityScore: 0.7,
      urgencyScore: 0.8,
      confidenceScore: 0.8,
      priorityScore: 0.78,
      recommendedNextStep: 'Run pilot',
      status: 'proposed',
    }]);

    expect((await repository.getStrategicOptions()).map((option) => option.title)).toEqual(['Search option']);

    await repository.setActiveWorkspace(company.id);
    expect((await repository.getStrategicOptions()).map((option) => option.title)).toEqual(['Company option']);
  });

  it('keeps roadmap items separate by active workspace', async () => {
    const company = await repository.createWorkspace({ name: 'Company-wide Trends' });
    const search = await repository.createWorkspace({ name: 'Search' });

    await repository.setActiveWorkspace(company.id);
    await repository.saveRoadmapItems([{
      id: 'roadmap-company',
      strategicOptionId: 'option-company',
      title: 'Company roadmap item',
      horizon: 'later',
      owner: '',
      status: 'proposed',
      successMetric: 'Company KPI',
      linkedIndicatorIds: [],
    }]);

    await repository.setActiveWorkspace(search.id);
    await repository.saveRoadmapItems([{
      id: 'roadmap-search',
      strategicOptionId: 'option-search',
      title: 'Search roadmap item',
      horizon: 'now',
      owner: '',
      status: 'proposed',
      successMetric: 'Search KPI',
      linkedIndicatorIds: [],
    }]);

    expect((await repository.getRoadmapItems()).map((item) => item.title)).toEqual(['Search roadmap item']);

    await repository.setActiveWorkspace(company.id);
    expect((await repository.getRoadmapItems()).map((item) => item.title)).toEqual(['Company roadmap item']);
  });
});
