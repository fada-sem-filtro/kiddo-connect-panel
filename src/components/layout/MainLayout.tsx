import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { SuporteModal } from '@/components/modals/SuporteModal';
import { useAuth } from '@/contexts/AuthContext';
import { HelpCircle } from 'lucide-react';
import { APP_VERSION } from '@/lib/app-version';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { mustChangePassword, setMustChangePassword } = useAuth();
  const [suporteOpen, setSuporteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-72 pt-14 lg:pt-0">
        <div className="p-3 sm:p-4 lg:p-8">
          {children}
        </div>
        <footer className="lg:pl-0 px-4 pb-4 pt-2 text-center text-[11px] text-muted-foreground">
          Agenda Fleur · v{APP_VERSION}
        </footer>
      </main>

      {/* Floating support button */}
      <button
        onClick={() => setSuporteOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-muted/80 hover:bg-muted border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 text-muted-foreground hover:text-foreground"
        title="Suporte"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <SuporteModal open={suporteOpen} onOpenChange={setSuporteOpen} />
      <ChangePasswordModal
        open={mustChangePassword}
        onSuccess={() => setMustChangePassword(false)}
      />
    </div>
  );
}
