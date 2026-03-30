import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PermissaoPerfil {
  id: string;
  creche_id: string;
  perfil: string;
  modulo: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

export const MODULOS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'painel_educador', label: 'Painel Educador', icon: '👨‍🏫' },
  { key: 'minha_turma', label: 'Minha Turma', icon: '👥' },
  { key: 'recados', label: 'Recados', icon: '💬' },
  { key: 'presencas', label: 'Presenças', icon: '✅' },
  { key: 'eventos', label: 'Eventos Diários', icon: '📅' },
  { key: 'calendario', label: 'Calendário Escolar', icon: '🗓️' },
  { key: 'boletim', label: 'Boletim Escolar', icon: '📝' },
  { key: 'materias', label: 'Matérias', icon: '📚' },
  { key: 'grade_aulas', label: 'Grade de Aulas', icon: '🕐' },
  { key: 'relatorio_desempenho', label: 'Relatório de Desempenho', icon: '📄' },
  { key: 'relatorio_aluno', label: 'Relatório do Aluno', icon: '👤' },
  { key: 'relatorio_modelo', label: 'Modelo de Relatório', icon: '📋' },
  { key: 'turmas', label: 'Turmas', icon: '🏫' },
  { key: 'alunos', label: 'Alunos', icon: '👶' },
  { key: 'membros', label: 'Corpo Docente', icon: '👩‍🏫' },
  { key: 'usuarios', label: 'Usuários', icon: '⚙️' },
  { key: 'feriados', label: 'Feriados', icon: '🎉' },
  { key: 'relatorios', label: 'Relatórios de Presença', icon: '📊' },
  { key: 'agenda_educador', label: 'Minha Agenda', icon: '📋' },
  { key: 'atividades_pedagogicas', label: 'Atividades Pedagógicas', icon: '📐' },
  { key: 'atividades_aluno', label: 'Atividades do Aluno', icon: '📐' },
  { key: 'atividades', label: 'Minhas Atividades', icon: '📐' },
  { key: 'notas', label: 'Minhas Notas', icon: '🏆' },
  { key: 'calendario_aluno', label: 'Calendário do Aluno', icon: '🗓️' },
  { key: 'pedagogico', label: 'Config. Pedagógicas', icon: '⚙️' },
  { key: 'sidebar_config', label: 'Menu Lateral', icon: '📑' },
  { key: 'permissoes', label: 'Permissões', icon: '🛡️' },
] as const;

export const PERFIS = [
  { key: 'diretor', label: 'Diretor' },
  { key: 'educador', label: 'Educador' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'aluno', label: 'Aluno' },
  { key: 'secretaria', label: 'Secretaria' },
] as const;

