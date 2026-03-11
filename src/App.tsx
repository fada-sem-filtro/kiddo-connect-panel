import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider, setNotifyCallback } from "@/contexts/DataContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EVENT_TYPE_LABELS, EventType } from "@/types";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CriancasPage from "./pages/CriancasPage";
import EducadoresPage from "./pages/EducadoresPage";
import RecadosPage from "./pages/RecadosPage";
import AdminPage from "./pages/AdminPage";
import FeriadosPage from "./pages/FeriadosPage";
import CalendarioAdminPage from "./pages/CalendarioAdminPage";
import ResponsavelEventosPage from "./pages/ResponsavelEventosPage";
import EducadorTurmaPage from "./pages/EducadorTurmaPage";
import UsuariosPage from "./pages/UsuariosPage";
import CrechesPage from "./pages/CrechesPage";
import DiretorMembrosPage from "./pages/DiretorMembrosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function NotificationConnector({ children }: { children: React.ReactNode }) {
  const { addNotificacao } = useNotifications();

  useEffect(() => {
    setNotifyCallback((criancaNome: string, tipoEvento: string) => {
      const tipoLabel = EVENT_TYPE_LABELS[tipoEvento as EventType] || tipoEvento;
      addNotificacao({
        titulo: `Novo evento: ${tipoLabel} 📅`,
        mensagem: `Um evento de ${tipoLabel.toLowerCase()} foi registrado para ${criancaNome}.`,
        tipo: 'evento',
        criancaId: undefined,
      });
    });
  }, [addNotificacao]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
              <NotificationConnector>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/educador/turma" element={<ProtectedRoute allowedRoles={['admin', 'educador']}><EducadorTurmaPage /></ProtectedRoute>} />
                  <Route path="/criancas" element={<ProtectedRoute allowedRoles={['admin']}><CriancasPage /></ProtectedRoute>} />
                  <Route path="/educadores" element={<ProtectedRoute allowedRoles={['admin']}><EducadoresPage /></ProtectedRoute>} />
                  <Route path="/recados" element={<ProtectedRoute allowedRoles={['admin', 'educador']}><RecadosPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
                  <Route path="/admin/feriados" element={<ProtectedRoute allowedRoles={['admin']}><FeriadosPage /></ProtectedRoute>} />
                  <Route path="/admin/calendario" element={<ProtectedRoute allowedRoles={['admin']}><CalendarioAdminPage /></ProtectedRoute>} />
                  <Route path="/responsavel/eventos" element={<ProtectedRoute allowedRoles={['admin', 'responsavel']}><ResponsavelEventosPage /></ProtectedRoute>} />
                  <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><UsuariosPage /></ProtectedRoute>} />
                  <Route path="/admin/creches" element={<ProtectedRoute allowedRoles={['admin']}><CrechesPage /></ProtectedRoute>} />
                  <Route path="/diretor/membros" element={<ProtectedRoute allowedRoles={['admin', 'educador']}><DiretorMembrosPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NotificationConnector>
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
