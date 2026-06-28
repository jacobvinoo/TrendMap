import { useState } from 'react';
import { 
  getStrategicContext, 
  saveStrategicContext,
  getStrategicImplications,
  getStrategicOptions,
  getAssumptions,
  getLeadingIndicators
} from './mockRepository';
import { generateDecisionBrief } from './decisionBriefEngine';
import type { StrategicContext, RiskAppetite } from './types';

const DEFAULT_CONTEXT: StrategicContext = {
  id: 'ctx-woolworths-nz',
  industryProfileId: 'ind-1',
  companyName: 'Woolworths NZ',
  businessModel: 'Online grocery retailer providing AI-enhanced discovery and search',
  targetCustomers: ['Home shoppers', 'Busy families', 'Health-conscious consumers'],
  strategicGoals: [
    'Improve search conversion',
    'Reduce zero-result searches',
    'Increase basket size',
    'Improve customer trust in recommendations',
    'Grow retail media revenue without damaging customer experience',
  ],
  currentCapabilities: [
    'Keyword search',
    'Product catalogue',
    'Retail media placements',
    'Customer app and website',
    'Basic personalisation',
    'Analytics events',
  ],
  constraints: [
    'Data quality varies',
    'Sponsored placement may affect relevance',
    'Limited implementation capacity',
    'Customer trust is critical',
    'Regulatory concern around AI transparency may increase',
  ],
  riskAppetite: 'medium',
  planningHorizons: ['3 months', '6 months', '12 months', '24 months'],
};

