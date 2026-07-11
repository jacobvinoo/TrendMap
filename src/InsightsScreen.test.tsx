import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InsightsScreen from './InsightsScreen';
import { repository } from './repository';

// Mock repository methods
vi.spyOn(repository, 'getIndustryProfile').mockResolvedValue({
  id: 'profile-1',
  name: 'Tech',
  // sector: 'Software',
  strategicPriorities: ['AI'],
  riskTolerance: 'high',
  investmentHorizon: 'long'
});

vi.spyOn(repository, 'searchSemantic').mockResolvedValue([
  { entityType: 'trend', entityId: 't1', relevanceScore: 0.9, evidenceSnippet: '', metadata: { title: 'AI Automation' } }
]);

vi.spyOn(repository, 'getInsightSummary').mockResolvedValue({
  id: 'summary-1',
  industryProfileId: 'profile-1',
  generatedAt: new Date().toISOString(),
  aiSummary: '',
  keyTrends: [{ id: 't1', name: 'AI Trend', status: 'approved', impactScore: 0.9, confidenceScore: 0.8, horizon: 'short', relatedSignalIds: [] }],
  watchItems: [],
  emergingRisks: [],
  opportunities: []
} as any);

vi.spyOn(repository, 'getDocuments').mockResolvedValue([
  { id: 'doc1', title: 'Test Doc', sourceId: 'src1', url: '', ingestionStatus: 'processed', publishedDate: '2026-01-01', content: '', extractedSignalIds: [] }
]);

vi.spyOn(repository, 'getSources').mockResolvedValue([
  { id: 'src1', name: 'Test Source', url: '', sourceType: 'report', credibilityScore: 0.9, freshnessScore: 0.9, relevanceScore: 0.9, status: 'approved', notes: '' }
]);

vi.spyOn(repository, 'getEvidenceForTrend').mockResolvedValue([
  { id: 'ev1', trendId: 't1', signalId: 'sig1', documentId: 'doc1', sourceId: 'src1', quote: 'AI is cool', relevanceReason: 'Direct support' }
]);

describe('InsightsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders insights summary and lazy loads evidence', async () => {
    render(<InsightsScreen />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('AI Trend')).toBeInTheDocument();
      expect(screen.getByText(/AI Automation/i)).toBeInTheDocument();
    });

    // Check that evidence button is present
    const viewEvidenceBtn = screen.getByTestId('view-evidence-t1');
    expect(viewEvidenceBtn).toBeInTheDocument();
    
    // Initially evidence is not rendered
    expect(screen.queryByText('AI is cool')).not.toBeInTheDocument();

    // Click to load evidence
    fireEvent.click(viewEvidenceBtn);

    // Wait for lazy loaded evidence
    await waitFor(() => {
      expect(screen.getByText(/"AI is cool"/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Source/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Doc/i)).toBeInTheDocument();
    });
  });
});
