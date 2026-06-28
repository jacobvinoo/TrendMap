// @ts-nocheck
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { test, expect } from 'vitest';
import IndustrySetup from '../IndustrySetup';
import SourceLibrary from '../SourceLibrary';
import TrendReviewBoard from '../TrendReviewBoard';
import InsightsScreen from '../InsightsScreen';
import type { Trend, Signal, EvidenceLink } from '../types';

/**
 * Verify every button rendered in key screens has an accessible name.
 */
function testButtonNames(Component: React.FC, name: string) {
  test(`${name} buttons have accessible names`, async () => {
    if (name === 'TrendReviewBoard') {

      const { saveTrends, saveSignals, addEvidence } = await import('../mockRepository');
      const trend: Trend = { id: 't-1', name: 'Trend', summary: 'Summary', status: 'candidate', horizon: '12-24 months', likelihoodScore: 0, confidenceScore: 0, impactScore: 0, maturityStage: 'emerging', relatedSignalIds: [], drivers: [], blockers: [], whatNeedsToBeTrue: [], leadingIndicators: [], monitoringQuestions: [], recommendedActions: [], createdAt: '', updatedAt: '' } as any; 
      const signal: Signal = { id: 's-1', documentId: 'doc-1', sourceId: 'src-1', title: 'title', summary: 'summary', signalType: 'AI-assisted shopping', pestleCategory: 'Technology', noveltyScore: 0, strengthScore: 0, confidenceScore: 0, evidenceDate: '2026-01-01', tags: [] };
      const evidence: EvidenceLink = { id: 'e-1', trendId: 't-1', signalId: 's-1', documentId: 'doc-1', sourceId: 'src-1', quote: 'q', relevanceReason: 'r' };
      saveTrends([trend]);
      saveSignals([signal]);
      addEvidence(evidence);
    }
    render(<Component />);
    const buttons = screen.queryAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
    });
  });
}

testButtonNames(IndustrySetup, 'IndustrySetup');
testButtonNames(SourceLibrary, 'SourceLibrary');
testButtonNames(TrendReviewBoard, 'TrendReviewBoard');
testButtonNames(InsightsScreen, 'InsightsScreen');
