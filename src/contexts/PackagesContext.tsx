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

  const CACHE_KEY = 'eydost_live_packages';
  const CACHE_TIME_KEY = 'eydost_live_packages_time';
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  const loadFromCache = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedData && cachedTime) {
      const now = Date.now();
      if (now - parseInt(cachedTime) < CACHE_DURATION) {
        try {
          const parsed = JSON.parse(cachedData);
          setLiveCountryGroups(parsed.countryGroups || []);
          setLiveRegionalPackages(parsed.regional || []);
          setLiveLoading(false);
          return true;
        } catch (e) {
          console.error('Failed to parse cached live data', e);
        }
      }
    }
    return false;
  };

  const refreshLivePackages = async (silent = false) => {
    if (!silent) setLiveLoading(true);
    setLiveError(null);
    try {
      const { countryGroups, regionalPackages: regional } = await fetchCountryGroups();
      setLiveCountryGroups(countryGroups);
      setLiveRegionalPackages(regional);
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({ countryGroups, regional }));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (err: any) {
      console.warn('Live packages unavailable:', err.message);
      setLiveError(err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    // const hasCache = loadFromCache();
    // Even if we have cache, refresh in background if it's been a while 
    // or if we have NO cache at all.
    // refreshLivePackages(!hasCache); 
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
