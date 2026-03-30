import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AtividadeOpcao {
  id: string;
  questao_id: string;
  texto: string;
  is_correta: boolean;
  ordem: number;
}

export interface AtividadeQuestao {
  id: string;
  atividade_id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  imagem_url: string | null;
  ordem: number;
  pontuacao: number | null;
  opcoes?: AtividadeOpcao[];
}

export interface AtividadePedagogica {
  id: string;
  titulo: string;
  descricao: string | null;
  turma_id: string;
  educador_user_id: string;
  data_entrega: string;
  tipo: string;
  instrucoes: string | null;
  created_at: string;
  updated_at: string;
  questoes?: AtividadeQuestao[];
  turma_nome?: string;
}

export interface AtividadeEntrega {
  id: string;
  atividade_id: string;
  aluno_crianca_id: string;
  status: string;
  nota: number | null;
  feedback_educador: string | null;
  created_at: string;
  updated_at: string;
  crianca_nome?: string;
}

export interface AtividadeResposta {
  id: string;
  entrega_id: string;
  questao_id: string;
  resposta_texto: string | null;
  opcao_selecionada_id: string | null;
  foto_url: string | null;
}

export function useAtividades(turmaId?: string, tipo?: string) {
  const [atividades, setAtividades] = useState<AtividadePedagogica[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAtividades = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('atividades_pedagogicas')
      .select('*, turmas(nome)')
      .order('data_entrega', { ascending: false });

    if (turmaId) query = query.eq('turma_id', turmaId);
    if (tipo) query = query.eq('tipo', tipo);

    const { data } = await query;
    if (data) {
      setAtividades(data.map((a: any) => ({
        ...a,
        turma_nome: a.turmas?.nome,
      })));
    }
    setLoading(false);
  }, [turmaId, tipo]);

  useEffect(() => { fetchAtividades(); }, [fetchAtividades]);

  return { atividades, loading, refetch: fetchAtividades };
}

export function useAtividadeDetail(atividadeId: string | null) {
  const [atividade, setAtividade] = useState<AtividadePedagogica | null>(null);
  const [questoes, setQuestoes] = useState<AtividadeQuestao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!atividadeId) { setLoading(false); return; }
    setLoading(true);

    const { data: atv } = await supabase
      .from('atividades_pedagogicas')
      .select('*, turmas(nome)')
      .eq('id', atividadeId)
      .single();

    if (atv) {
      setAtividade({ ...atv, turma_nome: (atv as any).turmas?.nome } as AtividadePedagogica);
    }

    const { data: questoesData } = await supabase
      .from('atividade_questoes')
      .select('*')
      .eq('atividade_id', atividadeId)
      .order('ordem');

    if (questoesData) {
      const questoesWithOpcoes = await Promise.all(
        questoesData.map(async (q: any) => {
          if (q.tipo === 'multipla_escolha') {
            const { data: opcoes } = await supabase
              .from('atividade_opcoes')
              .select('*')
              .eq('questao_id', q.id)
              .order('ordem');
            return { ...q, opcoes: opcoes || [] };
          }
          return { ...q, opcoes: [] };
        })
      );
      setQuestoes(questoesWithOpcoes);
    }

    setLoading(false);
  }, [atividadeId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { atividade, questoes, loading, refetch: fetchDetail };
}

export function useEntregas(atividadeId: string | null) {
  const [entregas, setEntregas] = useState<AtividadeEntrega[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = useCallback(async () => {
    if (!atividadeId) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from('atividade_entregas')
      .select('*, criancas(nome)')
      .eq('atividade_id', atividadeId)
      .order('created_at', { ascending: false });

    if (data) {
      setEntregas(data.map((e: any) => ({
        ...e,
        crianca_nome: e.criancas?.nome,
      })));
    }
    setLoading(false);
  }, [atividadeId]);

  useEffect(() => { fetchEntregas(); }, [fetchEntregas]);

  return { entregas, loading, refetch: fetchEntregas };
}

export function useAlunoEntregas(criancaId: string | null) {
  const [entregas, setEntregas] = useState<(AtividadeEntrega & { atividade?: AtividadePedagogica })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = useCallback(async () => {
    if (!criancaId) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from('atividade_entregas')
      .select('*, atividades_pedagogicas(*, turmas(nome))')
      .eq('aluno_crianca_id', criancaId)
      .order('created_at', { ascending: false });

    if (data) {
      setEntregas(data.map((e: any) => ({
        ...e,
        atividade: e.atividades_pedagogicas ? {
          ...e.atividades_pedagogicas,
          turma_nome: e.atividades_pedagogicas.turmas?.nome,
        } : undefined,
      })));
    }
    setLoading(false);
  }, [criancaId]);

  useEffect(() => { fetchEntregas(); }, [fetchEntregas]);

  return { entregas, loading, refetch: fetchEntregas };
}
