import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PedagogicalSettings {
  id: string;
  creche_id: string;
  boletim_ativo: boolean;
  relatorio_desempenho_ativo: boolean;
  gestao_materias_ativo: boolean;
  grade_aulas_ativo: boolean;
  atividades_avaliacoes_ativo: boolean;
  modulo_secretaria_ativo: boolean;
}

export function usePedagogicalSettings(overrideCrecheId?: string) {
  const { userCreche } = useAuth();
  const [settings, setSettings] = useState<PedagogicalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const effectiveCrecheId = overrideCrecheId || userCreche?.id;

  const fetchSettings = async () => {
    if (!effectiveCrecheId) { setSettings(null); setLoading(false); return; }
    
    const { data } = await supabase
      .from('configuracoes_pedagogicas')
      .select('*')
      .eq('creche_id', effectiveCrecheId)
      .maybeSingle();
    
    setSettings(data as PedagogicalSettings | null);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, [effectiveCrecheId]);

  const updateSettings = async (updates: Partial<PedagogicalSettings>) => {
    if (!effectiveCrecheId) return { error: new Error('No creche') };

    if (settings) {
      const { error } = await supabase
        .from('configuracoes_pedagogicas')
        .update(updates)
        .eq('id', settings.id);
      if (!error) await fetchSettings();
      return { error };
    } else {
      const { error } = await supabase
        .from('configuracoes_pedagogicas')
        .insert({ creche_id: effectiveCrecheId, ...updates });
      if (!error) await fetchSettings();
      return { error };
    }
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
