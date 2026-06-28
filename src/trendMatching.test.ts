// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { matchSignalsToExistingTrends } from './trendScoring';
import type { Signal, Trend } from './types';

describe('Trend Matching Service', () => {
  it('matches signal to existing trend based on type', () => {
    const existingTrends: Trend[] = [
      { id: 't1', name: 'Competitor Launch', 
        summary: '',
        status: 'approved',
        relatedSignalIds: [],
        createdAt: '',
        updatedAt: '',
        confidenceScore: 0.5,
        momentumScore: 0.5,
        impactScore: 0.5
      }
    ];

    const signals: Signal[] = [
      {
        id: 's1',
        signalType: 'Competitor Launch',
        documentId: 'doc1',
        sourceId: 'src1',
        title: 'Launch',
        summary: '',
        pestleCategory: 'Competitive',
        noveltyScore: 0.8,
        strengthScore: 0.8,
        confidenceScore: 0.8,
        evidenceDate: '',
        tags: []
      }
    ];

    const { matchedSignals, candidateTrends } = matchSignalsToExistingTrends(signals, existingTrends);
    expect(matchedSignals).toHaveLength(1);
    expect(candidateTrends).toHaveLength(0);
    // The existing trend is updated by the orchestrator, we just need to return the matched signals.
    // Actually, matchSignalsToExistingTrends should return candidate trends for UNMATCHED signals.
  });

  it('creates candidate trends for unmatched signals', () => {
    const existingTrends: Trend[] = [];
    const signals: Signal[] = [
      {
        id: 's1',
        signalType: 'New Tech',
        documentId: 'doc1',
        sourceId: 'src1',
        title: 'New Tech',
        summary: '',
        pestleCategory: 'Technology',
        noveltyScore: 0.8,
        strengthScore: 0.8,
        confidenceScore: 0.8,
        evidenceDate: '',
        tags: []
      },
      {
        id: 's2',
        signalType: 'New Tech',
        documentId: 'doc2',
        sourceId: 'src2',
        title: 'New Tech',
        summary: '',
        pestleCategory: 'Technology',
        noveltyScore: 0.9,
        strengthScore: 0.9,
        confidenceScore: 0.9,
        evidenceDate: '',
        tags: []
      }
    ];

    const { matchedSignals, candidateTrends } = matchSignalsToExistingTrends(signals, existingTrends); 
    
    // Unmatched signals don't go to matchedSignals (or they do, but candidateTrends are created)
    expect(candidateTrends).toHaveLength(1);
    expect(candidateTrends[0].name).toBe('New Tech');
    expect(candidateTrends[0].status).toBe('candidate');
    expect(candidateTrends[0].relatedSignalIds).toContain('s1');
    expect(candidateTrends[0].relatedSignalIds).toContain('s2');
  });
});
