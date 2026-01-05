import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface OrgProfile {
  name: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Branding {
  logo_url?: string;
  primary_color?: string;
}

export interface AssetsConfig {
  require_image?: boolean;
  default_status?: 'available' | 'checked_out' | 'maintenance';
  tag_prefix?: string;
}

export interface NFCConfig {
  payload_format?: 'json' | 'text';
  tag_prefix?: string;
}

export interface CheckWorkflow {
  default_due_days?: number;
  require_client?: boolean;
  allow_manual_entry?: boolean;
}

export interface Notifications {
  email_enabled?: boolean;
  push_enabled?: boolean;
}

export interface Settings {
  orgProfile: OrgProfile;
  branding: Branding;
  assets: AssetsConfig;
  nfc: NFCConfig;
  check: CheckWorkflow;
  notifications: Notifications;
  billing: {
    technician_seats: number;
    enable_self_add_technician: boolean;
    support_email: string;
    app_links: { android_url?: string; ios_url?: string; web_url?: string };
  };
}

const defaultSettings: Settings = {
  orgProfile: { name: 'Organization' },
  branding: { primary_color: '#0ea5e9', logo_url: '/branding/bez-asset-logo.svg' },
  assets: { require_image: false, default_status: 'available', tag_prefix: 'AST-' },
  nfc: { payload_format: 'json', tag_prefix: 'AST-' },
  check: { default_due_days: 7, require_client: true, allow_manual_entry: true },
  notifications: { email_enabled: false, push_enabled: false },
  billing: {
    technician_seats: 0,
    enable_self_add_technician: false,
    support_email: 'support@example.com',
    app_links: {
      android_url: 'https://play.google.com/store/apps/details?id=com.example.techapp',
      ios_url: 'https://apps.apple.com/app/id0000000000',
      web_url: typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
    },
  },
};

interface SettingsContextValue {
  org: string;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  setOrgProfile: (p: OrgProfile) => void;
  setBranding: (b: Branding) => void;
  setAssetsConfig: (a: AssetsConfig) => void;
  setNfcConfig: (n: NFCConfig) => void;
  setCheckWorkflow: (c: CheckWorkflow) => void;
  setNotifications: (n: Notifications) => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  setBilling: (b: Partial<Settings['billing']>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function key(org: string) {
  return `bez-settings-${org}`;
}

export function SettingsProvider({ org, children }: { org: string; children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const raw = localStorage.getItem(key(org));
    if (raw) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      } catch {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
  }, [org]);

  useEffect(() => {
    localStorage.setItem(key(org), JSON.stringify(settings));
  }, [org, settings]);

  const value = useMemo<SettingsContextValue>(() => ({
    org,
    settings,
    update: (patch) => setSettings((s) => ({ ...s, ...patch })),
    setOrgProfile: (p) => setSettings((s) => ({ ...s, orgProfile: { ...s.orgProfile, ...p } })),
    setBranding: (b) => setSettings((s) => ({ ...s, branding: { ...s.branding, ...b } })),
    setAssetsConfig: (a) => setSettings((s) => ({ ...s, assets: { ...s.assets, ...a } })),
    setNfcConfig: (n) => setSettings((s) => ({ ...s, nfc: { ...s.nfc, ...n } })),
    setCheckWorkflow: (c) => setSettings((s) => ({ ...s, check: { ...s.check, ...c } })),
    setNotifications: (n) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, ...n } })),
    exportJSON: () => JSON.stringify(settings, null, 2),
    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
        setSettings({ ...defaultSettings, ...parsed });
        return true;
      } catch {
        return false;
      }
    },
    setBilling: (b) => setSettings((s) => ({ ...s, billing: { ...s.billing, ...b } })),
  }), [org, settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('SettingsContext not found');
  return ctx;
}
