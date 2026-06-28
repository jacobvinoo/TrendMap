// @ts-nocheck

import type { Signal, Trend } from './types';

/**
 * Deterministic clustering of signals into high‑level trends.
 * The rules and scoring are static to guarantee repeatable results.
 */
export function clusterSignalsIntoTrends(signals: Signal[], customClusters?: Array<{ name: string; keywords: string[]; impactScore: number; }>): Trend[] {
  // Helper: whole-word keyword matching (case-insensitive) to avoid false substring hits
  const includesAny = (text: string, keywords: string[]) =>
    keywords.some((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[\\s\\-])${escaped}(?:[\\s\\-]|$)`, 'i').test(text);
    });

  // Define clusters ordered from most-specific to least-specific so that
  // unambiguous signals (e.g. "Retail media influence") are matched before the
  // broad AI cluster. Keywords are lower-case phrases aligned with signalType/title values.
  const defaultClusters = [
    {
      name: 'Retail media influence on search outcomes',
      keywords: ['sponsored', 'retail media', 'ad placement', 'retail media influence'],
      impactScore: 0.7,
    },
    {
      name: 'Recipe-to-cart shopping journeys',
      keywords: ['recipe', 'meal planning', 'basket', 'recipe-to-cart'],
      impactScore: 0.9,
    },
    {
      name: 'Trust and transparency in AI recommendations',
      keywords: ['transparency', 'trust', 'explainability', 'trust in ai'],
      impactScore: 0.6,
    },
    {
      name: 'AI-assisted grocery discovery',
      // 'search relevance' kept; bare 'search' removed to avoid matching retail-media titles
      keywords: ['ai-assisted', 'ai assistant', 'ai‑assisted', 'conversational', 'chat', 'recommendation', 'search relevance'],
      impactScore: 0.8,
    },
  ];
  const clusters = customClusters && customClusters.length > 0 ? customClusters : defaultClusters;


  // Group signals by cluster name
  const clusterMap: Record<string, Signal[]> = {};

  for (const signal of signals) {
    const text = `${signal.signalType} ${signal.title}`.toLowerCase();
    const matchedCluster = clusters.find((c) => includesAny(text, c.keywords));
    if (matchedCluster) {
      if (!clusterMap[matchedCluster.name]) {
        clusterMap[matchedCluster.name] = [];
      }
      clusterMap[matchedCluster.name].push(signal);
    }
  }

  const trends: Trend[] = [];
  const now = new Date('2026-01-01').toISOString();

  // Build trends from each cluster, ensuring no duplicate trend IDs when the same source points to the same document part.
  for (const cluster of clusters) {
    const sigs = clusterMap[cluster.name];
    if (!sigs || sigs.length === 0) continue;

    // Compute scores
    const avgStrength = sigs.reduce((sum, s) => sum + s.strengthScore, 0) / sigs.length;
    const uniqueSources = new Set(sigs.map((s) => s.sourceId)).size;
    let likelihoodScore = avgStrength * (1 + (uniqueSources - 1) * 0.05);
    if (likelihoodScore > 1) likelihoodScore = 1;
    const confidenceScore = sigs.reduce((sum, s) => sum + s.confidenceScore, 0) / sigs.length;

    // Determine horizon deterministically
    let horizon = '2-3 years';
    if (sigs.length >= 3 && avgStrength >= 0.8) horizon = '6-12 months';
    else if (sigs.length >= 2 && avgStrength >= 0.5) horizon = '12-24 months';

    const generateStrategicFields = (clusterName: string) => {
      const name = clusterName.toLowerCase();
      
      if (name.includes('retail media')) {
        return {
          whatNeedsToBeTrue: ['Advertisers continue to shift budget to retail networks', 'Platform maintains high traffic volume'],
          leadingIndicators: ['Increase in sponsored product CTR', 'Growth in brand bidding on generic terms'],
          monitoringQuestions: ['Are organic results being pushed too far down?', 'What is the conversion rate differential between organic and sponsored?'],
          drivers: ['Need for new revenue streams', 'First-party data monetization'],
          blockers: ['Shopper fatigue with ads', 'Technical integration complexity'],
          recommendedActions: ['Launch A/B test on ad density', 'Implement strict relevancy thresholds for sponsored slots']
        };
      }
      if (name.includes('recipe')) {
        return {
          whatNeedsToBeTrue: ['Shoppers prioritize convenience over individual item selection', 'Accurate inventory mapping for ingredients'],
          leadingIndicators: ['Increase in basket size from recipe pages', 'High adoption of "Add All to Cart" feature'],
          monitoringQuestions: ['How often are substitutions required?', 'What is the drop-off rate on recipe pages?'],
          drivers: ['Time-starved consumers', 'Desire for culinary inspiration'],
          blockers: ['Out-of-stock ingredients', 'Complex dietary preferences'],
          recommendedActions: ['Partner with recipe publishers', 'Enhance substitution algorithm for missing ingredients']
        };
      }
      if (name.includes('trust') || name.includes('transparency')) {
        return {
          whatNeedsToBeTrue: ['Clear UI for "Why you are seeing this"', 'Consistent and logical recommendations'],
          leadingIndicators: ['Reduction in manual overrides of suggestions', 'Positive feedback on recommendation accuracy'],
          monitoringQuestions: ['Do users understand the sorting logic?', 'Are we compliant with upcoming AI regulations?'],
          drivers: ['Regulatory pressure', 'Consumer privacy concerns'],
          blockers: ['Black-box algorithms', 'Lack of explainable AI tools'],
          recommendedActions: ['Implement explainability UI markers', 'Publish data usage transparency report']
        };
      }
      if (name.includes('ai-assisted') || name.includes('search')) {
        return {
          whatNeedsToBeTrue: ['Natural language processing handles grocery terms well', 'Low latency in query responses'],
          leadingIndicators: ['Increase in conversational queries', 'Higher conversion from long-tail searches'],
          monitoringQuestions: ['How is it handling ambiguous queries?', 'What is the error rate for voice inputs?'],
          drivers: ['Generative AI breakthroughs', 'Expectation of frictionless search'],
          blockers: ['High compute costs', 'Hallucinations in product descriptions'],
          recommendedActions: ['Pilot conversational chat interface', 'Invest in grocery-specific LLM fine-tuning']
        };
      }
      
      // Fallback for custom or unknown clusters
      return {
        whatNeedsToBeTrue: [`Market conditions remain favorable for ${name}`, 'Technology reaches maturity'],
        leadingIndicators: [`Early adoption metrics for ${name} increase`, 'Mentions in industry reports'],
        monitoringQuestions: [`How quickly is ${name} scaling?`, 'What are competitors doing in this space?'],
        drivers: ['Changing consumer expectations', 'Technological advancement'],
        blockers: ['Implementation costs', 'Legacy system constraints'],
        recommendedActions: [`Initiate pilot program for ${name}`, 'Allocate research budget for Q3']
      };
    };

    const strategicFields = generateStrategicFields(cluster.name);

    const trendId = `trend-${cluster.name.replace(/\s+/g, '-').toLowerCase()}`;
    const trend: Trend = { 
      id: trendId,
      name: cluster.name,
      summary: `Aggregated trend based on ${cluster.name.toLowerCase()}.`,
      status: 'candidate',
      horizon,
      likelihoodScore,
      confidenceScore,
      impactScore: cluster.impactScore,
      maturityStage: 'emerging',
      relatedSignalIds: sigs.map((s) => s.id),
      drivers: strategicFields.drivers,
      blockers: strategicFields.blockers,
      whatNeedsToBeTrue: strategicFields.whatNeedsToBeTrue,
      leadingIndicators: strategicFields.leadingIndicators,
      monitoringQuestions: strategicFields.monitoringQuestions,
      recommendedActions: strategicFields.recommendedActions,
      createdAt: now,
      updatedAt: now,
    };

    // Prevent duplicate trend creation when a trend with same ID already exists and the source points to the same document part.
    // Since the ID is deterministic based on cluster name, duplicates would only arise from identical clustering.
    if (!trends.find((t) => t.id === trendId)) {
      trends.push(trend);
    }
  }

  return trends;
}
