import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { packages as initialPackages, regionalPackages as initialRegional, globalPackage as initialGlobal } from '../data/esimPackages';
import type { PackageData, RegionalPackage } from '../data/esimPackages';
import { fetchCountryGroups, type ESIMCountryGroup, type ESIMPackageRaw } from '../services/esimApi';
import { supabase } from '../lib/supabase';

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
      try {
        setPackages(JSON.parse(saved));
      } catch {
        localStorage.removeItem('eydost_esim_data');
      }
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
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
    const init = async () => {
      // Check for pricing updates first
      let versionChanged = false;
      try {
        const { data } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', 'pricing_version')
          .maybeSingle();
        
        const remoteVersion = data?.value || '0';
        const localVersion = localStorage.getItem('eydost_pricing_version');
        
        if (remoteVersion !== localVersion) {
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_TIME_KEY);
          localStorage.setItem('eydost_pricing_version', remoteVersion);
          versionChanged = true;
        }
      } catch (e) {
        console.warn('Pricing version check failed', e);
      }

      const hasCache = loadFromCache();
      // Refresh if no cache, or if version changed, or background refresh if cache exists
      refreshLivePackages(!hasCache || versionChanged);
    };

    init();
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
