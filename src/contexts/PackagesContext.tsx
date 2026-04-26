import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { packages as initialPackages, regionalPackages as initialRegional, globalPackage as initialGlobal } from '../data/esimPackages';
import type { PackageData, RegionalPackage } from '../data/esimPackages';

interface PackagesContextType {
  packages: PackageData[];
  regionalPackages: RegionalPackage[];
  globalPackage: RegionalPackage;
  updatePackages: (newPackages: PackageData[]) => void;
}

const PackagesContext = createContext<PackagesContextType | undefined>(undefined);

export function PackagesProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<PackageData[]>(initialPackages);
  const [regionalPackages] = useState<RegionalPackage[]>(initialRegional);
  const [globalPackage] = useState<RegionalPackage>(initialGlobal);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eydost_esim_data');
    if (saved) {
      try {
        setPackages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }
  }, []);

  const updatePackages = (newPackages: PackageData[]) => {
    setPackages(newPackages);
    localStorage.setItem('eydost_esim_data', JSON.stringify(newPackages));
  };

  return (
    <PackagesContext.Provider value={{ packages, regionalPackages, globalPackage, updatePackages }}>
      {children}
    </PackagesContext.Provider>
  );
}

export function usePackages() {
  const context = useContext(PackagesContext);
  if (context === undefined) {
    throw new Error('usePackages must be used within a PackagesProvider');
  }
  return context;
}
