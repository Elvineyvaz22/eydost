import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { packages as initialPackages, regionalPackages as initialRegional, globalPackage as initialGlobal } from '../data/esimPackages';
import type { PackageData, RegionalPackage } from '../data/esimPackages';
import type { ESIMCountryGroup, ESIMPackageRaw } from '../services/esimApi';
import { countryCodeToFlag, getCountryName } from '../services/esimApi';

interface PackagesContextType {
  // Legacy static packages (for admin editor compatibility)
  packages: PackageData[];
  regionalPackages: RegionalPackage[];
  globalPackage: RegionalPackage;
  updatePackages: (newPackages: PackageData[]) => void;

  // Live API packages
  liveCountryGroups: ESIMCountryGroup[];
  liveRegionalPackages: ESIMPackageRaw[];
  liveLoading: boolean;
  liveError: string | null;
  refreshLivePackages: () => Promise<void>;
}

const PackagesContext = createContext<PackagesContextType | undefined>(undefined);

export function PackagesProvider({ children }: { children: ReactNode }) {
  // ── Static (admin-editable) data ──────────────────────────────────────────
  // Note: source of truth is `src/data/esimPackages.ts` (static) + Supabase live
  // prices. We intentionally do NOT read from localStorage anymore because a
  // stale admin editor snapshot was masking the full country list (e.g. Germany
  // disappearing). Admin EsimEditor edits stay in-memory only.
  const [packages, setPackages] = useState<PackageData[]>(initialPackages);
  const [regionalPackages] = useState<RegionalPackage[]>(initialRegional);
  const [globalPackage] = useState<RegionalPackage>(initialGlobal);

  useEffect(() => {
    try {
      localStorage.removeItem('eydost_esim_data');
    } catch {
      /* ignore */
    }
  }, []);

  const updatePackages = (newPackages: PackageData[]) => {
    setPackages(newPackages);
  };

  // ── Live API data ─────────────────────────────────────────────────────────
  const [liveCountryGroups] = useState<ESIMCountryGroup[]>([]);
  const [liveRegionalPackages] = useState<ESIMPackageRaw[]>([]);
  const [liveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  const refreshLivePackages = async () => {
    // Live API loads packages per-country on demand via fetchPublicPackagesForCountry
  };

  useEffect(() => {
    // Live API active — loads from bot.eydost.az/api/public/packages
    setLiveLoading(false);
  }, []);

  return (
    <PackagesContext.Provider value={{
      packages, regionalPackages, globalPackage, updatePackages,
      liveCountryGroups, liveRegionalPackages, liveLoading, liveError,
      refreshLivePackages,
    }}>
      {children}
    </PackagesContext.Provider>
  );
}

export function usePackages() {
  const context = useContext(PackagesContext);
  if (context === undefined) throw new Error('usePackages must be used within a PackagesProvider');
  return context;
}

// Re-export for convenience
export { countryCodeToFlag, getCountryName };