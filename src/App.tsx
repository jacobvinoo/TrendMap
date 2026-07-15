import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X, Compass, Activity, Target, Database, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import './App.css';
import IndustrySetup from './IndustrySetup';
import TrendThemesScreen from './TrendThemesScreen';
import WatchlistTopicsScreen from './WatchlistTopicsScreen';
import NewFindingsScreen from './NewFindingsScreen';
import SourceLibrary from './SourceLibrary';
import DocumentIntake from './DocumentIntake';
import SignalsScreen from './SignalsScreen';
import TrendReviewBoard from './TrendReviewBoard';
import InsightsScreen from './InsightsScreen';
import WorkspaceSwitcher from './WorkspaceSwitcher';

import MonitoringScreen from './MonitoringScreen';
import MonitoringDashboard from './MonitoringDashboard';
import TopicTimelineScreen from './TopicTimelineScreen';
import TrendTimelineScreen from './TrendTimelineScreen';
import AlertsScreen from './AlertsScreen';
import StrategyScreen from './StrategyScreen';
import AssumptionsScreen from './AssumptionsScreen';
import AssumptionMonitorPanel from './AssumptionMonitorPanel';
import ImplicationsScreen from './ImplicationsScreen';
import ScenariosScreen from './ScenariosScreen';
import StrategicActionsScreen from './StrategicActionsScreen';
import StrategicOptionsScreen from './StrategicOptionsScreen';
import DecisionBriefScreen from './DecisionBriefScreen';
import RoadmapScreen from './RoadmapScreen';
import AgentActivityScreen from './AgentActivityScreen';
import AgentDebateScreen from './AgentDebateScreen';
import PredictionTimelineScreen from './PredictionTimelineScreen';
import SemanticSearchScreen from './SemanticSearchScreen';
import AdminDataHealthScreen from './AdminDataHealthScreen';
import AuditTrailScreen from './AuditTrailScreen';
import WorkspaceMembersScreen from './WorkspaceMembersScreen';
import OperationsOverviewScreen from './OperationsOverviewScreen';
import { BrainCircuit } from 'lucide-react';
import type { Workspace } from './types';

// Lazy-load the debug panel – only bundled in dev
const LazyTraceabilityPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./debug/TraceabilityHealthPanel').then((m) => ({
        default: m.TraceabilityHealthPanel,
      }))
    )
  : null;

type Tab = 'setup' | 'themes' | 'watchlist' | 'findings' | 'sources' | 'documents' | 'signals' | 'trends' | 'insights'
  | 'dashboard' | 'rules' | 'alerts'
  | 'topic-timeline' | 'trend-timeline'
  | 'strategy' | 'assumptions' | 'indicators' | 'implications' | 'scenarios' | 'options' | 'brief' | 'roadmap'
  | 'strategic-actions'
  | 'agent-activity' | 'prediction-timeline' | 'agent-debate'
  | 'operations' | 'semantic-search' | 'data-health' | 'audit' | 'members'
  | 'debug-traceability';

