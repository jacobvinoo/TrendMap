import React, { useEffect, useState } from 'react';
import { getTrends, getIndustryProfile } from './mockRepository';
import { generateInsightSummary } from './insightSummary';
import type { InsightSummary } from './types';

/**
 * Strategic Insight Brief Dashboard
 * Provides executive-level summaries of key trends, risks, opportunities, and watch items.
 */
const InsightsScreen: React.FC = () => {
  const [summary, setSummary] = useState<InsightSummary | null>(null);

  useEffect(() => {
    const allTrends = getTrends();
    const approved = allTrends.filter((t) => t.status === 'approved');
    const profile = getIndustryProfile();
    const s = generateInsightSummary(approved, profile?.id || 'unknown-industry');
    setSummary(s);
  }, []);

  if (!summary) return <div style={{ padding: '2rem', color: '#888' }}>Generating strategic brief...</div>;

  return (
    <div data-testid="insights-screen" style={{ padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid #2a2a4a', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#e0e0ff' }}>Strategic Insight Brief</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#888' }}>Generated from approved industry trends</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          As of {new Date(summary.generatedAt).toLocaleDateString()}
        </div>
      </div>

      {summary.keyTrends.length === 0 && summary.emergingRisks.length === 0 && summary.opportunities.length === 0 && summary.watchItems.length === 0 ? (
        <p style={{ color: '#888' }}>No approved trends available for analysis. Please approve trends in the Trend Review Board.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Executive Overview (Key Trends) */}
          <section>
            <h3 style={{ color: '#a0a0ff', fontSize: '1.4rem', marginBottom: '1rem' }}>Executive Overview</h3>
            {summary.keyTrends.length === 0 ? (
              <p style={{ color: '#666' }}>No key trends identified.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {summary.keyTrends.map(trend => (
                  <div key={trend.id} data-testid="key-trend" style={{ background: '#1a1a2e', borderRadius: '8px', border: '1px solid #3a3a5a', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{trend.name}</h4>
                      <span style={{ background: '#2a4a2a', color: '#a0ffa0', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        High Impact
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                      {/* What changed */}
                      <div>
                        <h5 style={{ color: '#a0a0ff', margin: '0 0 0.5rem 0' }}>What changed</h5>
                        <p style={{ color: '#ddd', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>{trend.summary}</p>
                        {trend.drivers && trend.drivers.length > 0 && (
                          <ul style={{ color: '#aaa', fontSize: '0.85rem', margin: 0, paddingLeft: '1.2rem' }}>
                            {trend.drivers.slice(0, 2).map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        )}
                      </div>

                      {/* Why it matters */}
                      <div>
                        <h5 style={{ color: '#a0a0ff', margin: '0 0 0.5rem 0' }}>Why it matters</h5>
                        <p style={{ color: '#ddd', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                          Potential impact score: <strong>{(trend.impactScore * 100).toFixed(0)}%</strong>
                        </p>
                        {trend.leadingIndicators && trend.leadingIndicators.length > 0 && (
                          <ul style={{ color: '#aaa', fontSize: '0.85rem', margin: 0, paddingLeft: '1.2rem' }}>
                            {trend.leadingIndicators.slice(0, 2).map((li, i) => <li key={i}>{li}</li>)}
                          </ul>
                        )}
                      </div>

                      {/* What should we do */}
                      <div style={{ background: '#13132b', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #5a5aff' }}>
                        <h5 style={{ color: '#a0a0ff', margin: '0 0 0.5rem 0' }}>What should we do</h5>
                        {trend.recommendedActions && trend.recommendedActions.length > 0 ? (
                          <ul style={{ color: '#e0e0ff', fontSize: '0.9rem', margin: 0, paddingLeft: '1.2rem' }}>
                            {trend.recommendedActions.map((action, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{action}</li>)}
                          </ul>
                        ) : (
                          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>No specific actions recommended yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Strategic Categorization */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Opportunities */}
            <section style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '8px', borderTop: '4px solid #2a4a2a' }}>
              <h3 style={{ color: '#a0ffa0', margin: '0 0 1rem 0' }}>Opportunities</h3>
              {summary.opportunities.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No direct opportunities identified.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {summary.opportunities.map(t => (
                    <li key={t.id} style={{ borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>
                      <strong style={{ color: '#e0e0ff' }}>{t.name}</strong>
                      {t.recommendedActions && t.recommendedActions.length > 0 && (
                        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{t.recommendedActions[0]}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Emerging Risks */}
            <section style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '8px', borderTop: '4px solid #4a2a2a' }}>
              <h3 style={{ color: '#ffa0a0', margin: '0 0 1rem 0' }}>Emerging Risks</h3>
              {summary.emergingRisks.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No significant risks identified.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {summary.emergingRisks.map(t => (
                    <li key={t.id} style={{ borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>
                      <strong style={{ color: '#e0e0ff' }}>{t.name}</strong>
                      {t.blockers && t.blockers.length > 0 && (
                        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>Risk: {t.blockers[0]}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Watch Items */}
            <section style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '8px', borderTop: '4px solid #5a5aff' }}>
              <h3 style={{ color: '#a0a0ff', margin: '0 0 1rem 0' }}>Watch Items</h3>
              <p style={{ color: '#888', fontSize: '0.8rem', margin: '-0.5rem 0 1rem 0' }}>High impact, low confidence</p>
              {summary.watchItems.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No items currently on watch.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {summary.watchItems.map(t => (
                    <li key={t.id} style={{ borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>
                      <strong style={{ color: '#e0e0ff' }}>{t.name}</strong>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                        <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Impact: {(t.impactScore * 100).toFixed(0)}%</span>
                        <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Conf: {(t.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsScreen;
