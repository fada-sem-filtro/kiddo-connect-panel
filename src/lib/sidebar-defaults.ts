// Default sidebar structure per role
// Each item has a unique key that maps to a route and icon in the Sidebar component

export interface SidebarItemConfig {
  key: string;
  label: string;
  ordem: number;
  visible: boolean;
}

export interface SidebarSectionConfig {
  id: string;
  label: string;
  ordem: number;
  items: SidebarItemConfig[];
}

export type SidebarConfig = SidebarSectionConfig[];

export const AVAILABLE_ITEMS_BY_ROLE: Record<string, { key: string; defaultLabel: string; route: string }[]> = {
  educador: [
    { key: 'agenda', defaultLabel: 'Agenda', route: '/agenda' },
    { key: 'painel_educador', defaultLabel: 'Painel Educador', route: '/educador/dashboard' },
    { key: 'minha_turma', defaultLabel: 'Minha Turma', route: '/educador/turma' },
    { key: 'boletim', defaultLabel: 'Boletim', route: '/educador/boletim' },
    { key: 'recados', defaultLabel: 'Recados', route: '/recados' },
    { key: 'agenda_educador', defaultLabel: 'Minha Agenda', route: '/educador/agenda' },
    { key: 'grade_aulas', defaultLabel: 'Grade de Aulas', route: '/educador/grade-aulas' },
    { key: 'relatorio_desempenho', defaultLabel: 'Relatórios Desempenho', route: '/educador/relatorio-desempenho' },
  ],
  responsavel: [
    { key: 'agenda', defaultLabel: 'Agenda', route: '/agenda' },
    { key: 'recados', defaultLabel: 'Recados', route: '/recados' },
    { key: 'eventos', defaultLabel: 'Meus Eventos', route: '/responsavel/eventos' },
    { key: 'calendario', defaultLabel: 'Calendário Escolar', route: '/responsavel/calendario' },
    { key: 'boletim', defaultLabel: 'Desempenho', route: '/responsavel/desempenho' },
    { key: 'grade_aulas', defaultLabel: 'Grade de Aulas', route: '/responsavel/grade-aulas' },
    { key: 'relatorio', defaultLabel: 'Relatório', route: '/responsavel/relatorio' },
  ],
  admin: [
    { key: 'dashboard', defaultLabel: 'Dashboard', route: '/admin' },
    { key: 'escolas', defaultLabel: 'Escolas', route: '/admin/creches' },
    { key: 'painel_educador', defaultLabel: 'Painel Educador', route: '/educador/dashboard' },
    { key: 'alunos_global', defaultLabel: 'Alunos', route: '/criancas' },
    { key: 'educadores_global', defaultLabel: 'Educadores', route: '/educadores' },
    { key: 'recados', defaultLabel: 'Recados', route: '/recados' },
    { key: 'membros', defaultLabel: 'Corpo Docente', route: '/admin/membros' },
    { key: 'turmas', defaultLabel: 'Turmas', route: '/admin/turmas' },
    { key: 'alunos', defaultLabel: 'Gestão Alunos', route: '/admin/criancas' },
    { key: 'usuarios', defaultLabel: 'Usuários', route: '/admin/usuarios' },
    { key: 'feriados', defaultLabel: 'Feriados', route: '/admin/feriados' },
    { key: 'calendario', defaultLabel: 'Calendário', route: '/admin/calendario' },
    { key: 'relatorios', defaultLabel: 'Relatórios', route: '/relatorios' },
    { key: 'relatorio_aluno', defaultLabel: 'Relatório Aluno', route: '/relatorios/aluno' },
    { key: 'pedagogico', defaultLabel: 'Config. Pedagógicas', route: '/admin/pedagogico' },
    { key: 'permissoes', defaultLabel: 'Permissões', route: '/admin/permissoes' },
    { key: 'orcamentos', defaultLabel: 'Orçamentos', route: '/admin/orcamentos' },
    { key: 'sidebar_config', defaultLabel: 'Menu Lateral', route: '/admin/sidebar-config' },
    { key: 'materias', defaultLabel: 'Matérias', route: '/admin/materias' },
    { key: 'boletim', defaultLabel: 'Boletim', route: '/admin/boletim' },
    { key: 'grade_aulas', defaultLabel: 'Grade de Aulas', route: '/admin/grade-aulas' },
    { key: 'relatorio_modelo', defaultLabel: 'Modelo Relatório', route: '/admin/relatorio-modelo' },
    { key: 'relatorio_desempenho', defaultLabel: 'Relatórios Desempenho', route: '/admin/relatorio-desempenho' },
    { key: 'configuracoes', defaultLabel: 'Minhas Configurações', route: '/admin/configuracoes' },
    { key: 'eventos_resp', defaultLabel: 'Meus Eventos', route: '/responsavel/eventos' },
    { key: 'calendario_resp', defaultLabel: 'Calendário Escolar', route: '/responsavel/calendario' },
  ],
  diretor: [
    { key: 'dashboard', defaultLabel: 'Dashboard', route: '/diretor/dashboard' },
    { key: 'painel_educador', defaultLabel: 'Painel Educador', route: '/educador/dashboard' },
    { key: 'recados', defaultLabel: 'Recados', route: '/recados' },
    { key: 'membros', defaultLabel: 'Corpo Docente', route: '/diretor/membros' },
    { key: 'turmas', defaultLabel: 'Turmas', route: '/diretor/turmas' },
    { key: 'alunos', defaultLabel: 'Alunos', route: '/diretor/criancas' },
    { key: 'usuarios', defaultLabel: 'Usuários', route: '/diretor/usuarios' },
    { key: 'feriados', defaultLabel: 'Feriados', route: '/diretor/feriados' },
    { key: 'calendario', defaultLabel: 'Calendário', route: '/diretor/calendario' },
    { key: 'relatorios', defaultLabel: 'Relatórios', route: '/relatorios' },
    { key: 'relatorio_aluno', defaultLabel: 'Relatório Aluno', route: '/relatorios/aluno' },
    { key: 'pedagogico', defaultLabel: 'Config. Pedagógicas', route: '/diretor/pedagogico' },
    { key: 'materias', defaultLabel: 'Matérias', route: '/diretor/materias' },
    { key: 'boletim', defaultLabel: 'Boletim', route: '/diretor/boletim' },
    { key: 'grade_aulas', defaultLabel: 'Grade de Aulas', route: '/diretor/grade-aulas' },
    { key: 'relatorio_modelo', defaultLabel: 'Modelo Relatório', route: '/diretor/relatorio-modelo' },
    { key: 'relatorio_desempenho', defaultLabel: 'Relatórios Desempenho', route: '/diretor/relatorio-desempenho' },
  ],
};