function ListEditor({
  label,
  placeholder,
  addLabel,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  addLabel: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onAdd(input.trim()); setInput(''); } }}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          aria-label={addLabel}
          onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
        >
          {addLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 bg-gray-700 text-gray-200 text-sm rounded-full px-3 py-1"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(idx)}
              className="ml-1 text-gray-400 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function StrategyScreen() {
  const saved = getStrategicContext();
  const init = saved ?? DEFAULT_CONTEXT;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'context'>('dashboard');

  const [companyName, setCompanyName] = useState(init.companyName);
  const [businessModel, setBusinessModel] = useState(init.businessModel);
  const [targetCustomers, setTargetCustomers] = useState(init.targetCustomers);
  const [strategicGoals, setStrategicGoals] = useState(init.strategicGoals);
  const [currentCapabilities, setCurrentCapabilities] = useState(init.currentCapabilities);
  const [constraints, setConstraints] = useState(init.constraints);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(init.riskAppetite);
  const [planningHorizons, setPlanningHorizons] = useState(init.planningHorizons);
  const [error, setError] = useState('');
  const [saved2, setSaved2] = useState(false);

  const handleSave = () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    setError('');
    const ctx: StrategicContext = {
      id: init.id,
      industryProfileId: init.industryProfileId,
      companyName: companyName.trim(),
      businessModel,
      targetCustomers,
      strategicGoals,
      currentCapabilities,
      constraints,
      riskAppetite,
      planningHorizons,
    };
    saveStrategicContext(ctx);
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2000);
  };

  // Phase 3 Dashboard data
  const implications = getStrategicImplications();
  const options = getStrategicOptions();
  const assumptions = getAssumptions();
  const indicators = getLeadingIndicators();

  const brief = generateDecisionBrief(init, implications, options, assumptions, indicators);

  const opps = brief.topOpportunities.map(id => implications.find(i => i.id === id)!);
  const threats = brief.topThreats.map(id => implications.find(i => i.id === id)!);
  const recOptions = brief.recommendedOptions.map(id => options.find(o => o.id === id)!);
  const testAssumptions = brief.assumptionsToTest.map(id => assumptions.find(a => a.id === id)!);
  const monitorIndicators = brief.indicatorsToMonitor.map(id => indicators.find(li => li.id === id)!);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Strategy</h1>
          <p className="text-gray-400 text-sm">
            Define your company's strategic position and review strategic implications.
          </p>
        </div>
        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'context'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Context Settings
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-2">{brief.headline}</h2>
            <p className="text-gray-300 text-sm">{brief.executiveSummary}</p>
          </div>

          {/* Strategic Context Panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Strategic Context</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div>
                <p className="text-gray-400 font-medium">Company</p>
                <p className="text-gray-200">{init.companyName}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Business Model</p>
                <p className="text-gray-200">{init.businessModel}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Risk Appetite</p>
                <p className="text-gray-200 capitalize">{init.riskAppetite}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Horizons</p>
                <p className="text-gray-200">{init.planningHorizons.join(', ')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-gray-400 font-medium mb-2">Strategic Goals</p>
                <ul className="space-y-1 text-gray-300">
                  {init.strategicGoals.map((g, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-gray-500">•</span> {g}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-2">Target Customers</p>
                <ul className="space-y-1 text-gray-300">
                  {init.targetCustomers.map((c, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-gray-500">•</span> {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-2">Key Capabilities</p>
                <ul className="space-y-1 text-gray-300">
                  {init.currentCapabilities.map((c, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-gray-500">•</span> {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-2">Key Constraints</p>
                <ul className="space-y-1 text-gray-300">
                  {init.constraints.map((c, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-gray-500">•</span> {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Top Opportunities</h3>
              {opps.length > 0 ? (
                <ul className="space-y-4">
                  {opps.map(o => (
                    <li key={o.id} className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">{o.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{o.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No significant opportunities identified yet.</p>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Top Threats</h3>
              {threats.length > 0 ? (
                <ul className="space-y-4">
                  {threats.map(t => (
                    <li key={t.id} className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">{t.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{t.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No significant threats identified yet.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Recommended Options</h3>
            {recOptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recOptions.map(opt => (
                  <div key={opt.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h4 className="font-semibold text-white">{opt.title}</h4>
                    <p className="text-sm text-gray-300 mt-1 mb-2">{opt.description}</p>
                    <span className="inline-block px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded uppercase tracking-wider">
                      {opt.optionType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No recommended options yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Assumptions Needing Validation</h3>
              {testAssumptions.length > 0 ? (
                <ul className="space-y-3">
                  {testAssumptions.map(a => (
                    <li key={a.id} className="flex gap-2 items-start bg-gray-700 p-3 rounded-lg">
                      <span className="text-yellow-400 flex-shrink-0 mt-0.5">•</span>
                      <span className="text-sm text-gray-200">{a.statement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No critical untested assumptions.</p>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">Early Warning Indicators</h3>
              {monitorIndicators.length > 0 ? (
                <ul className="space-y-3">
                  {monitorIndicators.map(i => (
                    <li key={i.id} className="flex gap-2 items-start bg-gray-700 p-3 rounded-lg">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{i.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{i.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No active warning indicators.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'context' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Company Information</h2>
            <div className="mb-4">
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-300 mb-1">
                Company Name
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); setError(''); }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="business-model" className="block text-sm font-medium text-gray-300 mb-1">
                Business Model
              </label>
              <textarea
                id="business-model"
                value={businessModel}
                onChange={e => setBusinessModel(e.target.value)}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="risk-appetite" className="block text-sm font-medium text-gray-300 mb-1">
                Risk Appetite
              </label>
              <select
                id="risk-appetite"
                value={riskAppetite}
                onChange={e => setRiskAppetite(e.target.value as RiskAppetite)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low — Prefer safe, proven options</option>
                <option value="medium">Medium — Balanced experiments and investments</option>
                <option value="high">High — Ready to move fast and take calculated risks</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Strategy</h2>
            <ListEditor
              label="Strategic Goals"
              placeholder="Add strategic goal"
              addLabel="Add Goal"
              items={strategicGoals}
              onAdd={val => setStrategicGoals(g => [...g, val])}
              onRemove={idx => setStrategicGoals(g => g.filter((_, i) => i !== idx))}
            />
            <ListEditor
              label="Target Customers"
              placeholder="Add target customer segment"
              addLabel="Add Customer"
              items={targetCustomers}
              onAdd={val => setTargetCustomers(c => [...c, val])}
              onRemove={idx => setTargetCustomers(c => c.filter((_, i) => i !== idx))}
            />
            <ListEditor
              label="Planning Horizons"
              placeholder="Add planning horizon (e.g. 12 months)"
              addLabel="Add Horizon"
              items={planningHorizons}
              onAdd={val => setPlanningHorizons(h => [...h, val])}
              onRemove={idx => setPlanningHorizons(h => h.filter((_, i) => i !== idx))}
            />
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Capabilities &amp; Constraints</h2>
            <ListEditor
              label="Current Capabilities"
              placeholder="Add capability"
              addLabel="Add Capability"
              items={currentCapabilities}
              onAdd={val => setCurrentCapabilities(c => [...c, val])}
              onRemove={idx => setCurrentCapabilities(c => c.filter((_, i) => i !== idx))}
            />
            <ListEditor
              label="Constraints"
              placeholder="Add constraint"
              addLabel="Add Constraint"
              items={constraints}
              onAdd={val => setConstraints(c => [...c, val])}
              onRemove={idx => setConstraints(c => c.filter((_, i) => i !== idx))}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Save Context
            </button>
            {saved2 && <span className="text-green-400 text-sm">✓ Saved successfully</span>}
          </div>
        </div>
      )}
    </div>
  );
}
