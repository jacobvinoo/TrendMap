import type { Trend } from './types';

export type OpportunityBand = 'Low' | 'Medium' | 'High' | 'Transformational';

export interface TrendOpportunityEstimate {
  trendId: string;
  trendName: string;
  impactMonth: number;
  impactLabel: string;
  workbackStartMonth: number;
  workbackLabel: string;
  opportunityScore: number;
  opportunityBand: OpportunityBand;
  marketSizeProxy: string;
  revenuePotential: string;
  costReductionPotential: string;
  commercialInterpretation: string;
}

export interface BusinessOpportunityInputs {
  onlineGroceryRevenue: number;
  searchToCartConversion: number;
  recommendationAttributedSales: number;
  substitutionRate: number;
  churnRate: number;
  complaintsRefunds: number;
  retailMediaRevenue: number;
}

export interface BusinessOpportunitySizing {
  addressableRevenueBase: number;
  revenueUpside: number;
  costRiskReduction: number;
  totalOpportunity: number;
  sizingSummary: string;
}

export interface TrendImpactYearPoint {
  year: number;
  projectedImpactScore: number;
  isImpactYear: boolean;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function estimateImpactMonth(horizon: string): number {
  const normalized = (horizon || '').toLowerCase().replace(/_/g, ' ');
  const numbers = normalized.match(/\d+/g)?.map(Number) ?? [];

  if (normalized.includes('now')) return 0;
  if (normalized.includes('short')) return 6;
  if (normalized.includes('medium')) return 18;
  if (normalized.includes('long')) return 36;
  if (normalized.includes('year') || normalized.includes('yr')) {
    if (numbers.length >= 2) return Math.max(...numbers) * 12;
    if (numbers.length === 1) return numbers[0] * 12;
  }
  if (numbers.length >= 2) return Math.max(...numbers);
  if (numbers.length === 1) return numbers[0];
  return 24;
}

export function impactWindowLabel(month: number): string {
  if (month <= 0) return 'Now';
  if (month <= 6) return '0-6 months';
  if (month <= 12) return '6-12 months';
  if (month <= 24) return '12-24 months';
  if (month <= 36) return '24-36 months';
  return '36+ months';
}

function opportunityBand(score: number): OpportunityBand {
  if (score >= 0.8) return 'Transformational';
  if (score >= 0.65) return 'High';
  if (score >= 0.45) return 'Medium';
  return 'Low';
}

function commercialRange(score: number, type: 'market' | 'revenue' | 'cost'): string {
  if (type === 'market') {
    if (score >= 0.8) return 'Large addressable shift';
    if (score >= 0.65) return 'Material category opportunity';
    if (score >= 0.45) return 'Focused segment opportunity';
    return 'Niche or exploratory opportunity';
  }

  if (type === 'revenue') {
    if (score >= 0.8) return 'Potential 5-10%+ revenue upside if adopted';
    if (score >= 0.65) return 'Potential 2-5% revenue upside';
    if (score >= 0.45) return 'Potential 0.5-2% revenue upside';
    return 'Revenue upside likely indirect or unproven';
  }

  if (score >= 0.8) return 'Potential 5-8% cost or productivity benefit';
  if (score >= 0.65) return 'Potential 2-5% cost or productivity benefit';
  if (score >= 0.45) return 'Potential 0.5-2% efficiency benefit';
  return 'Cost benefit likely limited or unproven';
}

export function emptyBusinessOpportunityInputs(): BusinessOpportunityInputs {
  return {
    onlineGroceryRevenue: 0,
    searchToCartConversion: 0,
    recommendationAttributedSales: 0,
    substitutionRate: 0,
    churnRate: 0,
    complaintsRefunds: 0,
    retailMediaRevenue: 0,
  };
}

function money(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function sizeBusinessOpportunity(
  estimate: TrendOpportunityEstimate,
  inputs: BusinessOpportunityInputs,
): BusinessOpportunitySizing {
  const score = clamp(estimate.opportunityScore);
  const onlineRevenue = Math.max(0, inputs.onlineGroceryRevenue || 0);
  const searchConversion = clamp((inputs.searchToCartConversion || 0) / 100);
  const recommendationSales = Math.max(0, inputs.recommendationAttributedSales || 0);
  const substitutionRate = clamp((inputs.substitutionRate || 0) / 100);
  const churnRate = clamp((inputs.churnRate || 0) / 100);
  const complaintsRefunds = Math.max(0, inputs.complaintsRefunds || 0);
  const retailMediaRevenue = Math.max(0, inputs.retailMediaRevenue || 0);

  const searchInfluencedRevenue = onlineRevenue * searchConversion;
  const addressableRevenueBase = recommendationSales + retailMediaRevenue + searchInfluencedRevenue;
  const revenueUpside =
    recommendationSales * (0.02 + score * 0.03) +
    retailMediaRevenue * (0.01 + score * 0.04) +
    searchInfluencedRevenue * score * 0.005;
  const costRiskReduction =
    complaintsRefunds * score * 0.25 +
    onlineRevenue * churnRate * score * 0.02 +
    onlineRevenue * substitutionRate * score * 0.005;
  const totalOpportunity = revenueUpside + costRiskReduction;

  return {
    addressableRevenueBase,
    revenueUpside,
    costRiskReduction,
    totalOpportunity,
    sizingSummary:
      totalOpportunity > 0
        ? `${money(totalOpportunity)} directional annual opportunity: ${money(revenueUpside)} revenue upside and ${money(costRiskReduction)} cost/risk reduction.`
        : 'Enter business inputs to calculate a directional annual opportunity.',
  };
}

export function estimateTrendOpportunity(trend: Trend): TrendOpportunityEstimate {
  const impactMonth = estimateImpactMonth(trend.horizon);
  const impact = clamp(trend.impactScore ?? 0);
  const likelihood = clamp(trend.likelihoodScore ?? trend.confidenceScore ?? 0);
  const confidence = clamp(trend.confidenceScore ?? 0);
  const momentum = clamp(trend.momentumScore ?? 0.5);
  const opportunityScore = Math.round((impact * 0.45 + likelihood * 0.25 + confidence * 0.2 + momentum * 0.1) * 100) / 100;
  const leadMonths = impact >= 0.8 ? 12 : impact >= 0.6 ? 6 : 3;
  const workbackStartMonth = Math.max(0, impactMonth - leadMonths);
  const band = opportunityBand(opportunityScore);

  return {
    trendId: trend.id,
    trendName: trend.name,
    impactMonth,
    impactLabel: impactWindowLabel(impactMonth),
    workbackStartMonth,
    workbackLabel: workbackStartMonth === 0 ? 'Start now' : `Start by month ${workbackStartMonth}`,
    opportunityScore,
    opportunityBand: band,
    marketSizeProxy: commercialRange(opportunityScore, 'market'),
    revenuePotential: commercialRange(opportunityScore, 'revenue'),
    costReductionPotential: commercialRange(opportunityScore, 'cost'),
    commercialInterpretation:
      `${band} opportunity with likely impact in ${impactWindowLabel(impactMonth).toLowerCase()}. ` +
      `Roadmap work should ${workbackStartMonth === 0 ? 'start now' : `start by month ${workbackStartMonth}`} to be ready before the impact window.`,
  };
}

export function estimateTrendOpportunities(trends: Trend[]): TrendOpportunityEstimate[] {
  return trends
    .filter(trend => trend.status === 'approved')
    .map(estimateTrendOpportunity)
    .sort((a, b) => a.impactMonth - b.impactMonth || b.opportunityScore - a.opportunityScore);
}

export function buildYearImpactSeries(
  estimate: TrendOpportunityEstimate,
  startYear: number,
  yearCount: number,
): TrendImpactYearPoint[] {
  return Array.from({ length: yearCount }, (_, index) => {
    const year = startYear + index;
    const yearStartMonth = index * 12;
    const yearEndMonth = (index + 1) * 12;
    const impactMonth = Math.max(1, estimate.impactMonth);
    const progress = clamp(yearEndMonth / impactMonth);
    const projectedImpactScore = Math.round((estimate.opportunityScore * (0.3 + progress * 0.7)) * 100) / 100;

    return {
      year,
      projectedImpactScore,
      isImpactYear: estimate.impactMonth >= yearStartMonth && estimate.impactMonth <= yearEndMonth,
    };
  });
}
