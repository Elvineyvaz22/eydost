import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';

type Language = 'en' | 'az' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  refreshContent: () => Promise<void>;
  brand?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [siteContent, setSiteContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSiteContent();
  }, []);

  const loadSiteContent = async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value');

      if (data) {
        const contentMap: Record<string, any> = {};
        data.forEach(item => {
          contentMap[item.key] = item.value;
        });
        setSiteContent(contentMap);
      }
    } catch (error) {
      console.error('Error loading site content:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergeContent = (base: any, override: any): any => {
    if (!override) return base;
    if (typeof base !== 'object' || typeof override !== 'object') return override;

    const result = { ...base };
    Object.keys(override).forEach(key => {
      if (typeof override[key] === 'object' && !Array.isArray(override[key]) && override[key] !== null) {
        result[key] = mergeContent(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    });
    return result;
  };

  const getTranslations = () => {
    let baseTranslations = translations[language];

    if (Object.keys(siteContent).length > 0) {
      const contentOverride: any = {};

      if (siteContent.hero) {
        contentOverride.hero = siteContent.hero;
      }
      if (siteContent.brand) {
        contentOverride.brand = siteContent.brand;
      }
      if (siteContent.footer) {
        contentOverride.footer = siteContent.footer;
      }
      if (siteContent.sections) {
        Object.assign(contentOverride, siteContent.sections);
      }
      if (siteContent.futureModules) {
        contentOverride.futureModules = siteContent.futureModules;
      }
      if (siteContent.translations && siteContent.translations[language]) {
        baseTranslations = mergeContent(baseTranslations, siteContent.translations[language]);
      }

      baseTranslations = mergeContent(baseTranslations, contentOverride);
    }

    return baseTranslations;
  };

  const value = {
    language,
    setLanguage,
    t: loading ? translations[language] : getTranslations(),
    refreshContent: loadSiteContent,
    brand: siteContent.brand as any,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
