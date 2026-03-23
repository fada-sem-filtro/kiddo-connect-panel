import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import EducadorDashboardPage from "./pages/EducadorDashboardPage";
import DiretorDashboardPage from "./pages/DiretorDashboardPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import RelatorioAlunoPage from "./pages/RelatorioAlunoPage";
import CalendarioEscolarPage from "./pages/CalendarioEscolarPage";
import ConfiguracoesPedagogicasPage from "./pages/ConfiguracoesPedagogicasPage";
import MateriasPage from "./pages/MateriasPage";
import BoletimPage from "./pages/BoletimPage";
import ResponsavelDesempenhoPage from "./pages/ResponsavelDesempenhoPage";
import GradeAulasPage from "./pages/GradeAulasPage";
import AgendaEducadorPage from "./pages/AgendaEducadorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/educador/turma" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'diretor']}><EducadorTurmaPage /></ProtectedRoute>} />
              <Route path="/criancas" element={<ProtectedRoute allowedRoles={['admin']}><CriancasPage /></ProtectedRoute>} />
              <Route path="/educadores" element={<ProtectedRoute allowedRoles={['admin']}><EducadoresPage /></ProtectedRoute>} />
              <Route path="/recados" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'responsavel', 'diretor']}><RecadosPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
              <Route path="/admin/feriados" element={<ProtectedRoute allowedRoles={['admin']}><FeriadosPage /></ProtectedRoute>} />
              <Route path="/admin/calendario" element={<ProtectedRoute allowedRoles={['admin']}><CalendarioAdminPage /></ProtectedRoute>} />
              <Route path="/responsavel/eventos" element={<ProtectedRoute allowedRoles={['admin', 'responsavel']}><ResponsavelEventosPage /></ProtectedRoute>} />
              <Route path="/responsavel/calendario" element={<ProtectedRoute allowedRoles={['admin', 'responsavel']}><CalendarioEscolarPage /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><UsuariosPage /></ProtectedRoute>} />
              <Route path="/admin/creches" element={<ProtectedRoute allowedRoles={['admin']}><CrechesPage /></ProtectedRoute>} />
              <Route path="/admin/turmas" element={<ProtectedRoute allowedRoles={['admin']}><TurmasPage /></ProtectedRoute>} />
              <Route path="/admin/criancas" element={<ProtectedRoute allowedRoles={['admin']}><CriancasDbPage /></ProtectedRoute>} />
              <Route path="/admin/membros" element={<ProtectedRoute allowedRoles={['admin']}><DiretorMembrosPage /></ProtectedRoute>} />
              <Route path="/diretor/membros" element={<ProtectedRoute allowedRoles={['diretor']}><DiretorMembrosPage /></ProtectedRoute>} />
              <Route path="/diretor/turmas" element={<ProtectedRoute allowedRoles={['diretor']}><TurmasPage /></ProtectedRoute>} />
              <Route path="/diretor/criancas" element={<ProtectedRoute allowedRoles={['diretor']}><CriancasDbPage /></ProtectedRoute>} />
              <Route path="/diretor/usuarios" element={<ProtectedRoute allowedRoles={['diretor']}><UsuariosPage /></ProtectedRoute>} />
              <Route path="/diretor/feriados" element={<ProtectedRoute allowedRoles={['diretor']}><FeriadosPage /></ProtectedRoute>} />
              <Route path="/diretor/calendario" element={<ProtectedRoute allowedRoles={['diretor']}><CalendarioAdminPage /></ProtectedRoute>} />
              <Route path="/educador/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'diretor']}><EducadorDashboardPage /></ProtectedRoute>} />
              <Route path="/diretor/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'diretor']}><DiretorDashboardPage /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin', 'diretor']}><RelatoriosPage /></ProtectedRoute>} />
              <Route path="/relatorios/aluno" element={<ProtectedRoute allowedRoles={['admin', 'diretor']}><RelatorioAlunoPage /></ProtectedRoute>} />
              <Route path="/admin/pedagogico" element={<ProtectedRoute allowedRoles={['admin']}><ConfiguracoesPedagogicasPage /></ProtectedRoute>} />
              <Route path="/admin/materias" element={<ProtectedRoute allowedRoles={['admin']}><MateriasPage /></ProtectedRoute>} />
              <Route path="/admin/boletim" element={<ProtectedRoute allowedRoles={['admin']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/diretor/pedagogico" element={<ProtectedRoute allowedRoles={['diretor']}><ConfiguracoesPedagogicasPage /></ProtectedRoute>} />
              <Route path="/diretor/materias" element={<ProtectedRoute allowedRoles={['diretor']}><MateriasPage /></ProtectedRoute>} />
              <Route path="/diretor/boletim" element={<ProtectedRoute allowedRoles={['diretor']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/educador/boletim" element={<ProtectedRoute allowedRoles={['educador']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/responsavel/desempenho" element={<ProtectedRoute allowedRoles={['responsavel']}><ResponsavelDesempenhoPage /></ProtectedRoute>} />
              <Route path="/admin/grade-aulas" element={<ProtectedRoute allowedRoles={['admin']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/diretor/grade-aulas" element={<ProtectedRoute allowedRoles={['diretor']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/educador/agenda" element={<ProtectedRoute allowedRoles={['educador']}><AgendaEducadorPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