export function usePermissoesPerfil(crecheId?: string) {
  const [permissoes, setPermissoes] = useState<PermissaoPerfil[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissoes = async () => {
    if (!crecheId) { setPermissoes([]); setLoading(false); return; }
    const { data } = await supabase
      .from('permissoes_perfil')
      .select('*')
      .eq('creche_id', crecheId);
    setPermissoes((data as PermissaoPerfil[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPermissoes(); }, [crecheId]);

  const getPermissao = (perfil: string, modulo: string): PermissaoPerfil | undefined => {
    return permissoes.find(p => p.perfil === perfil && p.modulo === modulo);
  };

  const upsertPermissao = async (perfil: string, modulo: string, updates: Partial<PermissaoPerfil>) => {
    if (!crecheId) return;
    const existing = getPermissao(perfil, modulo);
    if (existing) {
      await supabase.from('permissoes_perfil').update(updates).eq('id', existing.id);
    } else {
      await supabase.from('permissoes_perfil').insert({
        creche_id: crecheId,
        perfil,
        modulo,
        pode_visualizar: true,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
        ...updates,
      });
    }
    await fetchPermissoes();
  };

  const initializeDefaults = async () => {
    if (!crecheId) return;
    const TEMPLATE_CRECHE_ID = '00000000-0000-0000-0000-000000000001';

    // Try loading from stored template first
    const { data: templatePerms } = await supabase
      .from('permissoes_perfil')
      .select('*')
      .eq('creche_id', TEMPLATE_CRECHE_ID);

    if (templatePerms && templatePerms.length > 0) {
      // Use stored template defaults
      const defaults = templatePerms
        .filter(tp => !getPermissao(tp.perfil, tp.modulo))
        .map(tp => ({
          creche_id: crecheId,
          perfil: tp.perfil,
          modulo: tp.modulo,
          pode_visualizar: tp.pode_visualizar,
          pode_criar: tp.pode_criar,
          pode_editar: tp.pode_editar,
          pode_excluir: tp.pode_excluir,
        }));
      if (defaults.length > 0) {
        await supabase.from('permissoes_perfil').insert(defaults);
        await fetchPermissoes();
      }
      return;
    }

    // Fallback to hardcoded defaults
    const defaults: { perfil: string; modulo: string; pode_visualizar: boolean; pode_criar: boolean; pode_editar: boolean; pode_excluir: boolean }[] = [];

    const diretorModulos = ['dashboard', 'painel_educador', 'minha_turma', 'recados', 'presencas', 'eventos', 'calendario', 'boletim', 'materias', 'grade_aulas', 'relatorio_desempenho', 'relatorio_aluno', 'relatorio_modelo', 'turmas', 'alunos', 'membros', 'usuarios', 'feriados', 'relatorios', 'atividades_pedagogicas', 'pedagogico', 'permissoes', 'sidebar_config'];
    const educadorModulos = ['painel_educador', 'minha_turma', 'recados', 'presencas', 'eventos', 'boletim', 'grade_aulas', 'relatorio_desempenho', 'agenda_educador', 'atividades_pedagogicas'];
    const responsavelModulos = ['recados', 'eventos', 'calendario', 'boletim', 'relatorio_desempenho', 'grade_aulas', 'atividades_aluno'];
    const alunoModulos = ['dashboard', 'atividades', 'notas', 'grade_aulas', 'calendario_aluno'];

    for (const mod of diretorModulos) {
      if (!getPermissao('diretor', mod)) {
        defaults.push({ perfil: 'diretor', modulo: mod, pode_visualizar: true, pode_criar: true, pode_editar: true, pode_excluir: true });
      }
    }
    for (const mod of educadorModulos) {
      if (!getPermissao('educador', mod)) {
        const canWrite = ['presencas', 'eventos', 'recados', 'boletim', 'relatorio_desempenho', 'atividades_pedagogicas'].includes(mod);
        defaults.push({ perfil: 'educador', modulo: mod, pode_visualizar: true, pode_criar: canWrite, pode_editar: canWrite, pode_excluir: false });
      }
    }
    for (const mod of responsavelModulos) {
      if (!getPermissao('responsavel', mod)) {
        const canWrite = mod === 'recados';
        defaults.push({ perfil: 'responsavel', modulo: mod, pode_visualizar: true, pode_criar: canWrite, pode_editar: false, pode_excluir: false });
      }
    }
    for (const mod of alunoModulos) {
      if (!getPermissao('aluno', mod)) {
        defaults.push({ perfil: 'aluno', modulo: mod, pode_visualizar: true, pode_criar: mod === 'atividades', pode_editar: false, pode_excluir: false });
      }
    }

    const secretariaModulos = ['dashboard', 'recados', 'presencas', 'eventos', 'turmas', 'alunos', 'usuarios', 'calendario', 'relatorios', 'feriados', 'boletim', 'grade_aulas', 'materias', 'atividades_pedagogicas', 'membros', 'relatorio_aluno', 'relatorio_modelo', 'relatorio_desempenho'];
    for (const mod of secretariaModulos) {
      if (!getPermissao('secretaria', mod)) {
        const canWrite = ['recados', 'presencas', 'eventos', 'alunos'].includes(mod);
        defaults.push({ perfil: 'secretaria', modulo: mod, pode_visualizar: true, pode_criar: canWrite, pode_editar: canWrite, pode_excluir: false });
      }
    }

    if (defaults.length > 0) {
      await supabase.from('permissoes_perfil').insert(
        defaults.map(d => ({ ...d, creche_id: crecheId }))
      );
      await fetchPermissoes();
    }
  };

  return { permissoes, loading, getPermissao, upsertPermissao, initializeDefaults, refetch: fetchPermissoes };
}
