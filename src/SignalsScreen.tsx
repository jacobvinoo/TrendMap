// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { getSignals, getSources, getDocuments, saveTrends, addEvidence } from './mockRepository';
import { clusterSignalsIntoTrends } from './trendClustering';
import { generateEvidenceLinks } from './evidenceLinking';

import type { Signal, Source, Document } from './types';

/**
 * SignalsScreen – displays extracted signals with filtering and detail view.
 * Implements the test expectations for rendering, filtering, and detail panel.
 */
const SignalsScreen: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pestleFilter, setPestleFilter] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<string>('');
  const [selected, setSelected] = useState<Signal | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Load data on mount – the mock repository returns deterministic data.
  useEffect(() => {
    setSignals(getSignals());
    setSources(getSources());
    setDocuments(getDocuments());
  }, []);

  // Compute filtered list
  const filtered = signals.filter((s) => {
    if (pestleFilter && s.pestleCategory !== pestleFilter) return false;
    if (minConfidence) {
      const min = parseFloat(minConfidence);
      if (Number.isNaN(min) ? false : s.confidenceScore < min) return false;
    }
    return true;
  });

  const getSourceName = (id: string) => {
    const src = sources.find((s) => s.id === id);
    return src ? src.name : id;
  };

  const getDocumentTitle = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    return doc ? doc.title : id;
  };

  const handleGenerateTrends = () => {
    // 1. Cluster current signals into new trends
    const candidateTrends = clusterSignalsIntoTrends(signals);
    if (candidateTrends.length === 0) {
      setFeedbackMsg('No candidate trends could be generated from current signals.');
      return;
    }

    // 2. Generate evidence links for the new trends
    const evidenceLinks = generateEvidenceLinks(candidateTrends, signals, documents, sources);

    // 3. Filter out trends that have zero evidence (e.g., built entirely from non-approved sources)
    const validTrends = candidateTrends.filter(t => 
      evidenceLinks.some(e => e.trendId === t.id)
    );

    if (validTrends.length === 0) {
      setFeedbackMsg('No candidate trends could be generated (insufficient approved evidence).');
      return;
    }

    // 4. Save valid trends and their evidence to the repository
    saveTrends(validTrends);
    evidenceLinks.forEach(link => addEvidence(link));

    // 5. Show visual feedback
    setFeedbackMsg(`Successfully generated ${validTrends.length} candidate trend(s) and mapped ${evidenceLinks.length} evidence quotes. Ready for review on the Trends board.`);
    
    // Clear message after 5 seconds
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Signals</h2>
      
      {/* Action Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={handleGenerateTrends}
          style={{ padding: '0.75rem 1.5rem', background: '#5a5aff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Generate Candidate Trends
        </button>
        {feedbackMsg && <span style={{ color: '#a0ffa0', fontSize: '0.9rem' }}>{feedbackMsg}</span>}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <label>
          PESTLE category
          <select
            aria-label="PESTLE category"
            value={pestleFilter}
            onChange={(e) => setPestleFilter(e.target.value)}
          >
            <option value="">All</option>
            {/* Dynamically list unique categories */}
            {[...new Set(signals.map((s) => s.pestleCategory))].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label>
          Min confidence
          <input
            aria-label="Min confidence"
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="0-1"
            value={minConfidence}
            onChange={(e) => setMinConfidence(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p>No signals extracted yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              data-testid="signal-card"
              style={{ border: '1px solid #ddd', padding: '1rem', cursor: 'pointer' }}
              onClick={() => setSelected(s)}
            >
              <h3>{s.title}</h3>
              <p>{s.summary}</p>
              <p>Novelty: {s.noveltyScore}</p>
              <p>Strength: {s.strengthScore}</p>
              <p>Confidence: {s.confidenceScore}</p>
              <p>Evidence date: {s.evidenceDate}</p>
              <p>Source: {getSourceName(s.sourceId)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div
          data-testid="signal-detail-panel"
          style={{
            position: 'fixed',
            top: '20%',
            left: '20%',
            right: '20%',
            background: 'white',
            border: '2px solid #444',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <h3>{selected.title}</h3>
          <p>{selected.summary}</p>
          <p>Source: {getSourceName(selected.sourceId)}</p>
          <p>Document: {getDocumentTitle(selected.documentId)}</p>
          <button type="button" aria-label="Close" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SignalsScreen;
