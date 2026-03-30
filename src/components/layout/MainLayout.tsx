import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { SuporteModal } from '@/components/modals/SuporteModal';
import { useAuth } from '@/contexts/AuthContext';
import { HelpCircle } from 'lucide-react';

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
