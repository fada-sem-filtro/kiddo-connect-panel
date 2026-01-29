import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  GraduationCap,
  Menu,
  X,
  LogOut,
  Sparkles,
  Settings,
  CalendarDays,
  BarChart3,
  PartyPopper,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const navigation = [
  { name: 'Agenda', href: '/', icon: Calendar },
  { name: 'Minha Turma', href: '/educador/turma', icon: Users },
  { name: 'Crianças', href: '/criancas', icon: Users },
  { name: 'Educadores', href: '/educadores', icon: GraduationCap },
  { name: 'Recados', href: '/recados', icon: MessageSquare },
];

const responsavelNavigation = [
  { name: 'Meus Eventos', href: '/responsavel/eventos', icon: ClipboardList },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Feriados', href: '/admin/feriados', icon: PartyPopper },
  { name: 'Calendário', href: '/admin/calendario', icon: CalendarDays },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile header with hamburger and notification */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl hover:bg-primary/10"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Lullaby</span>
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
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Kawaii style */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b-2 border-border bg-gradient-to-r from-primary/5 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 shadow-md">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Lullaby</h1>
                <p className="text-xs text-primary font-semibold">✨ Escola Infantil</p>
              </div>
            </div>
            {/* Notification bell for desktop */}
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-thin">
            {/* Main navigation */}
            <div className="space-y-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                📚 Principal
              </p>
              {navigation.map((item) => {
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
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {isActive && <span className="ml-auto">✨</span>}
                  </Link>
                );
              })}
            </div>

            {/* Responsavel navigation */}
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
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {isActive && <span className="ml-auto">💕</span>}
                  </Link>
                );
              })}
            </div>

            {/* Admin navigation */}
            <div className="space-y-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ⚙️ Administração
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
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {isActive && <span className="ml-auto">🌸</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t-2 border-border bg-muted/30">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl"
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
