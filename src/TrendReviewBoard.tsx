import React, { useEffect, useState } from 'react';
import type { Trend, EvidenceLink } from './types';

/**
 * TrendReviewBoard – displays candidate trends and allows approve/reject/edit actions.
 * Provides an executive-level detailed review panel with evidence and strategic analysis.
 */
const TrendReviewBoard: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selected, setSelected] = useState<Trend | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, number>>({});
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceLink[]>([]);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const loadData = async () => {
    const { getTrends, getEvidenceForTrend } = await import('./mockRepository');
    const allTrends = getTrends();
    setTrends(allTrends.filter((t) => t.status === 'candidate'));
    const map: Record<string, number> = {};
    allTrends.forEach((t) => {
      const evidences = getEvidenceForTrend(t.id);
      map[t.id] = evidences.length;
    });
    setEvidenceMap(map);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    const { updateTrendStatus } = await import('./mockRepository');
    updateTrendStatus(id, 'approved');
    loadData();
  };

  const handleReject = async (id: string) => {
    const { updateTrendStatus } = await import('./mockRepository');
    updateTrendStatus(id, 'rejected');
    loadData();
  };

  const handleSelect = async (trend: Trend) => {
    const { getEvidenceForTrend } = await import('./mockRepository');
    setSelected(trend);
    setSelectedEvidence(getEvidenceForTrend(trend.id));
    setEditName(trend.name);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (selected && editName.trim() !== '' && editName !== selected.name) {
      const { updateTrend } = await import('./mockRepository');
      updateTrend(selected.id, { name: editName });
      
      // Update local selected state
      setSelected({ ...selected, name: editName });
      
      await loadData();
    }
    setIsEditing(false);
  };

  return (
    <div style={{ padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
      <h2>Trend Review Board</h2>
      
      {selected ? (
        // Executive Detail Panel
        <div style={{ background: '#1a1a2e', borderRadius: '8px', border: '1px solid #3a3a5a', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Header section with edit capability */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2a2a4a', paddingBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Edit trend name"
                    style={{ fontSize: '1.5rem', padding: '0.5rem', background: '#0f0f1a', color: '#fff', border: '1px solid #5a5aff', borderRadius: '4px', width: '80%' }}
                  />
                  <button onClick={handleSaveEdit} style={{ padding: '0.5rem 1rem', background: '#5a5aff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#e0e0ff' }}>{selected.name}</h3>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    aria-label="Edit"
                    style={{ padding: '0.3rem 0.6rem', background: '#2a2a4a', color: '#a0a0ff', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Edit Name
                  </button>
                </div>
              )}
              <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '0.5rem' }}>{selected.summary}</p>
            </div>
            
            <button 
              type="button" 
              aria-label="Close" 
              onClick={() => setSelected(null)}
              style={{ padding: '0.5rem 1.5rem', background: 'transparent', color: '#e0e0ff', border: '1px solid #5a5aff', borderRadius: '4px', cursor: 'pointer' }}
            >
              Back to Board
            </button>
          </div>

          {/* Scores & Metrics */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <MetricBox label="Likelihood" value={(selected.likelihoodScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Confidence" value={(selected.confidenceScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Impact" value={(selected.impactScore * 100).toFixed(0) + '%'} />
            <MetricBox label="Horizon" value={selected.horizon} />
            <MetricBox label="Maturity" value={selected.maturityStage} />
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Left Column: Strategic Fields */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ color: '#a0a0ff', margin: 0, borderBottom: '1px solid #2a2a4a', paddingBottom: '0.5rem' }}>Strategic Analysis</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <StrategicList title="What Needs To Be True" items={selected.whatNeedsToBeTrue} />
                <StrategicList title="Leading Indicators" items={selected.leadingIndicators} />
                <StrategicList title="Monitoring Questions" items={selected.monitoringQuestions} />
                <StrategicList title="Recommended Actions" items={selected.recommendedActions} />
                <StrategicList title="Drivers" items={selected.drivers} />
                <StrategicList title="Blockers" items={selected.blockers} />
              </div>
            </div>

            {/* Right Column: Evidence */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: '#13132b', padding: '1.5rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#a0a0ff', margin: 0 }}>Why this trend exists (Evidence)</h4>
              {selectedEvidence.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.9rem' }}>No direct evidence linked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedEvidence.map(ev => (
                    <div key={ev.id} style={{ borderLeft: '3px solid #5a5aff', paddingLeft: '1rem' }}>
                      <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#ddd', fontSize: '0.95rem' }}>
                        "{ev.quote}"
                      </blockquote>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#aaa', fontSize: '0.85rem' }}>
                        <strong>Relevance:</strong> {ev.relevanceReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Board View
        trends.length === 0 ? (
          <p style={{ color: '#888' }}>No candidate trends to review.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {trends.map((t) => (
              <div 
                key={t.id} 
                data-testid="trend-card" 
                tabIndex={0} 
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { handleSelect(t); } }} 
                style={{ background: '#1a1a2e', borderRadius: '8px', border: '1px solid #2a2a4a', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#e0e0ff' }}>{t.name}</h3>
                  <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{t.summary}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                  <span>Impact: {(t.impactScore * 100).toFixed(0)}%</span>
                  <span>Horizon: {t.horizon}</span>
                  <span>Evidence: {evidenceMap[t.id] ?? 0}</span>
                  <span className="status-text" aria-label="trend-status">Status: {t.status}</span>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
                  <button 
                    type="button" 
                    data-testid={"trend-approve-" + t.id} 
                    aria-label="Approve" 
                    onClick={() => handleApprove(t.id)} 
                    disabled={!evidenceMap[t.id]}
                    style={btnStyle(
                      !evidenceMap[t.id] ? '#2a2a2a' : '#2a4a2a', 
                      !evidenceMap[t.id] ? '#555' : '#a0ffa0',
                      !evidenceMap[t.id]
                    )}
                  >
                    Approve
                  </button>
                  <button type="button" data-testid={"trend-reject-" + t.id} aria-label="Reject" onClick={() => handleReject(t.id)} style={btnStyle('#4a2a2a', '#ffa0a0')}>
                    Reject
                  </button>
                  <button type="button" data-testid={"trend-detail-" + t.id} aria-label="Details" onClick={() => handleSelect(t)} style={btnStyle('#2a2a4a', '#a0a0ff')}>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// Helper Components
const MetricBox = ({ label, value }: { label: string, value: string | number }) => (
  <div style={{ background: '#13132b', padding: '1rem', borderRadius: '8px', border: '1px solid #2a2a4a', minWidth: '120px' }}>
    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '1.4rem', color: '#e0e0ff', fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
  </div>
);

const StrategicList = ({ title, items }: { title: string, items: string[] }) => (
  <div>
    <h5 style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{title}</h5>
    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#aaa', fontSize: '0.9rem' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
    </ul>
  </div>
);

const btnStyle = (bg: string, color: string, disabled: boolean = false) => ({
  flex: 1,
  padding: '0.5rem',
  background: bg,
  color: color,
  border: 'none',
  borderRadius: '4px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.85rem'
});

export default TrendReviewBoard;
