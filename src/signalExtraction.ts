// @ts-nocheck

import type { Document, Signal } from './types';

// Mapping of keyword sets to signal metadata
interface SignalMeta {
  type: string;
  pestleCategory: string;
  // Fixed scores for deterministic behavior
  noveltyScore: number;
  strengthScore: number;
  confidenceScore: number;
  polarity?: 'positive' | 'negative' | 'neutral';
}

const keywordMap: { keywords: string[]; meta: SignalMeta }[] = [
  {
    keywords: ['ai assistant', 'conversational', 'chat', 'semantic search'],
    meta: {
      type: 'AI-assisted shopping',
      pestleCategory: 'Technology',
      noveltyScore: 0.9,
      strengthScore: 0.8,
      confidenceScore: 0.85,
    },
  },
  {
    keywords: ['sponsored', 'retail media', 'ad placement'],
    meta: {
      type: 'Retail media influence',
      pestleCategory: 'Economic',
      noveltyScore: 0.7,
      strengthScore: 0.75,
      confidenceScore: 0.8,
    },
  },
  {
    keywords: ['zero result', 'no results', 'relevance'],
    meta: {
      type: 'Search relevance',
      pestleCategory: 'Social',
      noveltyScore: 0.6,
      strengthScore: 0.65,
      confidenceScore: 0.7,
    },
  },
  {
    keywords: ['recipe', 'meal planning', 'basket'],
    meta: {
      type: 'Recipe-to-cart',
      pestleCategory: 'Consumer',
      noveltyScore: 0.85,
      strengthScore: 0.8,
      confidenceScore: 0.9,
    },
  },
  {
    keywords: ['transparency', 'explainability'],
    meta: {
      type: 'Trust in AI recommendations',
      pestleCategory: 'Regulatory',
      noveltyScore: 0.95,
      strengthScore: 0.9,
      confidenceScore: 0.88,
    },
  },
  {
    keywords: ['personalization', 'hyper-personalized', 'tailored'],
    meta: {
      type: 'Hyper-personalization',
      pestleCategory: 'Consumer',
      noveltyScore: 0.8,
      strengthScore: 0.85,
      confidenceScore: 0.8,
    },
  },
  // Phase 2 new signals
  {
    keywords: ['launch'],
    meta: {
      type: 'Competitor Launch',
      pestleCategory: 'Competitive',
      noveltyScore: 0.8,
      strengthScore: 0.9,
      confidenceScore: 0.8,
      polarity: 'positive'
    }
  },
  {
    keywords: ['case study', 'lift in conversion'],
    meta: {
      type: 'Adoption Evidence',
      pestleCategory: 'Economic',
      noveltyScore: 0.5,
      strengthScore: 0.8,
      confidenceScore: 0.9,
      polarity: 'positive'
    }
  },
  {
    keywords: ['expanding sponsored placement'],
    meta: {
      type: 'Commercial Influence',
      pestleCategory: 'Economic',
      noveltyScore: 0.6,
      strengthScore: 0.8,
      confidenceScore: 0.8,
      polarity: 'positive'
    }
  },
  {
    keywords: ['pause', 'poor trust', 'hallucinations'],
    meta: {
      type: 'Adoption Blocker',
      pestleCategory: 'social',
      noveltyScore: 0.7,
      strengthScore: 0.9,
      confidenceScore: 0.8,
      polarity: 'negative'
    }
  },
  {
    keywords: ['slower than expected'],
    meta: {
      type: 'Negative Momentum',
      pestleCategory: 'Economic',
      noveltyScore: 0.5,
      strengthScore: 0.8,
      confidenceScore: 0.8,
      polarity: 'negative'
    }
  },
  {
    keywords: ['investigating', 'deceptive advertising', 'regulatory'],
    meta: {
      type: 'Regulatory Risk',
      pestleCategory: 'legal',
      noveltyScore: 0.7,
      strengthScore: 0.8,
      confidenceScore: 0.8,
      polarity: 'negative'
    }
  },
  {
    keywords: ['worried', 'trust concerns'],
    meta: {
      type: 'Trust Concerns',
      pestleCategory: 'Social',
      noveltyScore: 0.6,
      strengthScore: 0.8,
      confidenceScore: 0.8,
      polarity: 'negative'
    }
  }
];


export function extractSignalsFromDocument(document: Document): Signal[] {
  const content = document.content.toLowerCase();
  const title = document.title.toLowerCase();
  const fullText = title + ' ' + content;
  const foundSignals: Signal[] = [];

  for (const { keywords, meta } of keywordMap) {
    if (keywords.some((kw) => fullText.includes(kw))) {
      const baseId = `${document.id}-${meta.type.replace(/\s+/g, '-').toLowerCase()}`;
      
      let summaryText = `Detected ${meta.type.toLowerCase()} signal from document`;
      if (meta.type === 'Competitor Launch') summaryText += ' - launch';

      const signal: Signal = {
        id: baseId,
        documentId: document.id,
        sourceId: document.sourceId,
        title: meta.type,
        summary: summaryText,
        signalType: meta.type,
        pestleCategory: meta.pestleCategory,
        noveltyScore: meta.noveltyScore,
        strengthScore: meta.strengthScore,
        confidenceScore: meta.confidenceScore,
        polarity: meta.polarity || 'neutral', 
        evidenceDate: document.publishedDate,
        tags: [],
      };
      foundSignals.push(signal);
    }
  }

  return foundSignals;
}
