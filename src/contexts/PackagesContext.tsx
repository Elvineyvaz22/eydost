import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { packages as initialPackages, regionalPackages as initialRegional, globalPackage as initialGlobal } from '../data/esimPackages';
import type { PackageData, RegionalPackage } from '../data/esimPackages';
import { fetchCountryGroups, type ESIMCountryGroup, type ESIMPackageRaw } from '../services/esimApi';

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
  const [packages, setPackages] = useState<PackageData[]>(initialPackages);
  const [regionalPackages] = useState<RegionalPackage[]>(initialRegional);
  const [globalPackage] = useState<RegionalPackage>(initialGlobal);

  useEffect(() => {
    const saved = localStorage.getItem('eydost_esim_data');
    if (saved) {
      try { setPackages(JSON.parse(saved)); } catch {}
    }
  }, []);

  const updatePackages = (newPackages: PackageData[]) => {
    setPackages(newPackages);
    localStorage.setItem('eydost_esim_data', JSON.stringify(newPackages));
  };

  // ── Live API data ──────────────────────────────────────────────────────────
  const [liveCountryGroups, setLiveCountryGroups] = useState<ESIMCountryGroup[]>([]);
  const [liveRegionalPackages, setLiveRegionalPackages] = useState<ESIMPackageRaw[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  const refreshLivePackages = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const { countryGroups, regionalPackages: regional } = await fetchCountryGroups();
      setLiveCountryGroups(countryGroups);
      setLiveRegionalPackages(regional);
    } catch (err: any) {
      console.warn('Live packages unavailable, using static data:', err.message);
      setLiveError(err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    refreshLivePackages();
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
