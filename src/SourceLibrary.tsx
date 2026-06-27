import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { getSources, updateSourceStatus, updateSourceNote } from './mockRepository';
import type { Source, SourceStatus } from './types';

const formatScore = (score: number) => `${Math.round(score * 100)}%`;

const SourceLibrary: React.FC = () => {
  const [sources, setSources] = useState<Source[]>(getSources());
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const refresh = () => setSources(getSources());

  const handleStatusChange = (id: string, status: SourceStatus) => {
    updateSourceStatus(id, status);
    refresh();
  };

  const handleNoteChange = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    setNoteInputs({ ...noteInputs, [id]: e.target.value });
  };

  const handleAddNote = (id: string) => {
    const note = noteInputs[id]?.trim();
    if (note) {
      updateSourceNote(id, note);
      setNoteInputs({ ...noteInputs, [id]: '' });
      refresh();
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Source Library</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sources.map((src) => (
          <div
            key={src.id}
            data-testid="source-card"
            className={src.status === 'rejected' ? 'rejected' : ''}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              backgroundColor: src.status === 'rejected' ? '#ffe6e6' : 'white',
            }}
          >
            <h3>{src.name}</h3>
            <p>Type: {src.sourceType}</p>
            <p>Credibility: <span data-testid={`credibility-${src.id}`}>{formatScore(src.credibilityScore)}</span></p>
            <p>Relevance: <span data-testid={`relevance-${src.id}`}>{formatScore(src.relevanceScore)}</span></p>
            <p>Freshness: <span data-testid={`freshness-${src.id}`}>{formatScore(src.freshnessScore)}</span></p>
            <p>Status: {src.status}</p>
            {src.notes && <p data-testid={`notes-${src.id}`}>Notes: <span data-testid={`note-text-${src.id}`}>{src.notes}</span></p>}
            <button
              type="button"
              aria-label="Approve"
              onClick={() => handleStatusChange(src.id, 'approved')}
            >
              Approve
            </button>
            <button
              type="button"
              aria-label="Reject"
              onClick={() => handleStatusChange(src.id, 'rejected')}
            >
              Reject
            </button>
            <div style={{ marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Add note"
                value={noteInputs[src.id] || ''}
                onChange={(e) => handleNoteChange(e, src.id)}
                aria-label={`add-note-${src.id}`}
              />
              <button type="button" aria-label="Add Note" onClick={() => handleAddNote(src.id)}>
                Add Note
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceLibrary;
