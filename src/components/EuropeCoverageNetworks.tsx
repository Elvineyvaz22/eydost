import { useMemo, useState } from 'react';
import { Search, Signal } from 'lucide-react';
import { EUROPE_COVERAGE, EUROPE_COVERAGE_COUNT } from '../data/europeCoverage';
import FlagImage from './FlagImage';
import { countryCodeToFlag } from '../services/esimApi';

function SpeedBadge({ speed }: { speed: '3G' | '4G' | '5G' }) {
  const styles =
    speed === '5G'
      ? 'bg-emerald-100 text-emerald-800'
      : speed === '4G'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${styles}`}>
      {speed}
    </span>
  );
}

export default function EuropeCoverageNetworks() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EUROPE_COVERAGE;
    return EUROPE_COVERAGE.filter(
      c =>
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.networks.some(n => n.name.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Signal className="w-6 h-6 text-blue-600" />
            Network coverage
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {EUROPE_COVERAGE_COUNT} countries · local operators · 4G / 5G where available
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search country or network…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 focus:ring-0 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => (
          <div
            key={c.code}
            className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-7 rounded overflow-hidden shadow-sm flex-shrink-0">
                <FlagImage flag={countryCodeToFlag(c.code)} countryCode={c.code} size="full" />
              </div>
              <p className="font-bold text-gray-900 text-sm">{c.country}</p>
            </div>
            {c.networks.length > 0 ? (
              <ul className="space-y-2">
                {c.networks.map((n, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-700 truncate">{n.name}</span>
                    <SpeedBadge speed={n.speed} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">Covered via regional partners</p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No countries match your search.</p>
      )}
    </section>
  );
}
