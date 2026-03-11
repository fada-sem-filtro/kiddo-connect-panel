import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import TurmasPage from "./pages/TurmasPage";
import CriancasDbPage from "./pages/CriancasDbPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
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
                  <Route path="/diretor/turmas" element={<ProtectedRoute allowedRoles={['admin', 'educador']}><TurmasPage /></ProtectedRoute>} />
                  <Route path="/diretor/criancas" element={<ProtectedRoute allowedRoles={['admin', 'educador']}><CriancasDbPage /></ProtectedRoute>} />
                  <Route path="/admin/turmas" element={<ProtectedRoute allowedRoles={['admin']}><TurmasPage /></ProtectedRoute>} />
                  <Route path="/admin/criancas" element={<ProtectedRoute allowedRoles={['admin']}><CriancasDbPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
