import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  siteContent?: Record<string, unknown>;
  refreshContent: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<Record<string, unknown>>({});

  useEffect(() => {
    checkAuth();
    loadContent();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('eydost_admin_session');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail.trim(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        localStorage.setItem('eydost_admin_session', 'active');
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
      localStorage.removeItem('eydost_admin_session');
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
        const contentMap: Record<string, unknown> = {};
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
