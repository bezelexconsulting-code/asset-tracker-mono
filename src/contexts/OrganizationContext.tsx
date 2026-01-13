import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

interface OrgCtx {
  orgSlug: string;
  orgId: string | null;
  brandingLogoUrl?: string | null;
  brandingPrimaryColor?: string | null;
  loading: boolean;
}

const OrganizationContext = createContext<OrgCtx>({ orgSlug: '', orgId: null, loading: true });

export function useOrganization() {
  return useContext(OrganizationContext);
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { org } = useParams();
  const orgSlug = org || '';
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!SUPABASE_CONFIGURED || !orgSlug) { setOrgId(null); setLoading(false); return; }
      const { data, error } = await supabase.from('organizations').select('id, branding_logo_url, branding_primary_color').eq('slug', orgSlug).limit(1);
      if (!mounted) return;
      const row = error ? null : (data?.[0] || null);
      setOrgId(row?.id || null);
      setBrandingLogoUrl(row?.branding_logo_url || null);
      setBrandingPrimaryColor(row?.branding_primary_color || null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [orgSlug]);

  return (
    <OrganizationContext.Provider value={{ orgSlug, orgId, brandingLogoUrl, brandingPrimaryColor, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
}
