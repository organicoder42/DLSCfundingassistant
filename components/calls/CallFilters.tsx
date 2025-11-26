'use client';

import { Source, CallType } from '@/types';
import { translateSource, translateCallType } from '@/lib/utils';

interface CallFiltersProps {
  filters: {
    source?: Source[];
    type?: CallType[];
    sectors?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  onFilterChange: (filters: any) => void;
}

const ALL_SOURCES: Source[] = ['DLSC', 'INNOVATIONSFONDEN', 'EUHORIZEN', 'EIC', 'EUROSTARS', 'ERHVERVSSTYRELSEN', 'OTHER'];
const ALL_TYPES: CallType[] = ['GRANT', 'LOAN', 'EQUITY', 'VOUCHER', 'PRIZE', 'OTHER'];
const SECTORS = ['biotech', 'medtech', 'pharma', 'welfare_tech', 'digital_health'];

export default function CallFilters({ filters, onFilterChange }: CallFiltersProps) {
  const toggleSource = (source: Source) => {
    const currentSources = filters.source || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];

    onFilterChange({ ...filters, source: newSources.length > 0 ? newSources : undefined });
  };

  const toggleType = (type: CallType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    onFilterChange({ ...filters, type: newTypes.length > 0 ? newTypes : undefined });
  };

  const toggleSector = (sector: string) => {
    const currentSectors = filters.sectors || [];
    const newSectors = currentSectors.includes(sector)
      ? currentSectors.filter(s => s !== sector)
      : [...currentSectors, sector];

    onFilterChange({ ...filters, sectors: newSectors.length > 0 ? newSectors : undefined });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = filters.source?.length || filters.type?.length || filters.sectors?.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filtre</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Ryd alle
          </button>
        )}
      </div>

      {/* Source Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Kilde</h4>
        <div className="space-y-2">
          {ALL_SOURCES.map(source => (
            <label key={source} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.source?.includes(source) || false}
                onChange={() => toggleSource(source)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                {translateSource(source)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Type</h4>
        <div className="space-y-2">
          {ALL_TYPES.map(type => (
            <label key={type} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.type?.includes(type) || false}
                onChange={() => toggleType(type)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                {translateCallType(type)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sector Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Sektor</h4>
        <div className="space-y-2">
          {SECTORS.map(sector => (
            <label key={sector} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sectors?.includes(sector) || false}
                onChange={() => toggleSector(sector)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600 capitalize">
                {sector.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