const PHASES = [
  {
    id: 'p1',
    title: 'Phase 1: Discover',
    icon: Compass,
    tabs: [
      { id: 'setup',    label: 'Industry Setup' },
      { id: 'themes',   label: 'Themes' },
      { id: 'watchlist', label: 'Watchlist' },
      { id: 'findings', label: 'New Findings' },
      { id: 'sources',  label: 'Sources' },
      { id: 'documents',label: 'Documents' },
      { id: 'signals',  label: 'Signals' },
      { id: 'trends',   label: 'Trends' },
      { id: 'insights', label: 'Insights' },
    ]
  },
  {
    id: 'p2',
    title: 'Phase 2: Monitor',
    icon: Activity,
    tabs: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'topic-timeline', label: 'Topic Timeline' },
      { id: 'trend-timeline', label: 'Trend Timeline' },
      { id: 'rules',     label: 'Rules Engine' },
      { id: 'alerts',    label: 'Alerts' },
    ]
  },
  {
    id: 'p3',
    title: 'Phase 3: Strategize',
    icon: Target,
    tabs: [
      { id: 'strategy',    label: 'Strategy Context' },
      { id: 'assumptions', label: 'Assumptions' },
      { id: 'indicators',  label: 'Indicators' },
      { id: 'implications',label: 'Implications' },
      { id: 'scenarios',   label: 'Scenarios' },
      { id: 'strategic-actions', label: 'Strategic Actions' },
      { id: 'options',     label: 'Options' },
      { id: 'brief',       label: 'Decision Brief' },
      { id: 'roadmap',     label: 'Roadmap' },
    ]
  },
  {
    id: 'p4',
    title: 'Phase 4: Intelligence Hub',
    icon: BrainCircuit,
    tabs: [
      { id: 'agent-activity', label: 'Agent Activity' },
      { id: 'agent-debate', label: 'Debate Console' },
      { id: 'prediction-timeline', label: 'Prediction Timeline' },
    ]
  },
  {
    id: 'p5',
    title: 'Phase 5: Operations',
    icon: Database,
    tabs: [
      { id: 'operations', label: 'Overview' },
      { id: 'semantic-search', label: 'Semantic Search' },
      { id: 'data-health', label: 'Data Health' },
      { id: 'members', label: 'Members' },
      { id: 'audit', label: 'Audit Trail' },
    ]
  }
];

const ALL_TABS = PHASES.flatMap(p => p.tabs);

