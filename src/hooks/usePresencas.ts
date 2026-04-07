import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface Presenca {
  id: string;
  crianca_id: string;
  data: string;
  status: 'ausente' | 'presente' | 'saiu';
  hora_chegada: string | null;
  hora_saida: string | null;
  educador_user_id: string | null;
  observacao: string | null;
  pickup_person_id: string | null;
  pickup_person_name: string | null;
  pickup_person_type: string | null;
  pickup_registered_by: string | null;
}

export function usePresencas(date: Date) {
  const { user } = useAuth();
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(true);
  const dataStr = format(date, 'yyyy-MM-dd');

  const fetchPresencas = useCallback(async () => {
    const { data } = await supabase
      .from('presencas')
      .select('*')
      .eq('data', dataStr);
    setPresencas((data as Presenca[]) || []);
    setLoading(false);
  }, [dataStr]);

  useEffect(() => {
    fetchPresencas();
    
    // Realtime subscription
    const channel = supabase
      .channel(`presencas-${dataStr}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presencas',
        filter: `data=eq.${dataStr}`,
      }, () => {
        fetchPresencas();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dataStr, fetchPresencas]);

  const marcarPresenca = async (criancaId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('presencas')
      .upsert({
        crianca_id: criancaId,
        data: dataStr,
        status: 'presente',
        hora_chegada: now,
        educador_user_id: user?.id,
      }, { onConflict: 'crianca_id,data' });
    if (!error) await fetchPresencas();
    return { error };
  };

  const registrarSaida = async (criancaId: string, pickupData?: {
    pickup_person_id: string;
    pickup_person_name: string;
    pickup_person_type: string;
    pickup_registered_by: string;
  }) => {
    const now = new Date().toISOString();
    const updatePayload: { status: string; hora_saida: string; pickup_person_id?: string; pickup_person_name?: string; pickup_person_type?: string; pickup_registered_by?: string } = { status: 'saiu', hora_saida: now };
    if (pickupData) {
      updatePayload.pickup_person_id = pickupData.pickup_person_id;
      updatePayload.pickup_person_name = pickupData.pickup_person_name;
      updatePayload.pickup_person_type = pickupData.pickup_person_type;
      updatePayload.pickup_registered_by = pickupData.pickup_registered_by;
    }
    const { error } = await supabase
      .from('presencas')
      .update(updatePayload)
      .eq('crianca_id', criancaId)
      .eq('data', dataStr);
    if (!error) await fetchPresencas();
    return { error };
  };

  const getPresenca = (criancaId: string): Presenca | undefined => {
    return presencas.find(p => p.crianca_id === criancaId);
  };

  return { presencas, loading, marcarPresenca, registrarSaida, getPresenca, fetchPresencas };
}
