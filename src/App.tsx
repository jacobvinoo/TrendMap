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
import RoadmapScreen from './RoadmapScreen';

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
  | 'strategy' | 'assumptions' | 'indicators' | 'implications' | 'scenarios' | 'options' | 'brief' | 'roadmap'
  | 'debug-traceability';

const TAB_GROUPS = [
  {
    title: 'Phase 1: Discovery',
    tabs: [
      { id: 'setup',    label: 'Industry Setup' },
      { id: 'sources',  label: 'Sources' },
      { id: 'documents',label: 'Documents' },
      { id: 'signals',  label: 'Signals' },
      { id: 'trends',   label: 'Trends' },
      { id: 'insights', label: 'Insights' },
    ]
  },
  {
    title: 'Phase 2: Monitoring',
    tabs: [
      { id: 'monitoring', label: 'Dashboard' },
      { id: 'alerts',   label: 'Alerts' },
    ]
  },
  {
    title: 'Phase 3: Strategy',
    tabs: [
      { id: 'strategy',    label: 'Strategy Context' },
      { id: 'assumptions', label: 'Assumptions' },
      { id: 'indicators',  label: 'Indicators' },
      { id: 'implications',label: 'Implications' },
      { id: 'scenarios',   label: 'Scenarios' },
      { id: 'options',     label: 'Options' },
      { id: 'brief',       label: 'Decision Brief' },
      { id: 'roadmap',     label: 'Roadmap' },
    ]
  }
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

function getTabFromHash(hash: string): Tab {
  const clean = hash.replace('#', '') as Tab;
  if (clean === 'debug-traceability') return clean;
  return ALL_TABS.some((t) => t.id === clean) ? clean : 'setup';
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', background: '#0f0f1a', color: '#e0e0ff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Sidebar Navigation ──────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          background: '#13132b',
          borderRight: '1px solid #2a2a4a',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        {/* Logo / brand */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2a2a4a', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#a0a0ff' }}>
            TrendMap
          </span>
        </div>

        <div style={{ padding: '0 1rem 1rem' }}>
          {TAB_GROUPS.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {group.tabs.map(tab => (
                  <a
                    key={tab.id}
                    href={`#${tab.id}`}
                    onClick={(e) => { e.preventDefault(); handleTabClick(tab.id as Tab); }}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      color: activeTab === tab.id ? '#fff' : '#888',
                      background: activeTab === tab.id ? '#2a2a4a' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === tab.id ? 500 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Dev-only traceability link */}
          {import.meta.env.DEV && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #2a2a4a', paddingTop: '1rem' }}>
              <a
                href="#debug-traceability"
                onClick={(e) => { e.preventDefault(); handleTabClick('debug-traceability' as Tab); }}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: activeTab === 'debug-traceability' ? '#fff' : '#5a5aff',
                  background: activeTab === 'debug-traceability' ? '#2a2a4a' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                🔍 Traceability
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* ── Screen content ─────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
        {activeTab === 'roadmap'      && <RoadmapScreen />}
      </main>
    </div>
  );
}

export default App;
