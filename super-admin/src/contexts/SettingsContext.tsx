import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

export interface OrgProfile { name: string; contact_email?: string; contact_phone?: string; }
export interface Branding { logo_url?: string; primary_color?: string; }
export interface Settings {
  orgProfile: OrgProfile;
  branding: Branding;
}

const defaultSettings: Settings = {
  orgProfile: { name: 'BezAssetTracker' },
  branding: { primary_color: '#1e6cbf', logo_url: '/branding/bez-logo.png' },
};

interface SettingsContextValue {
  org: string;
  settings: Settings;
  setOrgProfile: (p: OrgProfile) => void;
  setBranding: (b: Branding) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function key(org: string) { return `bez-settings-${org}`; }

export function SettingsProvider({ org, children }: { org: string; children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  useEffect(()=> {
    const raw = localStorage.getItem(key(org));
    if (raw) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(raw) }); } catch { setSettings(defaultSettings); }
    } else setSettings(defaultSettings);
  }, [org]);
  useEffect(()=> { localStorage.setItem(key(org), JSON.stringify(settings)); }, [org, settings]);
  const value = useMemo<SettingsContextValue>(()=> ({
    org, settings,
    setOrgProfile: (p)=> setSettings((s)=> ({ ...s, orgProfile: { ...s.orgProfile, ...p } })),
    setBranding: (b)=> setSettings((s)=> ({ ...s, branding: { ...s.branding, ...b } })),
  }), [org, settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('SettingsContext not found');
  return ctx;
}
