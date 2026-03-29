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
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoFleur from "@/assets/logo-fleur-2.webp";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { usePedagogicalSettings } from "@/hooks/usePedagogicalSettings";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useSidebarConfig } from "@/hooks/useSidebarConfig";
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
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut, userCreche, isDiretor } = useAuth();
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

  const useCustomConfig = role !== 'admin' && customConfig;
  const isConfigPending = role !== 'admin' && sidebarConfigLoading;

  let customSections: NavSection[] = [];
  if (useCustomConfig) {
    customSections = customConfig
      .sort((a, b) => a.ordem - b.ordem)
      .map(section => ({
        label: section.label,
        items: section.items
          .filter(i => i.visible)
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

  if (!useCustomConfig) {
    // Diretor sees Dashboard as primary
    if (isDiretor) {
      if (canView('dashboard')) mainNavigation.push({ name: "Dashboard", href: "/diretor/dashboard", icon: BarChart3 });
    } else {
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
    }
  }

  if (role === "admin" || (isDiretor && !useCustomConfig)) {
    const prefix = isDiretor ? "/diretor" : "/admin";

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
    adminNavigation.push({ name: "Relatório Aluno", href: "/relatorios/aluno", icon: UserCheck });
    if (role === "admin") {
      adminNavigation.push({ name: "Config. Pedagógicas", href: `${prefix}/pedagogico`, icon: Settings });
    }
    if (role === "admin") {
      adminNavigation.push({ name: "Permissões", href: "/admin/permissoes", icon: Shield });
      adminNavigation.push({ name: "Orçamentos", href: "/admin/orcamentos", icon: MessageSquare });
      adminNavigation.push({ name: "Menu Lateral", href: "/admin/sidebar-config", icon: SlidersHorizontal });
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
  }

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
          "fixed top-0 left-0 z-40 h-full w-72 bg-card border-r-2 border-border transition-transform duration-300 lg:translate-x-0 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b-2 border-border bg-gradient-to-r from-primary/5 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-md">
                <img src={logoFleur} alt="Fleur" className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Agenda Fleur</h1>
                {userCreche && <p className="text-xs text-primary font-semibold">{userCreche.nome}</p>}
              </div>
            </div>
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
          </div>

          {/* User info */}
          {profile && (
            <div className="px-6 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold text-foreground truncate">{profile.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || ""}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-thin">
            {/* Custom config sections for non-admin roles */}
            {useCustomConfig && customSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Default sections when no custom config */}
            {!useCustomConfig && mainNavigation.length > 0 && role !== "admin" && (
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  📚 Principal
                </p>
                {mainNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {!useCustomConfig && responsavelNavigation.length > 0 && role !== "admin" && (
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  👨‍👩‍👧 Responsável
                </p>
                {responsavelNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-kawaii-mint to-kawaii-blue text-foreground shadow-lg scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive && <span className="ml-auto">💕</span>}
                    </Link>
                  );
                })}
              </div>
            )}

            {adminNavigation.length > 0 && (
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isDiretor ? "🏫 Gestão" : "⚙️ Administração"}
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive && <span className="ml-auto">🌸</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t-2 border-border bg-muted/30">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
