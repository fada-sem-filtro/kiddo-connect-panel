import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { mustChangePassword, setMustChangePassword } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-72 pt-14 lg:pt-0">
        <div className="p-3 sm:p-4 lg:p-8">
          {children}
        </div>
      </main>
      <ChangePasswordModal
        open={mustChangePassword}
        onSuccess={() => setMustChangePassword(false)}
      />
    </div>
  );
}
