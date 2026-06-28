// @ts-nocheck
/**
 * App.tsx – TrendMap Phase 1 shell
 *
 * Implements hash-based tab routing so each of the five Phase 1 screens
 * is reachable from the persistent navigation bar.
 *
 * Hash map:
 *   #setup     → IndustrySetup
 *   #sources   → SourceLibrary
 *   #signals   → SignalsScreen
 *   #trends    → TrendReviewBoard
 *   #insights  → InsightsScreen
 *   (empty)    → defaults to #setup
 *
 * The /debug/traceability panel is still available in DEV mode via
 *   #debug-traceability
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import IndustrySetup from './IndustrySetup';
import SourceLibrary from './SourceLibrary';
import DocumentIntake from './DocumentIntake';
import SignalsScreen from './SignalsScreen';
import TrendReviewBoard from './TrendReviewBoard';
import InsightsScreen from './InsightsScreen';

import MonitoringScreen from './MonitoringScreen';
import MonitoringDashboard from './MonitoringDashboard';
import AlertsScreen from './AlertsScreen';
import StrategyScreen from './StrategyScreen';
import AssumptionsScreen from './AssumptionsScreen';
import AssumptionMonitorPanel from './AssumptionMonitorPanel';
import ImplicationsScreen from './ImplicationsScreen';
import ScenariosScreen from './ScenariosScreen';
import StrategicOptionsScreen from './StrategicOptionsScreen';
import DecisionBriefScreen from './DecisionBriefScreen';

// Lazy-load the debug panel – only bundled in dev
const LazyTraceabilityPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./debug/TraceabilityHealthPanel').then((m) => ({
        default: m.TraceabilityHealthPanel,
      }))
    )
  : null;

type Tab = 'setup' | 'sources' | 'documents' | 'signals' | 'trends' | 'insights'
  | 'monitoring' | 'alerts'
  | 'strategy' | 'assumptions' | 'indicators' | 'implications' | 'scenarios' | 'options' | 'brief'
  | 'debug-traceability';

const TABS: { id: Tab; label: string; group?: string }[] = [
  { id: 'setup',    label: 'Setup' },
  { id: 'sources',  label: 'Sources' },
  { id: 'documents',label: 'Documents' },
  { id: 'signals',  label: 'Signals' },
  { id: 'trends',   label: 'Trends' },
  { id: 'insights', label: 'Insights' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'alerts',   label: 'Alerts' },
  // Phase 3
  { id: 'strategy',    label: 'Strategy',     group: 'p3' },
  { id: 'assumptions', label: 'Assumptions',  group: 'p3' },
  { id: 'indicators',  label: 'Indicators',   group: 'p3' },
  { id: 'implications',label: 'Implications', group: 'p3' },
  { id: 'scenarios',   label: 'Scenarios',    group: 'p3' },
  { id: 'options',     label: 'Options',      group: 'p3' },
  { id: 'brief',       label: 'Brief',        group: 'p3' },
];

function getTabFromHash(hash: string): Tab {
  const clean = hash.replace('#', '') as Tab;
  if (clean === 'debug-traceability') return clean;
  return TABS.some((t) => t.id === clean) ? clean : 'setup';
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    getTabFromHash(typeof window !== 'undefined' ? window.location.hash : '')
  );

  // Keep tab state in sync with browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const next = getTabFromHash(window.location.hash);
      setActiveTab(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Debug traceability route (dev only)
  if (activeTab === ('debug-traceability' as Tab) && LazyTraceabilityPanel) {
    return (
      <Suspense fallback={<p>Loading traceability panel…</p>}>
        <LazyTraceabilityPanel />
      </Suspense>
    );
  }

  const handleTabClick = (tab: Tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f1a', color: '#e0e0ff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Navigation bar ──────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          background: '#13132b',
          borderBottom: '1px solid #2a2a4a',
          padding: '0 1.5rem',
        }}
      >
        {/* Logo / brand */}
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#a0a0ff', marginRight: '2rem', padding: '0.75rem 0' }}>
          TrendMap
        </span>

        {/* Primary tabs */}
        {TABS.map((tab, i) => (
          <>
            {tab.group === 'p3' && TABS[i - 1]?.group !== 'p3' && (
              <span key={`div-${tab.id}`} style={{ width: '1px', background: '#2a2a4a', margin: '0.5rem 0.75rem', alignSelf: 'stretch' }} />
            )}
            <a
              key={tab.id}
              href={`#${tab.id}`}
              onClick={(e) => { e.preventDefault(); handleTabClick(tab.id); }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              style={{
                padding: '0.85rem 1.1rem',
                color: activeTab === tab.id
                  ? (tab.group === 'p3' ? '#c084fc' : '#a0a0ff')
                  : '#888',
                textDecoration: 'none',
                borderBottom: activeTab === tab.id
                  ? `2px solid ${tab.group === 'p3' ? '#a855f7' : '#7c7cff'}`
                  : '2px solid transparent',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </a>
          </>
        ))}

        {/* Dev-only traceability link */}
        {import.meta.env.DEV && (
          <a
            href="#debug-traceability"
            onClick={(e) => { e.preventDefault(); handleTabClick('debug-traceability' as Tab); }}
            style={{
              marginLeft: 'auto',
              padding: '0.85rem 1rem',
              color: '#5a5aff',
              textDecoration: 'none',
              fontSize: '0.8rem',
            }}
          >
            🔍 Traceability
          </a>
        )}
      </nav>

      {/* ── Screen content ─────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'setup'    && <IndustrySetup />}
        {activeTab === 'sources'  && <SourceLibrary />}
        {activeTab === 'documents'&& <DocumentIntake />}
        {activeTab === 'signals'  && <SignalsScreen />}
        {activeTab === 'trends'   && <TrendReviewBoard />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'monitoring' && (
          <div className="flex flex-col gap-8">
            <MonitoringDashboard />
            <div className="border-t border-gray-800 pt-8 mt-4">
              <MonitoringScreen />
            </div>
          </div>
        )}
        {activeTab === 'alerts'   && <AlertsScreen />}
        {/* Phase 3 screens */}
        {activeTab === 'strategy'     && <StrategyScreen />}
        {activeTab === 'assumptions'  && <AssumptionsScreen />}
        {activeTab === 'indicators'   && <AssumptionMonitorPanel />}
        {activeTab === 'implications' && <ImplicationsScreen />}
        {activeTab === 'scenarios'    && <ScenariosScreen />}
        {activeTab === 'options'      && <StrategicOptionsScreen />}
        {activeTab === 'brief'        && <DecisionBriefScreen />}
      </main>
    </div>
  );
}

export default App;
