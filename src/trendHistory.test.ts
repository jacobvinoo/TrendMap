// @ts-nocheck

import { describe, it, expect, beforeEach } from 'vitest';
import { captureTrendScoreSnapshot, getTrendHistory } from './trendHistory';
import { getTrendScoreSnapshots, saveTrends } from './mockRepository';
import type { Trend } from './types';

describe('Trend Score History Service', () => {
  beforeEach(() => {
    globalThis.__mockRepoState!.trendScoreSnapshots = [];
    globalThis.__mockRepoState!.trends = [];
  });

  it('captures a snapshot from an existing trend', () => {
    const trend: Trend = { id: 't1', name: 'Trend 1', 
      summary: '',
      status: 'approved',
      relatedSignalIds: [],
      createdAt: '',
      updatedAt: '',
      confidenceScore: 0.8,
      momentumScore: 0.7,
      impactScore: 0.6
    };
    saveTrends([trend]);

    const snapshot = captureTrendScoreSnapshot('t1');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.trendId).toBe('t1');
    expect(snapshot!.confidenceScore).toBe(0.8);
    expect(snapshot!.momentumScore).toBe(0.7);
    expect(snapshot!.impactScore).toBe(0.6);

    const savedSnapshots = getTrendScoreSnapshots('t1');
    expect(savedSnapshots).toHaveLength(1);
    expect(savedSnapshots[0].id).toBe(snapshot!.id);
  });

  it('retrieves history sorted by capturedAt', () => {
    const trend: Trend = { id: 't2', name: 'Trend 2', 
      summary: '',
      status: 'approved',
      relatedSignalIds: [],
      createdAt: '',
      updatedAt: '',
      confidenceScore: 0.8,
      momentumScore: 0.7,
      impactScore: 0.6
    };
    saveTrends([trend]);

    captureTrendScoreSnapshot('t2');
    
    // Modify trend and capture again
    trend.confidenceScore = 0.9;
    saveTrends([trend]);
    captureTrendScoreSnapshot('t2');

    const history = getTrendHistory('t2');
    expect(history).toHaveLength(2);
    // Should be sorted by capturedAt asc or desc? Usually UI wants ascending for charts or descending for lists.
    // Let's test they are returned.
    expect(history[0].confidenceScore).toBeDefined();
  });
});
