import { useState } from 'react';
import { getStrategicContext, saveStrategicContext } from './mockRepository';
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Strategic Context</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Define your company's strategic position. This context shapes all assumptions, implications, scenarios, and recommendations.
      </p>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
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

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
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

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
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
  );
}
