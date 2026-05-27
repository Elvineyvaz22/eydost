import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
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

/**
 * A signed-in Supabase user is only treated as an admin if their
 * `app_metadata.role === 'admin'`. `app_metadata` is server-side only —
 * a regular user cannot set or change it (only the service_role can),
 * so this check is safe even if public signups are enabled.
 *
 * To grant admin, run in Supabase SQL Editor:
 *   update auth.users
 *   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
 *   where email = 'you@example.com';
 */
function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const meta = user.app_metadata as Record<string, unknown> | undefined;
  return meta?.role === 'admin';
}

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
      const user = sessionData.session?.user ?? null;
      if (user && isAdminUser(user)) {
        setIsAuthenticated(true);
      } else {
        if (sessionData.session) {
          // Authed but not an admin → kill the session so the SPA does not
          // hold a stale token that could be abused.
          await supabase.auth.signOut();
        }
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

      if (data.session && isAdminUser(data.user)) {
        localStorage.setItem('eydost_admin_session', 'active');
        setIsAuthenticated(true);
        return true;
      }
      // Valid Supabase credentials but the user is not an admin — sign them
      // back out and reject the attempt.
      await supabase.auth.signOut();
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