function getTabFromHash(hash: string): Tab {
  const clean = hash.replace('#', '') as Tab;
  if (clean === 'debug-traceability') return clean;
  // Map old 'monitoring' route to 'dashboard' to avoid breaking old links
  if (clean === 'monitoring' as any) return 'dashboard';
  return ALL_TABS.some((t) => t.id === clean) ? clean : 'setup';
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    getTabFromHash(typeof window !== 'undefined' ? window.location.hash : '')
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('trendmap.sidebarCollapsed') === 'true';
  });
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  // Keep tab state in sync with browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const next = getTabFromHash(window.location.hash);
      setActiveTab(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabClick = (tab: Tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('trendmap.sidebarCollapsed', String(next));
      }
      return next;
    });
  };

  const activePhase = PHASES.find(p => p.tabs.some(t => t.id === activeTab));

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#0f0f1a] text-[#e0e0ff] font-sans overflow-hidden">
      {/* ── Mobile Header ──────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#13132b] border-b border-[#2a2a4a] flex-shrink-0 z-40">
        <span className="font-bold text-xl text-[#a0a0ff]">TrendMap</span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 text-gray-400 hover:text-white rounded-md"
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Navigation ──────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 bg-[#13132b] border-r border-[#2a2a4a] flex flex-col transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex-shrink-0
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / brand / mobile close */}
        <div className={`flex items-center border-b border-[#2a2a4a] mb-6 ${isSidebarCollapsed ? 'md:justify-center md:px-3' : 'justify-between'} p-5`}>
          <span className={`font-bold text-xl text-[#a0a0ff] ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            TrendMap
          </span>
          <button
            type="button"
            className="hidden md:inline-flex text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-[#1a1a3a]"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
            title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button 
            className="md:hidden text-gray-400 hover:text-white p-1"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto pb-4 space-y-2 ${isSidebarCollapsed ? 'md:px-3' : 'px-4'}`}>
          <div className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 ${isSidebarCollapsed ? 'md:sr-only' : ''}`}>
            Workflow
          </div>
          {PHASES.map((phase) => {
            const isActive = phase.id === activePhase?.id;
            const Icon = phase.icon;
            return (
              <button
                key={phase.id}
                onClick={() => handleTabClick(phase.tabs[0].id as Tab)}
                title={phase.title}
                aria-label={phase.title}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors font-medium ${
                  isActive 
                    ? 'bg-purple-600/20 text-purple-400' 
                    : 'text-gray-400 hover:bg-[#1a1a3a] hover:text-gray-200'
                } ${isSidebarCollapsed ? 'md:justify-center md:gap-0' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className={isSidebarCollapsed ? 'md:sr-only' : ''}>{phase.title}</span>
              </button>
            );
          })}

          {/* Dev-only traceability link */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-[#2a2a4a]">
              <button
                onClick={() => handleTabClick('debug-traceability' as Tab)}
                title="Traceability"
                aria-label="Traceability"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors font-medium ${
                  activeTab === 'debug-traceability'
                    ? 'bg-[#2a2a4a] text-white'
                    : 'text-[#5a5aff] hover:bg-[#1a1a3a]'
                } ${isSidebarCollapsed ? 'md:justify-center md:gap-0' : ''}`}
              >
                <span aria-hidden="true">🔍</span>
                <span className={isSidebarCollapsed ? 'md:sr-only' : ''}>Traceability</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f1a] relative z-0">
        <WorkspaceSwitcher onWorkspaceChange={setActiveWorkspace} />
        
        {/* Secondary Tab Bar (Sub-navigation) */}
        {activeTab !== 'debug-traceability' && activePhase && (
          <div className="bg-[#13132b] border-b border-[#2a2a4a] px-4 md:px-8 overflow-x-auto flex-shrink-0">
            <div className="flex items-center gap-6 min-w-max">
              {activePhase.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as Tab)}
                  className={`whitespace-nowrap py-4 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-purple-500 text-white' 
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen Container */}
        <main key={activeWorkspace?.id || 'workspace-pending'} className="flex-1 overflow-y-auto">
          {activeTab === 'setup'    && <IndustrySetup />}
          {activeTab === 'themes'   && <TrendThemesScreen />}
          {activeTab === 'watchlist' && <WatchlistTopicsScreen />}
          {activeTab === 'findings' && <NewFindingsScreen />}
          {activeTab === 'sources'  && <SourceLibrary />}
          {activeTab === 'documents'&& <DocumentIntake />}
          {activeTab === 'signals'  && <SignalsScreen />}
          {activeTab === 'trends'   && <TrendReviewBoard />}
          {activeTab === 'insights' && <InsightsScreen />}
          
          {/* Phase 2 screens */}
          {activeTab === 'dashboard' && <MonitoringDashboard />}
          {activeTab === 'topic-timeline' && <TopicTimelineScreen />}
          {activeTab === 'trend-timeline' && <TrendTimelineScreen />}
          {activeTab === 'rules' && <MonitoringScreen />}
          {activeTab === 'alerts'   && <AlertsScreen />}
          
          {/* Phase 3 screens */}
          {activeTab === 'strategy'     && <StrategyScreen />}
          {activeTab === 'assumptions'  && <AssumptionsScreen />}
          {activeTab === 'indicators'   && <AssumptionMonitorPanel />}
          {activeTab === 'implications' && <ImplicationsScreen />}
          {activeTab === 'scenarios'    && <ScenariosScreen />}
          {activeTab === 'strategic-actions' && <StrategicActionsScreen />}
          {activeTab === 'options'      && <StrategicOptionsScreen />}
          {activeTab === 'brief'        && <DecisionBriefScreen />}
          {activeTab === 'roadmap'      && <RoadmapScreen />}
          
          {/* Phase 4 screens */}
          {activeTab === 'agent-activity' && <AgentActivityScreen />}
          {activeTab === 'agent-debate' && <AgentDebateScreen />}
          {activeTab === 'prediction-timeline' && <PredictionTimelineScreen />}

          {/* Phase 5 screens */}
          {activeTab === 'operations' && <OperationsOverviewScreen />}
          {activeTab === 'semantic-search' && <SemanticSearchScreen />}
          {activeTab === 'data-health' && <AdminDataHealthScreen />}
          {activeTab === 'members' && <WorkspaceMembersScreen />}
          {activeTab === 'audit' && <AuditTrailScreen />}
          
          {activeTab === 'debug-traceability' && LazyTraceabilityPanel && (
            <Suspense fallback={<p className="p-6 text-gray-400">Loading traceability panel...</p>}>
              <LazyTraceabilityPanel />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
