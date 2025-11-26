'use client';

import { useState, useEffect } from 'react';
import { Source, CallType, FundingCall, CallsResponse } from '@/types';
import CallList from '@/components/calls/CallList';
import CallFilters from '@/components/calls/CallFilters';

export default function CallsPage() {
  const [calls, setCalls] = useState<FundingCall[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    source?: Source[];
    type?: CallType[];
    sectors?: string[];
  }>({});

  // Fetch calls from API
  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query string
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filters.source) filters.source.forEach(s => params.append('source', s));
        if (filters.type) filters.type.forEach(t => params.append('type', t));
        if (filters.sectors) filters.sectors.forEach(s => params.append('sector', s));
        params.append('page', page.toString());
        params.append('limit', '12');

        const response = await fetch(`/api/calls?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch calls');
        }

        const data: CallsResponse = await response.json();
        setCalls(data.calls);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [search, filters, page]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Funding Calls
          </h1>
          <p className="text-gray-600">
            Browse aktuelle funding muligheder fra danske og EU kilder
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg efter funding calls..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Søg
            </button>
          </div>
        </form>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <CallFilters filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {loading ? (
                  'Indlæser...'
                ) : (
                  <>
                    Viser <span className="font-semibold">{calls.length}</span> af{' '}
                    <span className="font-semibold">{total}</span> calls
                  </>
                )}
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Call List */}
            {!loading && <CallList calls={calls} />}

            {/* Pagination */}
            {!loading && pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forrige
                </button>

                <span className="px-4 py-2 text-gray-700">
                  Side {page} af {pages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Næste
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
