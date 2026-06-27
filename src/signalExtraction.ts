import type { Document, Signal } from './types';

// Mapping of keyword sets to signal metadata
interface SignalMeta {
  type: string;
  pestleCategory: string;
  // Fixed scores for deterministic behavior
  noveltyScore: number;
  strengthScore: number;
  confidenceScore: number;
}

const keywordMap: { keywords: string[]; meta: SignalMeta }[] = [
  {
    keywords: ['ai assistant', 'conversational', 'chat'],
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
    keywords: ['transparency', 'trust', 'explainability'],
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
];


export function extractSignalsFromDocument(document: Document): Signal[] {
  const content = document.content.toLowerCase();
  const foundSignals: Signal[] = [];

  for (const { keywords, meta } of keywordMap) {
    if (keywords.some((kw) => content.includes(kw))) {
      const baseId = `${document.id}-${meta.type.replace(/\s+/g, '-').toLowerCase()}`;
      const signal: Signal = {
        id: baseId,
        documentId: document.id,
        sourceId: document.sourceId,
        title: meta.type,
        summary: `Detected ${meta.type.toLowerCase()} signal from document`,
        signalType: meta.type,
        pestleCategory: meta.pestleCategory,
        noveltyScore: meta.noveltyScore,
        strengthScore: meta.strengthScore,
        confidenceScore: meta.confidenceScore,
        evidenceDate: document.publishedDate,
        tags: [],
      };
      foundSignals.push(signal);
    }
  }

  return foundSignals;
}
