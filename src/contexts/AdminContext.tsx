import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  siteContent?: Record<string, any>;
  refreshContent: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<Record<string, any>>({});

  useEffect(() => {
    checkAuth();
    loadContent();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for local hardcoded session first
      const localSession = localStorage.getItem('eydost_admin_session');
      if (localSession === 'active') {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    const cleanUsername = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Hardcoded credentials
    if (cleanUsername === 'elvineyvaz' && cleanPassword === 'Elvin7636.') {
      setIsAuthenticated(true);
      localStorage.setItem('eydost_admin_session', 'active');
      return true;
    }

    try {
      // Fallback to Supabase if configured
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadContent = async () => {
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
      console.error('Error loading content:', error);
    }
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, isLoading, login, logout, siteContent, refreshContent: loadContent }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
