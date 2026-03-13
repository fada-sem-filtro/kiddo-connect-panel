import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EventoDb {
  id: string;
  tipo: string;
  crianca_id: string;
  observacao: string | null;
  data_inicio: string;
  data_fim: string | null;
  educador_user_id: string | null;
  created_at: string;
  crianca_nome?: string;
  turma_nome?: string;
  // New fields
  tipo_refeicao?: string | null;
  resultado_refeicao?: string | null;
  tipo_higiene?: string | null;
  nome_medicamento?: string | null;
  dosagem?: string | null;
  horario_administracao?: string | null;
  administrado?: boolean;
  horario_administrado?: string | null;
  authorized_person_id?: string | null;
  authorized_person_name?: string | null;
}

interface CreateEventoInput {
  tipo: string;
  crianca_id: string;
  observacao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
}

export function useEventos(options?: { date?: Date; criancaId?: string }) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoDb[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("eventos")
      .select("*, criancas(nome, turmas(nome)), authorized_pickups(nome)")
      .order("data_inicio", { ascending: true });

    if (options?.date) {
      const start = new Date(options.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(options.date);
      end.setHours(23, 59, 59, 999);
      query = query.gte("data_inicio", start.toISOString()).lte("data_inicio", end.toISOString());
    }

    if (options?.criancaId && options.criancaId !== "all") {
      query = query.eq("crianca_id", options.criancaId);
    }

    const { data, error } = await query;

    if (data) {
      const mapped = data.map((e: any) => ({
        ...e,
        crianca_nome: e.criancas?.nome || "Desconhecido",
        turma_nome: e.criancas?.turmas?.nome || "",
        authorized_person_name: e.authorized_pickups?.nome || null,
      }));
      setEventos(mapped);
    }
    if (error) console.error("Error fetching eventos:", error);
    setLoading(false);
  }, [options?.date?.toDateString(), options?.criancaId]);

  useEffect(() => {
    if (user) fetchEventos();
  }, [user, fetchEventos]);

  const createEvento = async (input: CreateEventoInput) => {
    const { error } = await supabase.from("eventos").insert({
      tipo: input.tipo,
      crianca_id: input.crianca_id,
      observacao: input.observacao || null,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim || null,
      educador_user_id: user?.id || null,
    });
    if (error) throw error;
    await fetchEventos();
  };

  const createEventoTurma = async (turmaId: string, input: Omit<CreateEventoInput, "crianca_id">) => {
    const { data: criancas } = await supabase.from("criancas").select("id").eq("turma_id", turmaId);

    if (!criancas || criancas.length === 0) throw new Error("Nenhuma criança na turma");

    const rows = criancas.map((c) => ({
      tipo: input.tipo,
      crianca_id: c.id,
      observacao: input.observacao || null,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim || null,
      educador_user_id: user?.id || null,
    }));

    const { error } = await supabase.from("eventos").insert(rows);
    if (error) throw error;
    await fetchEventos();
  };

  const deleteEvento = async (id: string) => {
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) throw error;
    await fetchEventos();
  };

  const confirmMedicamento = async (id: string) => {
    const { error } = await supabase
      .from("eventos")
      .update({
        administrado: true,
        horario_administrado: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    await fetchEventos();
  };

  return { eventos, loading, fetchEventos, createEvento, createEventoTurma, deleteEvento, confirmMedicamento };
}
