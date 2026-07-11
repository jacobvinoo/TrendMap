import React, { useEffect, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { repository } from './repository';
import type { IndustryProfile, TrendTheme, TrendThemeStatus } from './types';

const keywordList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

const statusClass: Record<TrendThemeStatus, string> = {
  suggested: 'border-amber-700/50 bg-amber-950/20',
  approved: 'border-green-700/50 bg-green-950/20',
  rejected: 'border-red-800/50 bg-red-950/20 opacity-75',
};

const TrendThemesScreen: React.FC = () => {
  const [industry, setIndustry] = useState<IndustryProfile | null>(null);
  const [themes, setThemes] = useState<TrendTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [isDeriving, setIsDeriving] = useState(false);
  const [isFindingSources, setIsFindingSources] = useState(false);
  const [manual, setManual] = useState({ name: '', description: '', keywords: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, savedThemes] = await Promise.all([
        repository.getIndustryProfile(),
        repository.getTrendThemes(),
      ]);
      setIndustry(profile);
      setThemes(savedThemes);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to load themes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deriveThemes = async () => {
    setIsDeriving(true);
    setNotice('');
    try {
      const generated = await repository.deriveTrendThemes(industry?.id);
      await loadData();
      setNotice(`Found ${generated.length} strategic theme${generated.length === 1 ? '' : 's'} to review.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to identify themes.');
    } finally {
      setIsDeriving(false);
    }
  };

  const updateStatus = async (theme: TrendTheme, status: TrendThemeStatus) => {
    await repository.updateTrendTheme(theme.id, { status });
    await loadData();
  };

  const addManualTheme = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manual.name.trim()) {
      setNotice('Enter a theme name.');
      return;
    }
    await repository.createTrendTheme({
      industryId: industry?.id,
      name: manual.name.trim(),
      description: manual.description.trim(),
      keywords: keywordList(manual.keywords),
      status: 'approved',
      origin: 'manual',
      evidenceSummary: 'Manually added by analyst as a strategic search area.',
    });
    setManual({ name: '', description: '', keywords: '' });
    setNotice('Manual theme added and approved.');
    await loadData();
  };

  const findSources = async () => {
    if (!industry?.id) {
      setNotice('Save the industry setup before finding sources.');
      return;
    }
    if (approvedCount === 0) {
      setNotice('Approve at least one theme before finding sources.');
      return;
    }
    setIsFindingSources(true);
    try {
      const sources = await repository.discoverSources(industry.id);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('trendmap.sources.notice', `Found ${sources.length} source candidate${sources.length === 1 ? '' : 's'} guided by approved themes.`);
        window.location.hash = 'sources';
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to find sources from approved themes.');
    } finally {
      setIsFindingSources(false);
    }
  };

  const approvedCount = themes.filter((theme) => theme.status === 'approved').length;
  const suggestedCount = themes.filter((theme) => theme.status === 'suggested').length;
  const suggestedThemes = themes.filter((theme) => theme.status === 'suggested');
  const approvedThemes = themes.filter((theme) => theme.status === 'approved');
  const rejectedThemes = themes.filter((theme) => theme.status === 'rejected');

  const updateThemeStatus = async (theme: TrendTheme, status: TrendThemeStatus) => {
    await updateStatus(theme, status);
    if (status === 'approved') setNotice(`Approved "${theme.name}". It is now guiding source discovery.`);
    if (status === 'suggested') setNotice(`Moved "${theme.name}" back to theme candidates.`);
    if (status === 'rejected') setNotice(`Rejected "${theme.name}".`);
  };

  const renderThemeCard = (theme: TrendTheme) => (
    <article key={theme.id} data-testid="trend-theme-card" className={`rounded-xl border p-5 ${statusClass[(theme.status || 'suggested') as TrendThemeStatus] || statusClass.suggested}`}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{theme.name}</h3>
          <p className="mt-1 text-sm text-gray-300">{theme.description}</p>
        </div>
        <span className="rounded-full border border-gray-600 bg-gray-900 px-2.5 py-1 text-xs font-semibold capitalize text-gray-300">
          {theme.status}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(theme.keywords || []).map((keyword) => (
          <span key={keyword} className="rounded-full border border-gray-600 bg-gray-900 px-2 py-0.5 text-xs text-gray-300">{keyword}</span>
        ))}
      </div>
      {theme.evidenceSummary || theme.evidence_summary ? (
        <p className="mb-4 text-xs text-gray-400">{theme.evidenceSummary || theme.evidence_summary}</p>
      ) : null}
      <div className="flex gap-2">
        {theme.status === 'approved' ? (
          <button
            type="button"
            aria-label={`Move ${theme.name} back to candidates`}
            onClick={() => updateThemeStatus(theme, 'suggested')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-600/40 bg-amber-600/20 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-600/30"
          >
            Back to Review
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Approve ${theme.name}`}
            onClick={() => updateThemeStatus(theme, 'approved')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-green-600/40 bg-green-600/20 px-3 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-600/30"
          >
            <Check size={15} /> Approve
          </button>
        )}
        {theme.status === 'rejected' ? (
          <button
            type="button"
            aria-label={`Move ${theme.name} back to candidates`}
            onClick={() => updateThemeStatus(theme, 'suggested')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-600/40 bg-amber-600/20 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-600/30"
          >
            Back to Review
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Reject ${theme.name}`}
            onClick={() => updateThemeStatus(theme, 'rejected')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600/40 bg-red-600/20 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-600/30"
          >
            <X size={15} /> Reject
          </button>
        )}
      </div>
    </article>
  );

  const renderThemeSection = (title: string, description: string, items: TrendTheme[]) => (
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <span className="text-xs font-semibold text-gray-400">{items.length} theme{items.length === 1 ? '' : 's'}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/40 px-5 py-8 text-sm text-gray-400">
          None yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {items.map(renderThemeCard)}
        </div>
      )}
    </section>
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Loading trend themes...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trend Themes</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-3xl">
            Choose the strategic areas TrendMap should monitor before finding sources. Approved themes guide source discovery and keep trend analysis from becoming a pile of narrow snippets.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="rounded-full border border-green-700/60 bg-green-950/30 px-3 py-1">{approvedCount} approved</span>
            <span className="rounded-full border border-amber-700/60 bg-amber-950/30 px-3 py-1">{suggestedCount} awaiting review</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={deriveThemes}
            disabled={isDeriving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={16} />
            {isDeriving ? 'Finding Themes...' : 'Find Themes'}
          </button>
          <button
            type="button"
            onClick={findSources}
            disabled={isFindingSources || approvedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFindingSources ? 'Finding Sources...' : 'Find Sources from Themes'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-indigo-700/60 bg-indigo-900/30 px-4 py-3 text-indigo-100">
          {notice}
        </div>
      )}

      <form onSubmit={addManualTheme} className="mb-8 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus size={18} className="text-purple-300" />
          <h2 className="text-lg font-semibold text-white">Add Manual Theme</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-300">Theme name</span>
            <input
              value={manual.name}
              onChange={(event) => setManual({ ...manual, name: event.target.value })}
              placeholder="Example: Local quick-commerce pressure"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-300">Keywords</span>
            <input
              value={manual.keywords}
              onChange={(event) => setManual({ ...manual, keywords: event.target.value })}
              placeholder="delivery, convenience, quick commerce"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-300">Why it matters</span>
            <input
              value={manual.description}
              onChange={(event) => setManual({ ...manual, description: event.target.value })}
              placeholder="Strategic reason to monitor this area"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500">
            Add Theme
          </button>
        </div>
      </form>

      {themes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/50 py-16 text-center text-gray-400">
          No themes yet. Use Find Themes or add one manually.
        </div>
      ) : (
        <>
          {renderThemeSection('Theme Candidates', 'Review these proposed areas before they guide source discovery.', suggestedThemes)}
          {renderThemeSection('Approved Themes', 'These themes are active and will guide source discovery and trend analysis.', approvedThemes)}
          {rejectedThemes.length > 0 && renderThemeSection('Rejected Themes', 'Rejected themes are kept for audit and can be moved back to review.', rejectedThemes)}
        </>
      )}
    </div>
  );
};

export default TrendThemesScreen;
