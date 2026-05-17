import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Signal } from 'lucide-react';
import { EUROPE_COVERAGE, EUROPE_COVERAGE_COUNT } from '../data/europeCoverage';
import FlagImage from './FlagImage';
import { countryCodeToFlag } from '../services/esimApi';

const PREVIEW_CODES = ['DE', 'FR', 'IT', 'ES', 'GB', 'NL', 'AT', 'PL'];

function SpeedBadge({ speed }: { speed: '3G' | '4G' | '5G' }) {
  const styles =
    speed === '5G'
      ? 'bg-emerald-100 text-emerald-800'
      : speed === '4G'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${styles}`}>
      {speed}
    </span>
  );
}

export default function EuropeCoverageNetworks() {
  const [expanded, setExpanded] = useState(false);
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
    <section className="mb-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Compact header — always visible */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Signal className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm sm:text-base">
              {EUROPE_COVERAGE_COUNT} countries · 4G / 5G networks
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Vodafone, Orange, O2, TIM, Tele2, KPN & more
            </p>
          </div>
          <div className="hidden sm:flex gap-1 flex-shrink-0">
            {PREVIEW_CODES.map(code => (
              <div
                key={code}
                className="w-8 h-6 rounded overflow-hidden shadow-sm border border-white"
              >
                <FlagImage flag={countryCodeToFlag(code)} countryCode={code} size="full" />
              </div>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 flex-shrink-0">
            {expanded ? (
              <>
                Hide <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View all <ChevronDown className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {/* Expanded list — scrollable, compact */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 sm:px-5 pb-4 pt-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country or operator…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div className="max-h-[min(360px,50vh)] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filtered.map(c => (
                <div
                  key={c.code}
                  className="flex gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="w-9 h-6 rounded overflow-hidden flex-shrink-0 mt-0.5">
                    <FlagImage flag={countryCodeToFlag(c.code)} countryCode={c.code} size="full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{c.country}</p>
                    {c.networks.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {c.networks.map((n, i) => (
                          <li key={i} className="flex items-center justify-between gap-1">
                            <span className="text-[11px] text-gray-600 truncate">{n.name}</span>
                            <SpeedBadge speed={n.speed} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-0.5">Regional coverage</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-6 text-xs">No match.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
