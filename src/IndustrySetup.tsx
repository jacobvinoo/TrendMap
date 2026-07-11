import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { getRepositoryMode, repository } from './repository';
import type { IndustryProfile } from './types';
import { Plus, X, Save, CheckCircle2, Compass } from 'lucide-react';

const ListEditor: React.FC<{
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}> = ({ label, items, onAdd, onRemove, placeholder }) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {(items || []).map((it, idx) => (
          <span 
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-200 border border-gray-600"
          >
            {it}
            <button 
              type="button" 
              onClick={() => onRemove(idx)} 
              aria-label={`remove-${label}-${idx}`}
              className="text-gray-400 hover:text-red-400 transition-colors focus:outline-none"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(e)}
          placeholder={placeholder || `Add ${label}`}
          aria-label={`add-${label}`}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <button 
          type="button" 
          onClick={handleAdd} 
          aria-label={`add-${label}-button`}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

function normalizeProfile(profile: Partial<IndustryProfile> | any): IndustryProfile {
  return {
    id: String(profile?.id || 'ind-1'),
    name: String(profile?.name || ''),
    geography: String(profile?.geography || ''),
    description: String(profile?.description || ''),
    strategicPriorities: normalizeStringList(profile?.strategicPriorities ?? profile?.strategic_priorities),
    customerSegments: normalizeStringList(profile?.customerSegments ?? profile?.customer_segments),
    competitors: normalizeStringList(profile?.competitors),
    timeHorizons: normalizeStringList(profile?.timeHorizons ?? profile?.time_horizons),
  };
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split(',').map(part => part.trim()).filter(Boolean);
    }
  }
  return [];
}

const IndustrySetup: React.FC = () => {
  const defaultProfile: IndustryProfile = {
    id: 'ind-1',
    name: '',
    geography: '',
    description: '',
    strategicPriorities: [],
    customerSegments: [],
    competitors: [],
    timeHorizons: [],
  };
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<IndustryProfile>(defaultProfile);
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFindingSources, setIsFindingSources] = useState(false);
  const [repositoryMode, setRepositoryMode] = useState<'api' | 'local' | 'unknown'>('unknown');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError('');
      let loadWarning = '';

      try {
        const seeded = await repository.getIndustryProfile();
        if (!cancelled && seeded) {
          const normalized = normalizeProfile(seeded);
          setProfile(normalized);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        loadWarning = 'Could not load the saved industry profile. The setup form is still available; save again once the database API is connected.';
      }

      try {
        const mode = await getRepositoryMode();
        if (!cancelled) {
          setRepositoryMode(mode);
        }
      } catch (err) {
        console.error("Error checking repository mode:", err);
        if (!cancelled) {
          setRepositoryMode('unknown');
        }
        loadWarning = loadWarning || 'Could not check the database connection. The setup form is still available.';
      } finally {
        if (!cancelled) {
          if (loadWarning) setError(loadWarning);
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleChange = (field: keyof IndustryProfile) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [field]: e.target.value });
  };

  const handleListAdd = (field: keyof IndustryProfile) => (value: string) => {
    const arr = Array.isArray(profile[field]) ? profile[field] as string[] : [];
    setProfile({ ...profile, [field]: [...arr, value] });
  };

  const handleListRemove = (field: keyof IndustryProfile) => (index: number) => {
    const arr = Array.isArray(profile[field]) ? profile[field] as string[] : [];
    const newArr = arr.filter((_, i) => i !== index);
    setProfile({ ...profile, [field]: newArr });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setError('Industry Name is required.');
      return;
    }
    setError('');
    
    try {
      const mode = await getRepositoryMode();
      setRepositoryMode(mode);
      await repository.saveIndustryProfile(profile);
      setShowSuccess(true);
      if (mode === 'local') {
        setError('Saved in browser storage only because the database API is offline. Stop the current dev server and restart with npm run dev.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save industry profile');
    }
  };

  const handleFindSources = async () => {
    if (!profile.name.trim()) {
      setError('Industry Name is required before identifying themes.');
      return;
    }

    setError('');
    setIsFindingSources(true);
    try {
      await repository.saveIndustryProfile(profile);
      setShowSuccess(true);
      if (typeof window !== 'undefined') {
        window.location.hash = 'themes';
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to continue to themes. ${message}`);
    } finally {
      setIsFindingSources(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading industry profile...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Industry Setup</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure the industry context, strategic priorities, and competitive landscape.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full font-medium animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Save size={16} />
            Save Configuration
          </button>
          
          <button
            type="button"
            onClick={handleFindSources}
            disabled={isFindingSources}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            title="Save this industry setup and identify trend themes"
          >
            <Compass size={16} />
            {isFindingSources ? 'Saving...' : 'Next: Themes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 mt-8">
        {repositoryMode === 'local' && (
          <div className="rounded-lg border border-amber-700 bg-amber-900/30 p-4 text-sm text-amber-100">
            Database API is not connected. This screen is reading browser storage, so saved values will not appear in the backend database. Stop the current dev server and restart with npm run dev.
          </div>
        )}
        
        {/* Core Details Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Core Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Industry Name *</label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={handleChange('name')}
                aria-label="industry-name"
                placeholder="e.g. Online Grocery"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="geography" className="block text-sm font-medium text-gray-300 mb-1.5">Geography</label>
              <input
                id="geography"
                type="text"
                value={profile.geography}
                onChange={handleChange('geography')}
                aria-label="industry-geography"
                placeholder="e.g. Global, APAC, North America"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              id="description"
              value={profile.description}
              onChange={handleChange('description')}
              aria-label="industry-description"
              placeholder="Brief overview of the industry and context..."
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-y"
            />
          </div>
        </div>

        {/* Strategic Context Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Strategic Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <ListEditor
              label="Strategic Priorities"
              items={profile.strategicPriorities}
              onAdd={handleListAdd('strategicPriorities')}
              onRemove={handleListRemove('strategicPriorities')}
              placeholder="e.g. Digital Transformation"
            />
            <ListEditor
              label="Time Horizons"
              items={profile.timeHorizons}
              onAdd={handleListAdd('timeHorizons')}
              onRemove={handleListRemove('timeHorizons')}
              placeholder="e.g. 12-18 months"
            />
          </div>
        </div>

        {/* Market Dynamics Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Market Dynamics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <ListEditor
              label="Customer Segments"
              items={profile.customerSegments}
              onAdd={handleListAdd('customerSegments')}
              onRemove={handleListRemove('customerSegments')}
              placeholder="e.g. Gen Z Consumers"
            />
            <ListEditor
              label="Competitors"
              items={profile.competitors}
              onAdd={handleListAdd('competitors')}
              onRemove={handleListRemove('competitors')}
              placeholder="e.g. Amazon Fresh"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            aria-label="save-button"
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default IndustrySetup;
