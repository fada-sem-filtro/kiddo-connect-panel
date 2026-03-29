import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarConfig, getDefaultConfig } from '@/lib/sidebar-defaults';

export function useSidebarConfig() {
  const { role, userCreche } = useAuth();
  const [config, setConfig] = useState<SidebarConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role || role === 'admin' || !userCreche?.id) {
      setConfig(null);
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      const { data } = await supabase
        .from('sidebar_config')
        .select('config')
        .eq('creche_id', userCreche.id)
        .eq('perfil', role)
        .maybeSingle();

      if (data?.config) {
        setConfig(data.config as unknown as SidebarConfig);
      } else {
        setConfig(null); // use defaults
      }
      setLoading(false);
    };

    fetchConfig();
  }, [role, userCreche?.id]);

  return { config, loading };
}

export function useAdminSidebarConfig(crecheId: string, perfil: string) {
  const [config, setConfig] = useState<SidebarConfig>(getDefaultConfig(perfil));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!crecheId || !perfil) {
      setConfig(getDefaultConfig(perfil));
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sidebar_config')
        .select('config')
        .eq('creche_id', crecheId)
        .eq('perfil', perfil)
        .maybeSingle();

      if (data?.config) {
        setConfig(data.config as unknown as SidebarConfig);
      } else {
        setConfig(getDefaultConfig(perfil));
      }
      setLoading(false);
    };

    fetchConfig();
  }, [crecheId, perfil]);

  const saveConfig = async () => {
    if (!crecheId || !perfil) return;
    setSaving(true);

    const { error } = await supabase
      .from('sidebar_config')
      .upsert(
        [{ creche_id: crecheId, perfil, config: JSON.parse(JSON.stringify(config)) }],
        { onConflict: 'creche_id,perfil' }
      );

    setSaving(false);
    return !error;
  };

  return { config, setConfig, loading, saving, saveConfig };
}
