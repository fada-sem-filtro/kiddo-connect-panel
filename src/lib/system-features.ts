import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardList,
  FileText,
  ListChecks,
  MessageSquare,
  Image as ImageIcon,
  Bell,
  Baby,
  Clipboard,
  UserCheck,
  Settings,
  Lock,
  PieChart,
  Shield,
  Briefcase,
  HelpCircle,
  Camera,
  Heart,
  BarChart3,
  DollarSign,
  Newspaper,
  Search,
  Globe,
  Smartphone,
  Mail,
  History,
  type LucideIcon,
} from "lucide-react";

export interface SystemFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/**
 * Canonical, complete list of Agenda Fleur features.
 * Used in public pages (Conheça, Sobre) so the catalog is always up to date.
 */
export const SYSTEM_FEATURES: SystemFeature[] = [
  // Pedagógico
  {
    icon: Users,
    title: "Gestão de alunos",
    desc: "Cadastro completo dos alunos com vínculo às turmas e responsáveis.",
  },
  {
    icon: GraduationCap,
    title: "Gestão do corpo docente",
    desc: "Cadastro de educadores com vínculo às matérias e turmas.",
  },
  {
    icon: School,
    title: "Gestão de turmas",
    desc: "Organização das turmas da escola com alunos e educadores.",
  },
  {
    icon: BookOpen,
    title: "Matérias personalizadas",
    desc: "Cadastro flexível de matérias por escola, definido pelo diretor.",
  },
  {
    icon: Calendar,
    title: "Grade de aulas semanal",
    desc: "Horários de aula por turma com vínculo ao educador responsável.",
  },
  {
    icon: ClipboardList,
    title: "Boletim escolar",
    desc: "Notas por período letivo, restrito ao 1º ano do Fundamental (alunos 6+).",
  },
  {
    icon: FileText,
    title: "Relatório de desempenho",
    desc: "Relatórios qualitativos com modelo personalizável por escola.",
  },
  {
    icon: ListChecks,
    title: "Atividades pedagógicas",
    desc: "Criação de atividades, correção e média geral calculada automaticamente.",
  },

  // Comunicação
  {
    icon: MessageSquare,
    title: "Recados bidirecionais",
    desc: "Conversas entre escola e família com suporte a imagens até 10 MB.",
  },
  {
    icon: Camera,
    title: "Fotos das atividades",
    desc: "Envio de fotos do dia a dia da criança junto aos recados.",
  },
  {
    icon: Bell,
    title: "Notificações em tempo real",
    desc: "Avisos instantâneos de eventos, recados, medicamentos e suporte.",
  },
  {
    icon: Mail,
    title: "E-mails transacionais",
    desc: "Convites, redefinição de senha e comunicações em pt-BR.",
  },

  // Rotina infantil
  {
    icon: Baby,
    title: "Agenda infantil diária",
    desc: "Registro de alimentação, sono, higiene e medicamentos da rotina.",
  },
  {
    icon: Clipboard,
    title: "Controle de presença",
    desc: "Presente, Ausente e Saiu com horários automáticos.",
  },
  {
    icon: UserCheck,
    title: "Pessoas autorizadas",
    desc: "Cadastro de responsáveis autorizados a retirar a criança, com foto.",
  },

  // Calendário
  {
    icon: CalendarDays,
    title: "Calendário escolar",
    desc: "Visão anual e mensal interativa com feriados e eventos por escola.",
  },

  // Financeiro
  {
    icon: DollarSign,
    title: "Financeiro e boletos",
    desc: "Dashboard financeiro com geração de boletos individuais e em lote.",
  },

  // Relatórios
  {
    icon: BarChart3,
    title: "Relatórios e exportações",
    desc: "Exportação em PDF e CSV de presenças, eventos e dados acadêmicos.",
  },

  // Configuração / segurança
  {
    icon: Settings,
    title: "Configurações pedagógicas",
    desc: "Ative módulos por escola: boletim, relatório, grade, atividades e secretaria.",
  },
  {
    icon: Lock,
    title: "Permissões por perfil",
    desc: "O diretor define o que cada perfil pode ver e fazer no sistema.",
  },
  {
    icon: PieChart,
    title: "Dashboards por perfil",
    desc: "Painéis dedicados para diretor, educador, responsável, aluno e secretaria.",
  },
  {
    icon: Briefcase,
    title: "Módulo Secretaria",
    desc: "Perfil de secretaria escolar habilitado por escola pelo diretor.",
  },
  {
    icon: Shield,
    title: "Multi-tenant SaaS",
    desc: "Isolamento total de dados por escola via RLS e identidade visual própria.",
  },
  {
    icon: HelpCircle,
    title: "Suporte integrado",
    desc: "Canal de suporte dentro do sistema, sincronizado com os recados.",
  },

  // Customização
  {
    icon: Settings,
    title: "Sidebar customizável",
    desc: "Menu lateral configurável por escola e perfil com arrastar e soltar.",
  },
  {
    icon: History,
    title: "Auditoria e LGPD",
    desc: "Registro de visualização, alteração e remoção de informações sensíveis.",
  },

  // Plataforma
  {
    icon: Smartphone,
    title: "App instalável (PWA)",
    desc: "Funciona como aplicativo no celular, tablet e computador.",
  },
  {
    icon: Globe,
    title: "Site institucional",
    desc: "Páginas públicas Início, Sobre, Conheça e Blog com menu unificado.",
  },
  {
    icon: Newspaper,
    title: "Blog com CMS",
    desc: "Editor de artigos com categorias, tags e mídias.",
  },
  {
    icon: Heart,
    title: "Acessível e em português",
    desc: "Interface responsiva 100% em pt-BR pensada para escolas brasileiras.",
  },
];