export function getDefaultConfig(perfil: string): SidebarConfig {
  const items = AVAILABLE_ITEMS_BY_ROLE[perfil] || [];
  
  if (perfil === 'educador') {
    return [
      {
        id: 'principal',
        label: '📚 Principal',
        ordem: 0,
        items: [
          { key: 'agenda', label: 'Agenda', ordem: 0, visible: true },
          { key: 'painel_educador', label: 'Painel Educador', ordem: 1, visible: true },
          { key: 'minha_turma', label: 'Minha Turma', ordem: 2, visible: true },
          { key: 'boletim', label: 'Boletim', ordem: 3, visible: true },
          { key: 'recados', label: 'Recados', ordem: 4, visible: true },
          { key: 'agenda_educador', label: 'Minha Agenda', ordem: 5, visible: true },
          { key: 'grade_aulas', label: 'Grade de Aulas', ordem: 6, visible: true },
          { key: 'relatorio_desempenho', label: 'Relatórios Desempenho', ordem: 7, visible: true },
        ],
      },
    ];
  }

  if (perfil === 'responsavel') {
    return [
      {
        id: 'principal',
        label: '📚 Principal',
        ordem: 0,
        items: [
          { key: 'agenda', label: 'Agenda', ordem: 0, visible: true },
          { key: 'recados', label: 'Recados', ordem: 1, visible: true },
        ],
      },
      {
        id: 'responsavel',
        label: '👨‍👩‍👧 Responsável',
        ordem: 1,
        items: [
          { key: 'eventos', label: 'Meus Eventos', ordem: 0, visible: true },
          { key: 'calendario', label: 'Calendário Escolar', ordem: 1, visible: true },
          { key: 'boletim', label: 'Desempenho', ordem: 2, visible: true },
          { key: 'grade_aulas', label: 'Grade de Aulas', ordem: 3, visible: true },
          { key: 'relatorio', label: 'Relatório', ordem: 4, visible: true },
        ],
      },
    ];
  }

  if (perfil === 'diretor') {
    return [
      {
        id: 'principal',
        label: '📚 Principal',
        ordem: 0,
        items: [
          { key: 'dashboard', label: 'Dashboard', ordem: 0, visible: true },
          { key: 'painel_educador', label: 'Painel Educador', ordem: 1, visible: true },
          { key: 'recados', label: 'Recados', ordem: 2, visible: true },
        ],
      },
      {
        id: 'gestao',
        label: '🏫 Gestão',
        ordem: 1,
        items: [
          { key: 'membros', label: 'Corpo Docente', ordem: 0, visible: true },
          { key: 'turmas', label: 'Turmas', ordem: 1, visible: true },
          { key: 'alunos', label: 'Alunos', ordem: 2, visible: true },
          { key: 'usuarios', label: 'Usuários', ordem: 3, visible: true },
          { key: 'feriados', label: 'Feriados', ordem: 4, visible: true },
          { key: 'calendario', label: 'Calendário', ordem: 5, visible: true },
          { key: 'relatorios', label: 'Relatórios', ordem: 6, visible: true },
          { key: 'relatorio_aluno', label: 'Relatório Aluno', ordem: 7, visible: true },
          { key: 'pedagogico', label: 'Config. Pedagógicas', ordem: 8, visible: true },
          { key: 'materias', label: 'Matérias', ordem: 9, visible: true },
          { key: 'boletim', label: 'Boletim', ordem: 10, visible: true },
          { key: 'grade_aulas', label: 'Grade de Aulas', ordem: 11, visible: true },
          { key: 'relatorio_modelo', label: 'Modelo Relatório', ordem: 12, visible: true },
          { key: 'relatorio_desempenho', label: 'Relatórios Desempenho', ordem: 13, visible: true },
        ],
      },
    ];
  }

  if (perfil === 'admin') {
    return [
      {
        id: 'principal',
        label: '📊 Principal',
        ordem: 0,
        items: [
          { key: 'dashboard', label: 'Dashboard', ordem: 0, visible: true },
          { key: 'escolas', label: 'Escolas', ordem: 1, visible: true },
          { key: 'painel_educador', label: 'Painel Educador', ordem: 2, visible: true },
          { key: 'alunos_global', label: 'Alunos', ordem: 3, visible: true },
          { key: 'educadores_global', label: 'Educadores', ordem: 4, visible: true },
          { key: 'recados', label: 'Recados', ordem: 5, visible: true },
        ],
      },
      {
        id: 'gestao',
        label: '⚙️ Administração',
        ordem: 1,
        items: [
          { key: 'membros', label: 'Corpo Docente', ordem: 0, visible: true },
          { key: 'turmas', label: 'Turmas', ordem: 1, visible: true },
          { key: 'alunos', label: 'Gestão Alunos', ordem: 2, visible: true },
          { key: 'usuarios', label: 'Usuários', ordem: 3, visible: true },
          { key: 'feriados', label: 'Feriados', ordem: 4, visible: true },
          { key: 'calendario', label: 'Calendário', ordem: 5, visible: true },
          { key: 'relatorios', label: 'Relatórios', ordem: 6, visible: true },
          { key: 'relatorio_aluno', label: 'Relatório Aluno', ordem: 7, visible: true },
          { key: 'pedagogico', label: 'Config. Pedagógicas', ordem: 8, visible: true },
          { key: 'permissoes', label: 'Permissões', ordem: 9, visible: true },
          { key: 'orcamentos', label: 'Orçamentos', ordem: 10, visible: true },
          { key: 'sidebar_config', label: 'Menu Lateral', ordem: 11, visible: true },
          { key: 'materias', label: 'Matérias', ordem: 12, visible: true },
          { key: 'boletim', label: 'Boletim', ordem: 13, visible: true },
          { key: 'grade_aulas', label: 'Grade de Aulas', ordem: 14, visible: true },
          { key: 'relatorio_modelo', label: 'Modelo Relatório', ordem: 15, visible: true },
          { key: 'relatorio_desempenho', label: 'Relatórios Desempenho', ordem: 16, visible: true },
          { key: 'configuracoes', label: 'Minhas Configurações', ordem: 17, visible: true },
        ],
      },
      {
        id: 'responsavel_view',
        label: '👨‍👩‍👧 Responsável',
        ordem: 2,
        items: [
          { key: 'eventos_resp', label: 'Meus Eventos', ordem: 0, visible: true },
          { key: 'calendario_resp', label: 'Calendário Escolar', ordem: 1, visible: true },
        ],
      },
    ];
  }

  return [];
}
