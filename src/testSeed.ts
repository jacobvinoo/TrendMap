import { saveSources, saveDocuments, saveSignals, saveTrends } from './mockRepository';

export function seedTestData() {
  saveSources([
    {
      id: 'src-1',
      name: 'Test Source',
      url: 'https://test.com',
      sourceType: 'report',
      credibilityScore: 0.85,
      relevanceScore: 0.9,
      freshnessScore: 0.8,
      status: 'suggested',
      notes: '',
      createdAt: '2026-01-05T00:00:00Z',
      updatedAt: '2026-01-06T00:00:00Z'
    },
    {
      id: 'src-2',
      name: 'Approved Source',
      url: 'https://approved.com',
      sourceType: 'news',
      credibilityScore: 0.9,
      relevanceScore: 0.9,
      freshnessScore: 0.9,
      status: 'approved',
      notes: '',
      createdAt: '2026-01-07T00:00:00Z',
      updatedAt: '2026-01-08T00:00:00Z'
    },
    {
      id: 'src-3',
      name: 'Rejected Source',
      url: 'https://rejected.com',
      sourceType: 'social',
      credibilityScore: 0.2,
      relevanceScore: 0.3,
      freshnessScore: 0.5,
      status: 'rejected',
      notes: '',
      createdAt: '2026-01-09T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z'
    }
  ]);

  saveDocuments([
    {
      id: 'doc-1',
      sourceId: 'src-1',
      title: 'Test Doc',
      url: 'https://test.com/doc',
      publishedDate: new Date().toISOString(),
      content: 'This is test content for document 1. AI is changing the world.',
      ingestionStatus: 'extracted',
      extractedSignalIds: ['sig-1']
    },
    {
      id: 'doc-2',
      sourceId: 'src-2',
      title: 'Test Doc 2',
      url: 'https://test.com/doc2',
      publishedDate: new Date().toISOString(),
      content: 'This is test content for document 2. Grocery shopping is fast.',
      ingestionStatus: 'extracted',
      extractedSignalIds: ['sig-2']
    },
    {
      id: 'doc-3',
      sourceId: 'src-3',
      title: 'Test Doc 3',
      url: 'https://test.com/doc3',
      publishedDate: new Date().toISOString(),
      content: 'This is test content for document 3.',
      ingestionStatus: 'extracted',
      extractedSignalIds: ['sig-3']
    }
  ]);

  saveSignals([
    {
      id: 'sig-1',
      title: 'Test Signal',
      summary: 'A test signal',
      sourceId: 'src-1',
      documentId: 'doc-1',
      signalType: 'weak',
      pestleCategory: 'Technology',
      noveltyScore: 0.8,
      strengthScore: 0.9,
      confidenceScore: 0.85,
      evidenceDate: new Date().toISOString(),
      tags: ['AI']
    },
    {
      id: 'sig-2',
      title: 'Test Signal 2',
      summary: 'A test signal 2',
      sourceId: 'src-2',
      documentId: 'doc-2',
      signalType: 'strong',
      pestleCategory: 'Economic',
      noveltyScore: 0.7,
      strengthScore: 0.8,
      confidenceScore: 0.9,
      evidenceDate: new Date().toISOString(),
      tags: ['Retail']
    },
    {
      id: 'sig-3',
      title: 'Test Signal 3',
      summary: 'A test signal 3',
      sourceId: 'src-3',
      documentId: 'doc-3',
      signalType: 'weak',
      pestleCategory: 'Social',
      noveltyScore: 0.5,
      strengthScore: 0.5,
      confidenceScore: 0.5,
      evidenceDate: new Date().toISOString(),
      tags: []
    }
  ]);

  saveTrends([
    {
      id: 'trend-1',
      name: 'Test Trend',
      summary: 'A test trend summary',
      status: 'candidate',
      horizon: 'Short',
      likelihoodScore: 0.6,
      confidenceScore: 0.6,
      impactScore: 0.6,
      maturityStage: 'emerging',
      relatedSignalIds: ['sig-1', 'sig-2'],
      drivers: [],
      blockers: [],
      whatNeedsToBeTrue: [],
      leadingIndicators: [],
      monitoringQuestions: [],
      recommendedActions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
}
