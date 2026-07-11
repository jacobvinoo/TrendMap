// @ts-nocheck
import React, { useState } from 'react';
import { validateTraceability } from '../traceabilityValidation';
import type { TraceabilityReportItem } from '../traceabilityValidation';

/**
 * TraceabilityHealthPanel – exposed at /debug/traceability in development mode.
 *
 * Runs the full traceability health check (Trend → Signal → Document → Source)
 * and displays a structured report. Only rendered in development builds.
 */
export const TraceabilityHealthPanel: React.FC = () => {
  const [report, setReport] = useState<TraceabilityReportItem[] | null>(null);
  const [ran, setRan] = useState(false);

  const handleRun = async () => {
    const result = await validateTraceability();
    setReport(result);
    setRan(true);
  };

  const groupedByType = (items: TraceabilityReportItem[]) => {
    const groups: Record<string, TraceabilityReportItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  };

  return (
    <div
      data-testid="traceability-health-panel"
      style={{
        fontFamily: 'monospace',
        padding: '1.5rem',
        background: '#0f0f1a',
        color: '#e0e0ff',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ color: '#7c7cff', marginBottom: '1rem' }}>🔍 Traceability Health</h1>
      <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
        Validates the complete evidence chain: Trend → Signal → Document → Source
      </p>
      <button
        type="button"
        data-testid="run-traceability-check"
        onClick={handleRun}
        style={{
          padding: '0.5rem 1.5rem',
          background: '#7c7cff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          fontWeight: 600,
        }}
      >
        Run Check
      </button>

      {ran && report !== null && (
        <div data-testid="traceability-result">
          {report.length === 0 ? (
            <p style={{ color: '#4caf50', fontWeight: 600, fontSize: '1.1rem' }}>
              ✅ All traceability chains are healthy. No issues found.
            </p>
          ) : (
            <>
              <p style={{ color: '#ff6b6b', fontWeight: 600, marginBottom: '1rem' }}>
                ❌ {report.length} issue{report.length !== 1 ? 's' : ''} found:
              </p>
              {Object.entries(groupedByType(report)).map(([type, items]) => (
                <div key={type} style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: '#ffb74d', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    {type} issues ({items.length})
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {items.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          background: '#1a1a2e',
                          border: '1px solid #3a3a5e',
                          borderRadius: '4px',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.25rem',
                          color: '#ff8a80',
                        }}
                      >
                        <strong>{item.id}</strong>: {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TraceabilityHealthPanel;
