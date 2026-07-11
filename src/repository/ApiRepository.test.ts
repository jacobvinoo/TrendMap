import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiRepository } from './ApiRepository';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ApiRepository', () => {
  let repo: ApiRepository;

  beforeEach(() => {
    repo = new ApiRepository();
    mockFetch.mockReset();
    window.localStorage.clear();
  });

  it('getSources calls /api/sources and returns data', async () => {
    const mockData = [{ id: 'src-1', name: 'Test' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const sources = await repo.getSources();
    expect(mockFetch).toHaveBeenCalledWith('/api/sources', undefined);
    expect(sources).toEqual(mockData);
  });

  it('creates a manual source with normalized API payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'src-manual', name: 'Manual Source', source_type: 'news' })
    });

    const source = await repo.createSource({
      name: 'Manual Source',
      url: 'https://example.com/manual',
      sourceType: 'news',
      status: 'approved',
      notes: 'Added by analyst'
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/sources', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manual Source',
        url: 'https://example.com/manual',
        source_type: 'news',
        credibility_score: 0.7,
        relevance_score: 0.7,
        freshness_score: 0.7,
        status: 'approved',
        notes: 'Added by analyst',
      })
    }));
    expect(source.sourceType).toBe('news');
  });

  it('creates a manual document with normalized API payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'doc-manual',
        sourceId: 'src-1',
        title: 'Manual document',
        ingestion_status: 'raw'
      })
    });

    const document = await repo.createDocument({
      sourceId: 'src-1',
      title: 'Manual document',
      url: 'https://example.com/doc',
      content: 'Manual content',
      publishedDate: '2026-07-06T00:00:00.000Z',
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/documents', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_id: 'src-1',
        title: 'Manual document',
        url: 'https://example.com/doc',
        content: 'Manual content',
        published_date: '2026-07-06T00:00:00.000Z',
        ingestion_status: 'raw',
      })
    }));
    expect(document.ingestionStatus).toBe('raw');
  });

  it('uploads a manual document file with multipart form data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'doc-upload',
        source_id: 'src-1',
        title: 'Uploaded note',
        ingestion_status: 'raw'
      })
    });
    const file = new File(['Uploaded evidence text'], 'uploaded-note.txt', { type: 'text/plain' });

    const document = await repo.uploadDocument(file, {
      sourceId: 'src-1',
      title: 'Uploaded note',
      url: 'https://example.com/upload',
      publishedDate: '2026-07-06T00:00:00.000Z',
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/documents/upload', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('source_id')).toBe('src-1');
    expect(body.get('title')).toBe('Uploaded note');
    expect(document.ingestionStatus).toBe('raw');
  });

  it('deletes a document through the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => ''
    });

    await repo.deleteDocument('doc-manual');

    expect(mockFetch).toHaveBeenCalledWith('/api/documents/doc-manual', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('updateSourceStatus sends PATCH request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'src-1', status: 'approved' })
    });

    await repo.updateSourceStatus('src-1', 'approved');
    expect(mockFetch).toHaveBeenCalledWith('/api/sources/src-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
  });

  it('throws error on failed response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    await expect(repo.getSources()).rejects.toThrow('API Error 500: Internal Server Error');
  });

  // Tests for Phase 4 methods
  it('getAgentActivities fetches from /agent/activities', async () => {
    const mockActivities = [{ id: 'act-1', taskType: 'Test' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities
    });

    const activities = await repo.getAgentActivities();
    expect(mockFetch).toHaveBeenCalledWith('/api/agent/activities', undefined);
    expect(activities).toEqual(mockActivities);
  });

  it('logAgentActivity posts to /agent/activities', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await repo.logAgentActivity({ id: 'act-1' } as any);
    expect(mockFetch).toHaveBeenCalledWith('/api/agent/activities', expect.objectContaining({ method: 'POST' }));
  });

  it('savePrediction posts to /agent/predictions', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await repo.savePrediction({ id: 'pred-1' } as any);
    expect(mockFetch).toHaveBeenCalledWith('/api/agent/predictions', expect.objectContaining({ method: 'POST' }));
  });

  it('saveDebate posts to /agent/debates', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await repo.saveDebate({ id: 'deb-1' } as any);
    expect(mockFetch).toHaveBeenCalledWith('/api/agent/debates', expect.objectContaining({ method: 'POST' }));
  });

  it('addKGNode posts to /knowledge/nodes', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await repo.addKGNode({ id: 'node-1' } as any);
    expect(mockFetch).toHaveBeenCalledWith('/api/knowledge/nodes', expect.objectContaining({ method: 'POST' }));
  });

  it('addKGEdge posts to /knowledge/edges', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await repo.addKGEdge({ id: 'edge-1' } as any);
    expect(mockFetch).toHaveBeenCalledWith('/api/knowledge/edges', expect.objectContaining({ method: 'POST' }));
  });

  it('exports a trend through the Phase 5 API and maps operation fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        export: {
          id: 'exp-1',
          operation_type: 'export',
          entity_type: 'trend',
          status: 'completed',
          file_url: 'memory://export/trend',
          created_at: '2026-01-01T00:00:00',
          completed_at: '2026-01-01T00:00:01'
        },
        payload: { trend: { id: 'trend-1' } }
      })
    });

    const result = await repo.exportTrend('trend-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/export/trend/trend-1', undefined);
    expect(result.export.operationType).toBe('export');
    expect(result.export.entityType).toBe('trend');
    expect(result.payload.trend.id).toBe('trend-1');
  });

  it('runs data health check and maps issues', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'degraded',
        checks_run: 1,
        issue_count: 1,
        issues: [{ severity: 'error', entity_type: 'trend', entity_id: 'trend-1', message: 'Missing evidence' }],
        latest_checks: [{ id: 'hc-1', component: 'data_integrity', status: 'degraded', latency_ms: 1, timestamp: 'now' }]
      })
    });

    const result = await repo.runDataHealthCheck();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/data-health', { method: 'POST' });
    expect(result.issues[0].entityType).toBe('trend');
    expect(result.latestChecks[0].latencyMs).toBe(1);
  });

  it('clears generated analysis data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'cleared',
        deleted_counts: { documents: 2, signals: 3, trends: 1, evidence_links: 4 },
        message: 'Generated analysis data was cleared.'
      })
    });

    const result = await repo.clearAnalysisData();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/clear-analysis-data', { method: 'POST' });
    expect(result.deletedCounts.documents).toBe(2);
    expect(result.status).toBe('cleared');
  });

  it('runs news scan for source candidates', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        run: {
          id: 'scan-1',
          status: 'completed',
          scanned_count: 2,
          matched_count: 1,
          created_source_count: 1,
          summary: 'Scanned 2 news items.'
        },
        snippets: [{
          id: 'snippet-1',
          title: 'Online grocery delivery expands',
          publisher: 'Grocery News',
          relevance_score: 8,
          status: 'matched'
        }],
        sources_created: 1
      })
    });

    const result = await repo.scanNewsForSources();
    expect(mockFetch).toHaveBeenCalledWith('/api/news/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(result.sourcesCreated).toBe(1);
    expect(result.run.scannedCount).toBe(2);
  });

  it('loads the latest strategic context with list fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: 'ctx-old',
          industry_profile_id: 'ind-1',
          company_name: 'Old Context',
          target_customers: ['Old'],
          strategic_goals: [],
          current_capabilities: [],
          constraints: [],
          risk_appetite: 'medium',
          planning_horizons: ['3 months']
        },
        {
          id: 'ctx-new',
          industry_profile_id: 'ind-1',
          company_name: 'New Context',
          target_customers: ['Families'],
          strategic_goals: ['Grow share'],
          current_capabilities: ['Search'],
          constraints: ['Capacity'],
          risk_appetite: 'high',
          planning_horizons: ['6 months', '18 months']
        }
      ])
    });

    const context = await repo.getStrategicContext();
    expect(mockFetch).toHaveBeenCalledWith('/api/strategic-contexts', undefined);
    expect(context?.id).toBe('ctx-new');
    expect(context?.planningHorizons).toEqual(['6 months', '18 months']);
  });

  it('loads an industry profile with populated strategic context when duplicate rows exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: 'ind-empty-newer',
          name: 'Online Grocery',
          geography: 'New Zealand',
          description: 'Core details only',
          strategic_priorities: [],
          customer_segments: [],
          competitors: [],
          time_horizons: []
        },
        {
          id: 'ind-populated',
          name: 'Online Grocery',
          geography: 'New Zealand',
          description: 'Full profile',
          strategic_priorities: ['Growth', 'Customer experience'],
          customer_segments: ['Families'],
          competitors: '["Countdown","PaknSave"]',
          time_horizons: ['6 months', '18 months']
        }
      ])
    });

    const profile = await repo.getIndustryProfile();
    expect(mockFetch).toHaveBeenCalledWith('/api/industries', undefined);
    expect(profile?.id).toBe('ind-populated');
    expect(profile?.strategicPriorities).toEqual(['Growth', 'Customer experience']);
    expect(profile?.customerSegments).toEqual(['Families']);
    expect(profile?.competitors).toEqual(['Countdown', 'PaknSave']);
    expect(profile?.timeHorizons).toEqual(['6 months', '18 months']);
  });

  it('prefers the last saved active industry profile id', async () => {
    window.localStorage.setItem('trendmap.activeIndustryProfileId', 'ind-active');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: 'ind-populated',
          name: 'Older Full Profile',
          strategic_priorities: ['Growth'],
          customer_segments: ['Families'],
          competitors: ['Countdown'],
          time_horizons: ['6 months']
        },
        {
          id: 'ind-active',
          name: 'Active Saved Profile',
          strategic_priorities: [],
          customer_segments: [],
          competitors: [],
          time_horizons: []
        }
      ])
    });

    const profile = await repo.getIndustryProfile();
    expect(profile?.id).toBe('ind-active');
    expect(profile?.name).toBe('Active Saved Profile');
  });

  it('updates an existing industry profile instead of creating a duplicate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'ind-existing', name: 'Updated Grocery' })
    });

    await repo.saveIndustryProfile({
      id: 'ind-existing',
      name: 'Updated Grocery',
      geography: 'New Zealand',
      description: 'Updated context',
      strategicPriorities: ['Growth'],
      customerSegments: ['Families'],
      competitors: ['Countdown'],
      timeHorizons: ['12 months'],
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/industries/ind-existing', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({
        id: 'ind-existing',
        name: 'Updated Grocery',
        geography: 'New Zealand',
        description: 'Updated context',
        strategic_priorities: ['Growth'],
        customer_segments: ['Families'],
        competitors: ['Countdown'],
        time_horizons: ['12 months'],
      }),
    }));
    expect(window.localStorage.getItem('trendmap.activeIndustryProfileId')).toBe('ind-existing');
  });

  it('builds a trend knowledge graph through the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trend_id: 'trend-1',
        nodes_created: 4,
        edges_created: 3,
        node_ids: ['node-1'],
        edge_ids: ['edge-1']
      })
    });

    const result = await repo.buildKnowledgeGraphForTrend('trend-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/knowledge/trends/trend-1/build', { method: 'POST' });
    expect(result.nodesCreated).toBe(4);
  });

  it('calculates source reliability through the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source_id: 'src-1',
        reliability_score: 0.82,
        credibility_score: 0.8,
        relevance_score: 0.9,
        freshness_score: 0.7,
        evidence_count: 2,
        document_count: 3,
        rationale: ['Weighted scores']
      })
    });

    const result = await repo.calculateSourceReliability('src-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/sources/src-1/reliability', { method: 'POST' });
    expect(result.reliabilityScore).toBe(0.82);
  });

  it('calibrates one prediction through the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        prediction_id: 'pred-1',
        evaluated_predictions: 1,
        average_confidence: 0.9,
        average_accuracy: 0.4,
        calibration_error: 0.5,
        recommendation: 'Reduce confidence'
      })
    });

    const result = await repo.calibratePrediction('pred-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/agent/predictions/pred-1/calibration', { method: 'POST' });
    expect(result.calibrationError).toBe(0.5);
  });

  it('runs backend document extraction without sending fabricated documents', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        import_record: {
          id: 'imp-1',
          operation_type: 'import',
          entity_type: 'documents',
          status: 'completed',
          created_at: '2026-06-30T00:00:00'
        },
        imported_count: 1,
        entity_ids: ['doc-1'],
        message: 'Fetched and stored 1 document record from approved source URLs.',
        errors: []
      })
    });

    const result = await repo.extractDocumentsFromSources();
    expect(mockFetch).toHaveBeenCalledWith('/api/documents/extract-from-sources', expect.objectContaining({ method: 'POST' }));
    expect(result.importedCount).toBe(1);
    expect(result.message).toMatch(/Fetched and stored/);
  });

  it('imports documents through parsed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        import_record: {
          id: 'imp-docs',
          operation_type: 'import',
          entity_type: 'documents',
          status: 'completed',
          created_at: '2026-06-30T00:00:00'
        },
        imported_count: 1,
        entity_ids: ['doc-1']
      })
    });

    const result = await repo.importDocuments([{
      title: 'Fetched article',
      content: 'Stored content',
      sourceId: 'src-1',
      ingestionStatus: 'raw'
    }]);

    expect(mockFetch).toHaveBeenCalledWith('/api/import/documents', expect.objectContaining({ method: 'POST' }));
    expect(result.importedCount).toBe(1);
    expect(result.entityIds).toEqual(['doc-1']);
  });

  it('deletes monitoring rules through the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await repo.deleteMonitoringRule('rule-1');
    expect(mockFetch).toHaveBeenCalledWith('/api/monitoring-rules/rule-1', { method: 'DELETE' });
  });
});
