import { useState } from 'react';
import { Search } from 'lucide-react';
import { repository } from './repository';
import type { SemanticSearchResult } from './types';

export default function SemanticSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResults(await repository.searchSemantic(query.trim(), undefined, undefined, 12));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Semantic Search</h1>
        <p className="text-gray-400 mt-2">Search trends, signals, documents, and sources by meaning.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <label className="sr-only" htmlFor="semantic-query">Search query</label>
        <input
          id="semantic-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }}
          className="flex-1 bg-[#18182c] border border-[#2f2f52] rounded-lg px-4 py-3 text-white placeholder:text-gray-500"
          placeholder="Search for signals about AI grocery discovery"
        />
        <button
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-medium"
        >
          <Search size={18} />
          {loading ? 'Searching' : 'Search'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <article key={`${result.entityType}-${result.entityId}`} className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-purple-300">{result.entityType}</p>
                <h2 className="text-lg font-semibold text-white">{result.metadata.title || result.entityId}</h2>
              </div>
              <span className="text-sm text-gray-300">{Math.round(result.relevanceScore * 100)}%</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{result.evidenceSnippet}</p>
          </article>
        ))}
        {!loading && results.length === 0 && (
          <div className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-8 text-gray-400">
            No search results yet.
          </div>
        )}
      </div>
    </div>
  );
}
