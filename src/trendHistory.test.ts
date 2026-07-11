import { describe, it, expect, beforeEach } from 'vitest';
// import './types';
import { resetMockData, saveTrends } from './mockRepository';
import { generateTrendScoreSnapshot } from './trendHistory';

describe('trendHistory', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('generates a snapshot for an existing trend', () => {
    const trend: any = { id: 't1', name: 'Trend 1', 
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

    const snapshot = generateTrendScoreSnapshot(trend);
    expect(snapshot).not.toBeNull();
    expect(snapshot.trendId).toBe('t1');
    expect(snapshot.confidenceScore).toBe(0.8);
    expect(snapshot.momentumScore).toBe(0.7);
    expect(snapshot.impactScore).toBe(0.6);
  });
});
