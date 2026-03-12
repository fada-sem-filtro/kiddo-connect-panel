import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  UserCheck } from
'lucide-react';
import { cn } from '@/lib/utils';
import logoFleur from '@/assets/logo-fleur-2.webp';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut, userCreche, isDiretor } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo! 🌸');
    navigate('/login');
  };

  // Build navigation based on role
  const mainNavigation = [];

  // Diretor sees Dashboard as primary
  if (isDiretor) {
    mainNavigation.push({ name: 'Dashboard', href: '/diretor/dashboard', icon: BarChart3 });
  } else {
    mainNavigation.push({ name: 'Agenda', href: '/', icon: Calendar });
  }

  // Educador, diretor and admin see Painel do Educador
  if (role === 'admin' || role === 'educador' || role === 'diretor') {
    mainNavigation.push({ name: 'Painel Educador', href: '/educador/dashboard', icon: LayoutDashboard });
  }

  // Educador and admin see Minha Turma (not diretor)
  if (role === 'admin' || role === 'educador') {
    mainNavigation.push({ name: 'Minha Turma', href: '/educador/turma', icon: Users });
  }

  // Only admin sees Alunos and Educadores
  if (role === 'admin') {
    mainNavigation.push({ name: 'Alunos', href: '/criancas', icon: Users });
    mainNavigation.push({ name: 'Educadores', href: '/educadores', icon: GraduationCap });
  }

  // Everyone except pure responsavel sees Recados
  if (role === 'admin' || role === 'educador' || role === 'responsavel' || role === 'diretor') {
    mainNavigation.push({ name: 'Recados', href: '/recados', icon: MessageSquare });
  }

  const responsavelNavigation = role === 'admin' || role === 'responsavel' ? [
  { name: 'Meus Eventos', href: '/responsavel/eventos', icon: ClipboardList }] :
  [];

  const diretorNavigation: typeof mainNavigation = [];

  const adminNavigation: typeof mainNavigation = [];

  if (role === 'admin' || isDiretor) {
    const prefix = isDiretor ? '/diretor' : '/admin';

    if (role === 'admin') {
      adminNavigation.push({ name: 'Dashboard', href: '/admin', icon: BarChart3 });
      adminNavigation.push({ name: 'Escolas', href: '/admin/creches', icon: Building2 });
    }

    if (isDiretor) {
      adminNavigation.push({ name: 'Dashboard', href: '/diretor/dashboard', icon: BarChart3 });
    }

    adminNavigation.push({ name: 'Membros', href: `${prefix}/membros`, icon: Users });
    adminNavigation.push({ name: 'Turmas', href: `${prefix}/turmas`, icon: GraduationCap });
    adminNavigation.push({ name: 'Alunos', href: `${prefix}/criancas`, icon: Baby });
    adminNavigation.push({ name: 'Usuários', href: `${prefix}/usuarios`, icon: UserCog });
    adminNavigation.push({ name: 'Feriados', href: `${prefix}/feriados`, icon: PartyPopper });
    adminNavigation.push({ name: 'Calendário', href: `${prefix}/calendario`, icon: CalendarDays });
    adminNavigation.push({ name: 'Relatórios', href: '/relatorios', icon: FileText });
    adminNavigation.push({ name: 'Relatório Aluno', href: '/relatorios/aluno', icon: UserCheck });
  }

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl hover:bg-primary/10"
          onClick={() => setIsOpen(!isOpen)}>
          
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex items-center gap-2">
          <img src={logoFleur} alt="Fleur" className="w-6 h-6" />
          <span className="font-bold text-foreground">
            Agenda Fleur
          </span>
          {userCreche && <span className="text-xs text-primary font-semibold">{userCreche.nome}</span>}
        </div>

        <NotificationBell />
      </div>

      {/* Overlay */}
      {isOpen &&
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setIsOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-72 bg-card border-r-2 border-border transition-transform duration-300 lg:translate-x-0 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
        
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
          {profile &&
          <div className="px-6 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold text-foreground truncate">{profile.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || ''}</p>
            </div>
          }

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-thin">
            {mainNavigation.length > 0 &&
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
                      isActive ?
                      "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-[1.02]" :
                      "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}>
                    
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive}
                    </Link>);

              })}
              </div>
            }

            {responsavelNavigation.length > 0 &&
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
                      isActive ?
                      "bg-gradient-to-r from-kawaii-mint to-kawaii-blue text-foreground shadow-lg scale-[1.02]" :
                      "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}>
                    
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive && <span className="ml-auto">💕</span>}
                    </Link>);

              })}
              </div>
            }

            {adminNavigation.length > 0 &&
            <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isDiretor ? '🏫 Gestão' : '⚙️ Administração'}
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
                      isActive ?
                      "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg scale-[1.02]" :
                      "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}>
                    
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive && <span className="ml-auto">🌸</span>}
                    </Link>);
              })}
              </div>
            }
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t-2 border-border bg-muted/30">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl"
              onClick={handleSignOut}>
              
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>);

}