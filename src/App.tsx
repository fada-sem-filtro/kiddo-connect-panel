import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider, setNotifyCallback } from "@/contexts/DataContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { EVENT_TYPE_LABELS, EventType } from "@/types";
import Index from "./pages/Index";
import CriancasPage from "./pages/CriancasPage";
import EducadoresPage from "./pages/EducadoresPage";
import RecadosPage from "./pages/RecadosPage";
import AdminPage from "./pages/AdminPage";
import FeriadosPage from "./pages/FeriadosPage";
import CalendarioAdminPage from "./pages/CalendarioAdminPage";
import ResponsavelEventosPage from "./pages/ResponsavelEventosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente interno que conecta notificações ao DataContext
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
      <NotificationProvider>
        <DataProvider>
          <NotificationConnector>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/criancas" element={<CriancasPage />} />
                <Route path="/educadores" element={<EducadoresPage />} />
                <Route path="/recados" element={<RecadosPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/feriados" element={<FeriadosPage />} />
                <Route path="/admin/calendario" element={<CalendarioAdminPage />} />
                <Route path="/responsavel/eventos" element={<ResponsavelEventosPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationConnector>
        </DataProvider>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
