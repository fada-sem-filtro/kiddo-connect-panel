import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  MessageSquare,
  GraduationCap,
  Menu,
  X,
  LogOut,
  CalendarDays,
  BarChart3,
  PartyPopper,
  ClipboardList,
  UserCog,
  Building2,
  Baby,
  LayoutDashboard,
  FileText,
  UserCheck,
  Settings,
  Library,
  BookOpen,
  Shield,
  SlidersHorizontal,
  Cog,
  Receipt,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoFleur from "@/assets/logo-fleur-2.webp";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { usePedagogicalSettings } from "@/hooks/usePedagogicalSettings";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useSidebarConfig } from "@/hooks/useSidebarConfig";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { AVAILABLE_ITEMS_BY_ROLE } from "@/lib/sidebar-defaults";
import { toast } from "sonner";

// Map item keys to icons
const ICON_MAP: Record<string, typeof Calendar> = {
  agenda: Calendar,
  painel_educador: LayoutDashboard,
  minha_turma: Users,
  boletim: BookOpen,
  recados: MessageSquare,
  agenda_educador: ClipboardList,
  grade_aulas: CalendarDays,
  relatorio_desempenho: ClipboardList,
  eventos: ClipboardList,
  calendario: CalendarDays,
  relatorio: ClipboardList,
  dashboard: BarChart3,
  membros: Users,
  turmas: GraduationCap,
  alunos: Baby,
  usuarios: UserCog,
  feriados: PartyPopper,
  relatorios: FileText,
  relatorio_aluno: UserCheck,
  pedagogico: Settings,
  materias: Library,
  relatorio_modelo: FileText,
  escolas: Building2,
  alunos_global: Baby,
  educadores_global: GraduationCap,
  permissoes: Shield,
  orcamentos: MessageSquare,
  suporte: MessageSquare,
  sidebar_config: SlidersHorizontal,
  configuracoes: Cog,
  eventos_resp: ClipboardList,
  calendario_resp: CalendarDays,
  atividades_pedagogicas: BookOpen,
  atividades_aluno: BookOpen,
  atividades: BookOpen,
  notas: FileText,
  calendario_aluno: CalendarDays,
  presencas: ClipboardList,
  boletos: Receipt,
  blog: FileText,
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapsed();
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut, userCreche, isDiretor } = useAuth();
  const isSecretaria = role === 'secretaria';
  const { settings: pedSettings } = usePedagogicalSettings();
  const { canView } = useUserPermissions();
  const { config: customConfig, loading: sidebarConfigLoading } = useSidebarConfig();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Até logo! 🌸");
    navigate("/login");
  };

  // Get route for a given item key and role
  const getRouteForKey = (key: string): string => {
    if (!role) return '/';
    const roleItems = AVAILABLE_ITEMS_BY_ROLE[role] || [];
    const found = roleItems.find(i => i.key === key);
    return found?.route || '/';
  };

  // Build custom navigation sections from config
  type NavItem = { name: string; href: string; icon: typeof Calendar };
  type NavSection = { label: string; items: NavItem[] };

  // Map sidebar item keys to their pedagogical setting requirement
  const PED_SETTING_MAP: Record<string, keyof NonNullable<typeof pedSettings>> = {
    atividades_pedagogicas: 'atividades_avaliacoes_ativo',
    atividades_aluno: 'atividades_avaliacoes_ativo',
    atividades: 'atividades_avaliacoes_ativo',
    notas: 'atividades_avaliacoes_ativo',
    boletim: 'boletim_ativo',
    grade_aulas: 'grade_aulas_ativo',
    materias: 'gestao_materias_ativo',
    relatorio_desempenho: 'relatorio_desempenho_ativo',
    relatorio_modelo: 'relatorio_desempenho_ativo',
    financeiro: 'modulo_boletos_ativo',
  };

  const isItemEnabledByPedSettings = (key: string): boolean => {
    // Admin always sees everything
    if (role === 'admin') return true;
    // Director-specific: permissoes & sidebar_config only when secretaria module is active
    if (isDiretor && (key === 'permissoes' || key === 'sidebar_config')) {
      return !!(pedSettings as any)?.modulo_secretaria_ativo;
    }
    const settingKey = PED_SETTING_MAP[key];
    if (!settingKey) return true; // Not a pedagogical item
    if (!pedSettings) return false; // Settings not loaded yet or not configured → hide
    return !!(pedSettings as any)[settingKey];
  };

  const useCustomConfig = customConfig != null;
  const isConfigPending = sidebarConfigLoading;

  let customSections: NavSection[] = [];
  if (useCustomConfig) {
    customSections = customConfig
      .sort((a, b) => a.ordem - b.ordem)
      .map(section => ({
        label: section.label,
        items: section.items
          .filter(i => i.visible && isItemEnabledByPedSettings(i.key))
          .sort((a, b) => a.ordem - b.ordem)
          .map(i => ({
            name: i.label,
            href: getRouteForKey(i.key),
            icon: ICON_MAP[i.key] || Calendar,
          })),
      }))
      .filter(s => s.items.length > 0);
  }

  // ========= DEFAULT NAVIGATION (used when no custom config) =========
  const mainNavigation: NavItem[] = [];
  const responsavelNavigation: NavItem[] = [];
  const adminNavigation: NavItem[] = [];

  if (!useCustomConfig && !isConfigPending) {
    // Aluno has its own simple nav
    if (role === 'aluno') {
      mainNavigation.push({ name: "Dashboard", href: "/aluno/dashboard", icon: BarChart3 });
      if (pedSettings?.atividades_avaliacoes_ativo) {
        mainNavigation.push({ name: "Minhas Atividades", href: "/aluno/atividades", icon: BookOpen });
        mainNavigation.push({ name: "Minhas Notas", href: "/aluno/notas", icon: FileText });
      }
      mainNavigation.push({ name: "Calendário", href: "/aluno/calendario", icon: CalendarDays });
      if (pedSettings?.grade_aulas_ativo) {
        mainNavigation.push({ name: "Grade de Aulas", href: "/aluno/grade-aulas", icon: CalendarDays });
      }
    } else if (isDiretor) {
      if (canView('dashboard')) mainNavigation.push({ name: "Dashboard", href: "/diretor/dashboard", icon: BarChart3 });
    } else if (isSecretaria) {
      if (canView('dashboard')) mainNavigation.push({ name: "Dashboard", href: "/secretaria/dashboard", icon: BarChart3 });
      if (canView('recados')) mainNavigation.push({ name: "Recados", href: "/recados", icon: MessageSquare });
    } else if (role !== 'admin') {
      mainNavigation.push({ name: "Agenda", href: "/agenda", icon: Calendar });
    }

    if (role === "admin" || ((role === "educador" || role === "diretor") && canView('painel_educador'))) {
      mainNavigation.push({ name: "Painel Educador", href: "/educador/dashboard", icon: LayoutDashboard });
    }
    if (role === "admin" || (role === "educador" && canView('minha_turma'))) {
      mainNavigation.push({ name: "Minha Turma", href: "/educador/turma", icon: Users });
    }
    if (role === "educador" && pedSettings?.boletim_ativo && canView('boletim')) {
      mainNavigation.push({ name: "Boletim", href: "/educador/boletim", icon: BookOpen });
    }
    if (role === "educador" && (pedSettings as any)?.atividades_avaliacoes_ativo && canView('atividades_pedagogicas')) {
      mainNavigation.push({ name: "Atividades Pedagógicas", href: "/educador/atividades", icon: BookOpen });
    }
    if (role === "admin") {
      mainNavigation.push({ name: "Alunos", href: "/criancas", icon: Users });
      mainNavigation.push({ name: "Educadores", href: "/educadores", icon: GraduationCap });
    }
    if (role === "admin" || ((role === "educador" || role === "responsavel" || role === "diretor") && canView('recados'))) {
      mainNavigation.push({ name: "Recados", href: "/recados", icon: MessageSquare });
    }
    if (role === "educador" && canView('agenda_educador')) {
      mainNavigation.push({ name: "Minha Agenda", href: "/educador/agenda", icon: ClipboardList });
    }

    if (role === "admin" || role === "responsavel") {
      if (role === "admin" || canView('eventos')) {
        responsavelNavigation.push({ name: "Meus Eventos", href: "/responsavel/eventos", icon: ClipboardList });
      }
      if (role === "admin" || canView('calendario')) {
        responsavelNavigation.push({ name: "Calendário Escolar", href: "/responsavel/calendario", icon: CalendarDays });
      }
      if (pedSettings?.boletim_ativo && (role === "admin" || canView('boletim'))) {
        responsavelNavigation.push({ name: "Desempenho", href: "/responsavel/desempenho", icon: BookOpen });
      }
      if (pedSettings?.grade_aulas_ativo && (role === "admin" || canView('grade_aulas'))) {
        responsavelNavigation.push({ name: "Grade de Aulas", href: "/responsavel/grade-aulas", icon: CalendarDays });
      }
      if (pedSettings?.atividades_avaliacoes_ativo && (role === "admin" || canView('atividades_aluno'))) {
        responsavelNavigation.push({ name: "Atividades do Aluno", href: "/responsavel/atividades", icon: BookOpen });
      }
      if (role === "admin" || canView('financeiro')) {
        responsavelNavigation.push({ name: "Financeiro", href: "/responsavel/financeiro", icon: Receipt });
      }
    }
  }

  if (!useCustomConfig && !isConfigPending && (role === "admin" || isDiretor || isSecretaria)) {
    const prefix = isSecretaria ? "/secretaria" : isDiretor ? "/diretor" : "/admin";

    if (role === "admin") {
      adminNavigation.push({ name: "Dashboard", href: "/admin", icon: BarChart3 });
      adminNavigation.push({ name: "Escolas", href: "/admin/creches", icon: Building2 });
    }
    if (role === "admin" || canView('membros')) {
      adminNavigation.push({ name: "Corpo Docente", href: `${prefix}/membros`, icon: Users });
    }
    if (role === "admin" || canView('turmas')) {
      adminNavigation.push({ name: "Turmas", href: `${prefix}/turmas`, icon: GraduationCap });
    }
    if (role === "admin" || canView('alunos')) {
      adminNavigation.push({ name: "Alunos", href: `${prefix}/criancas`, icon: Baby });
    }
    if (role === "admin" || canView('usuarios')) {
      adminNavigation.push({ name: "Usuários", href: `${prefix}/usuarios`, icon: UserCog });
    }
    if (role === "admin" || canView('feriados')) {
      adminNavigation.push({ name: "Feriados", href: `${prefix}/feriados`, icon: PartyPopper });
    }
    if (role === "admin" || canView('calendario')) {
      adminNavigation.push({ name: "Calendário", href: `${prefix}/calendario`, icon: CalendarDays });
    }
    if (role === "admin" || canView('relatorios')) {
      adminNavigation.push({ name: "Relatórios", href: "/relatorios", icon: FileText });
    }
    if (role === "admin" || canView('relatorio_aluno')) {
      adminNavigation.push({ name: "Relatório Aluno", href: "/relatorios/aluno", icon: UserCheck });
    }
    if (isSecretaria && canView('presencas')) {
      adminNavigation.push({ name: "Presenças", href: `${prefix}/presencas`, icon: ClipboardList });
    }
    if (isSecretaria && canView('eventos')) {
      adminNavigation.push({ name: "Eventos Diários", href: `${prefix}/eventos`, icon: ClipboardList });
    }
    if (isSecretaria && pedSettings?.atividades_avaliacoes_ativo && canView('atividades_pedagogicas')) {
      adminNavigation.push({ name: "Atividades Pedagógicas", href: `${prefix}/atividades`, icon: BookOpen });
    }
    if (role === "admin") {
      adminNavigation.push({ name: "Config. Pedagógicas", href: `${prefix}/pedagogico`, icon: Settings });
      adminNavigation.push({ name: "Permissões", href: "/admin/permissoes", icon: Shield });
      adminNavigation.push({ name: "Orçamentos", href: "/admin/orcamentos", icon: MessageSquare });
      adminNavigation.push({ name: "Menu Lateral", href: "/admin/sidebar-config", icon: SlidersHorizontal });
      adminNavigation.push({ name: "Minhas Configurações", href: "/admin/configuracoes", icon: Cog });
      adminNavigation.push({ name: "Blog", href: "/admin/blog", icon: FileText });
    }
    if (role === "admin" && canView('auditoria_fotos')) {
      adminNavigation.push({ name: "Auditoria de Fotos", href: "/admin/auditoria-fotos", icon: ShieldCheck });
    }
    if (role === "admin" || (pedSettings?.gestao_materias_ativo && canView('materias'))) {
      adminNavigation.push({ name: "Matérias", href: `${prefix}/materias`, icon: Library });
    }
    if (role === "admin" || (pedSettings?.boletim_ativo && canView('boletim'))) {
      adminNavigation.push({ name: "Boletim", href: `${prefix}/boletim`, icon: BookOpen });
    }
    if (role === "admin" || (pedSettings?.grade_aulas_ativo && canView('grade_aulas'))) {
      adminNavigation.push({ name: "Grade de Aulas", href: `${prefix}/grade-aulas`, icon: CalendarDays });
    }
    if (role === "admin" || (pedSettings?.relatorio_desempenho_ativo && canView('relatorio_desempenho'))) {
      adminNavigation.push({ name: "Modelo Relatório", href: `${prefix}/relatorio-modelo`, icon: FileText });
      adminNavigation.push({ name: "Relatórios Desempenho", href: `${prefix}/relatorio-desempenho`, icon: ClipboardList });
    }
    if (isDiretor && (pedSettings as any)?.modulo_secretaria_ativo) {
      adminNavigation.push({ name: "Permissões Secretaria", href: "/diretor/permissoes", icon: Shield });
      adminNavigation.push({ name: "Menu Lateral", href: "/diretor/sidebar-config", icon: SlidersHorizontal });
    }
    if (role === "admin" || canView('financeiro')) {
      adminNavigation.push({ name: "Financeiro", href: `${prefix}/financeiro`, icon: Receipt });
    }
  }

  // Renders a sidebar nav link, collapse-aware + Tooltip on icon-only mode (desktop).
  const renderLink = (
    item: NavItem,
    tone: 'primary' | 'responsavel' | 'admin',
    keyOverride?: string,
  ) => {
    const isActive = location.pathname === item.href;
    const activeClass =
      tone === 'primary'
        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-[1.02]'
        : tone === 'responsavel'
        ? 'bg-gradient-to-r from-kawaii-mint to-kawaii-blue text-foreground shadow-lg scale-[1.02]'
        : 'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg scale-[1.02]';

    const link = (
      <Link
        key={keyOverride || item.href + item.name}
        to={item.href}
        onClick={() => setIsOpen(false)}
        aria-label={item.name}
        title={collapsed ? item.name : undefined}
        className={cn(
          'flex items-center rounded-2xl text-sm font-semibold transition-all duration-300',
          collapsed ? 'lg:justify-center lg:gap-0 lg:px-0 lg:py-3 gap-3 px-4 py-3' : 'gap-3 px-4 py-3',
          isActive ? activeClass : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]',
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.name}</span>
        {isActive && tone !== 'primary' && (
          <span className={cn('ml-auto', collapsed && 'lg:hidden')}>
            {tone === 'responsavel' ? '💕' : '🌸'}
          </span>
        )}
      </Link>
    );

    if (!collapsed) return link;
    return (
      <Tooltip key={keyOverride || item.href + item.name} delayDuration={120}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="hidden lg:block">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-sm border-b border-border px-3 py-2.5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-primary/10 h-9 w-9"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-2">
          <img src={logoFleur} alt="Fleur" className="w-6 h-6" />
          <span className="font-bold text-foreground text-sm">Agenda Fleur</span>
          {userCreche && <span className="text-[10px] text-primary font-semibold max-w-[100px] truncate">{userCreche.nome}</span>}
        </div>

        <NotificationBell />
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-card border-r-2 border-border shadow-xl",
          "transition-[width,transform] duration-300 ease-out lg:translate-x-0",
          // mobile: drawer comportamento atual (w-72)
          "w-72",
          // desktop: largura depende do estado colapsado
          collapsed ? "lg:w-20" : "lg:w-72",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo + toggle */}
          <div
            className={cn(
              "flex items-center gap-3 border-b-2 border-border bg-gradient-to-r from-primary/5 to-secondary/10 py-5",
              collapsed ? "lg:justify-center lg:px-2 px-6 justify-between" : "px-6 justify-between",
            )}
          >
            <div className={cn("flex items-center gap-3", collapsed && "lg:gap-0")}>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-md shrink-0">
                <img src={logoFleur} alt="Fleur" className="w-10 h-10" />
              </div>
              <div className={cn(collapsed && "lg:hidden")}>
                <h1 className="text-xl font-bold text-foreground">Agenda Fleur</h1>
                {userCreche && <p className="text-xs text-primary font-semibold">{userCreche.nome}</p>}
              </div>
            </div>
            <div className={cn("hidden lg:flex items-center gap-1", collapsed && "lg:hidden")}>
              <NotificationBell />
            </div>
          </div>

          {/* Desktop toggle button (collapse / expand) */}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
            title={collapsed ? "Expandir menu" : "Minimizar menu"}
            className={cn(
              "hidden lg:flex items-center justify-center mx-auto my-2 h-7 w-7 rounded-full",
              "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              "shadow-sm transition-all duration-200",
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* User info */}
          {profile && (
            <div
              className={cn(
                "px-6 py-3 border-b border-border bg-muted/30",
                collapsed && "lg:hidden",
              )}
            >
              <p className="text-sm font-semibold text-foreground truncate">{profile.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || ""}</p>
            </div>
          )}

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 py-6 space-y-6 overflow-y-auto scrollbar-thin",
              collapsed ? "lg:px-2 px-4" : "px-4",
            )}
          >
            {/* Custom config sections for non-admin roles */}
            {useCustomConfig && customSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <p
                  className={cn(
                    "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    collapsed && "lg:hidden",
                  )}
                >
                  {section.label}
                </p>
                {section.items.map((item) => renderLink(item, 'primary'))}
              </div>
            ))}

            {/* Default sections when no custom config */}
            {!useCustomConfig && mainNavigation.length > 0 && role !== "admin" && (
              <div className="space-y-2">
                <p
                  className={cn(
                    "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    collapsed && "lg:hidden",
                  )}
                >
                  📚 Principal
                </p>
                {mainNavigation.map((item) => renderLink(item, 'primary'))}
              </div>
            )}

            {!useCustomConfig && responsavelNavigation.length > 0 && role !== "admin" && (
              <div className="space-y-2">
                <p
                  className={cn(
                    "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    collapsed && "lg:hidden",
                  )}
                >
                  👨‍👩‍👧 Responsável
                </p>
                {responsavelNavigation.map((item) => renderLink(item, 'responsavel'))}
              </div>
            )}

            {adminNavigation.length > 0 && (
              <div className="space-y-2">
                <p
                  className={cn(
                    "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    collapsed && "lg:hidden",
                  )}
                >
                  {isDiretor ? "🏫 Gestão" : "⚙️ Administração"}
                </p>
                {adminNavigation.map((item) => renderLink(item, 'admin'))}
              </div>
            )}
          </nav>

          {/* Footer */}
          <div
            className={cn(
              "py-4 border-t-2 border-border bg-muted/30",
              collapsed ? "lg:px-2 px-4" : "px-4",
            )}
          >
            {collapsed ? (
              <Tooltip delayDuration={120}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    aria-label="Sair"
                    className={cn(
                      "text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl",
                      "lg:w-full lg:justify-center w-full justify-start",
                    )}
                  >
                    <LogOut className="w-5 h-5 lg:mr-0 mr-3" />
                    <span className="lg:hidden">Sair</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
