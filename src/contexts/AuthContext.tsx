import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Role = 'admin' | 'technician' | 'superadmin';

export interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role: Role;
  technician_id?: string;
}

interface AuthContextValue {
  org: string;
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function key(org: string) {
  return `bez-auth-${org}`;
}

export function AuthProvider({ org, children }: { org: string; children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(key(org));
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    } else {
      if (org === 'demo-org') {
        setUser({ id: `demo_admin_${Date.now()}`, email: `demo@${org}`, role: 'admin', name: 'Demo Admin' });
      } else {
        setUser(null);
      }
    }
  }, [org]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser((prev) => (prev ? { ...prev, email: session.user.email || prev.email } : prev));
      }
    });
    return () => { try { sub?.subscription.unsubscribe(); } catch {} };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(key(org), JSON.stringify(user));
    else localStorage.removeItem(key(org));
  }, [org, user]);

  const value = useMemo<AuthContextValue>(() => ({
    org,
    user,
    login: (u) => setUser(u),
    logout: () => setUser(null),
  }), [org, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}
