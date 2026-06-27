import React, { useState, useEffect } from 'react';
import { getDocuments, getSources, updateDocumentIngestionStatus, saveSignals, updateDocumentExtractedSignals } from './mockRepository';
import { extractSignalsFromDocument } from './signalExtraction';
import type { Document, Source } from './types';

interface DocumentWithSource extends Document {
  sourceName: string;
  sourceStatus: string;
}

const DocumentIntake: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentWithSource[]>([]);
  const [showAll, setShowAll] = useState(false);

  const loadData = () => {
    const docs = getDocuments();
    const sources = getSources();
    const sourceMap = new Map<string, Source>(sources.map(s => [s.id, s]));

    const enriched = docs.map(doc => {
      const source = sourceMap.get(doc.sourceId);
      return {
        ...doc,
        sourceName: source?.name ?? 'Unknown Source',
        sourceStatus: source?.status ?? 'suggested',
      };
    });

    setDocuments(enriched);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExtract = (doc: DocumentWithSource) => {
    const newSignals = extractSignalsFromDocument(doc);
    saveSignals(newSignals);
    
    // Save extracted signal IDs back to the document to complete traceability
    const signalIds = newSignals.map(s => s.id);
    updateDocumentExtractedSignals(doc.id, signalIds);
    
    updateDocumentIngestionStatus(doc.id, 'extracted');
    loadData(); // Refresh UI
  };

  const displayedDocs = documents.filter(doc => showAll || doc.sourceStatus === 'approved');

  return (
    <div data-testid="document-intake" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Document Intake</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            aria-label="show-all-toggle"
          />
          Show all sources
        </label>
      </div>

      {displayedDocs.length === 0 ? (
        <p style={{ color: '#888' }}>No documents to review.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {displayedDocs.map(doc => (
            <div
              key={doc.id}
              data-testid="document-card"
              style={{
                background: '#1a1a2e',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #2a2a4a',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e0e0ff' }}>{doc.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                    {doc.sourceName} • {doc.publishedDate}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: doc.sourceStatus === 'approved' ? '#2a4a2a' : '#4a2a2a',
                    color: doc.sourceStatus === 'approved' ? '#a0ffa0' : '#ffa0a0',
                  }}
                  data-testid="source-status-text"
                >
                  Source: {doc.sourceStatus}
                </span>
              </div>
              
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {doc.content}
              </p>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: doc.ingestionStatus === 'extracted' ? '#a0ffa0' : '#888' }}>
                  Status: {doc.ingestionStatus}
                </span>
                <button
                  onClick={() => handleExtract(doc)}
                  disabled={doc.ingestionStatus === 'extracted'}
                  aria-label={`Extract signals from ${doc.title}`}
                  style={{
                    padding: '0.5rem 1rem',
                    background: doc.ingestionStatus === 'extracted' ? '#2a2a4a' : '#5a5aff',
                    color: doc.ingestionStatus === 'extracted' ? '#888' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: doc.ingestionStatus === 'extracted' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {doc.ingestionStatus === 'extracted' ? 'Extracted' : 'Extract Signals'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentIntake;
