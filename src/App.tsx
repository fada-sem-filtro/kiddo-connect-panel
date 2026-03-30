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
import RelatorioModeloPage from "./pages/RelatorioModeloPage";
import RelatorioDesempenhoPage from "./pages/RelatorioDesempenhoPage";
import PermissoesPerfilPage from "./pages/PermissoesPerfilPage";
import ResponsavelGradePage from "./pages/ResponsavelGradePage";
import LandingPage from "./pages/LandingPage";
import OrcamentosPage from "./pages/OrcamentosPage";
import SidebarConfigPage from "./pages/SidebarConfigPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import SuportePage from "./pages/SuportePage";
import AlunoDashboardPage from "./pages/AlunoDashboardPage";
import AlunoAtividadesPage from "./pages/AlunoAtividadesPage";
import AlunoNotasPage from "./pages/AlunoNotasPage";
import AlunoGradePage from "./pages/AlunoGradePage";
import EducadorAtividadesPage from "./pages/EducadorAtividadesPage";
import ResponsavelAtividadesPage from "./pages/ResponsavelAtividadesPage";
import SecretariaDashboardPage from "./pages/SecretariaDashboardPage";
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/conheca" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/agenda" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/educador/turma" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'diretor']}><EducadorTurmaPage /></ProtectedRoute>} />
              <Route path="/criancas" element={<ProtectedRoute allowedRoles={['admin']}><CriancasPage /></ProtectedRoute>} />
              <Route path="/educadores" element={<ProtectedRoute allowedRoles={['admin']}><EducadoresPage /></ProtectedRoute>} />
              <Route path="/recados" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'responsavel', 'diretor', 'secretaria']}><RecadosPage /></ProtectedRoute>} />
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
              <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin', 'diretor', 'secretaria']}><RelatoriosPage /></ProtectedRoute>} />
              <Route path="/relatorios/aluno" element={<ProtectedRoute allowedRoles={['admin', 'diretor', 'secretaria']}><RelatorioAlunoPage /></ProtectedRoute>} />
              <Route path="/admin/pedagogico" element={<ProtectedRoute allowedRoles={['admin']}><ConfiguracoesPedagogicasPage /></ProtectedRoute>} />
              <Route path="/admin/materias" element={<ProtectedRoute allowedRoles={['admin']}><MateriasPage /></ProtectedRoute>} />
              <Route path="/admin/boletim" element={<ProtectedRoute allowedRoles={['admin']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/diretor/pedagogico" element={<ProtectedRoute allowedRoles={['diretor']}><ConfiguracoesPedagogicasPage /></ProtectedRoute>} />
              <Route path="/diretor/materias" element={<ProtectedRoute allowedRoles={['diretor']}><MateriasPage /></ProtectedRoute>} />
              <Route path="/diretor/boletim" element={<ProtectedRoute allowedRoles={['diretor']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/educador/boletim" element={<ProtectedRoute allowedRoles={['educador']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/responsavel/desempenho" element={<ProtectedRoute allowedRoles={['responsavel']}><ResponsavelDesempenhoPage /></ProtectedRoute>} />
              <Route path="/responsavel/grade-aulas" element={<ProtectedRoute allowedRoles={['responsavel']}><ResponsavelGradePage /></ProtectedRoute>} />
              <Route path="/admin/grade-aulas" element={<ProtectedRoute allowedRoles={['admin']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/diretor/grade-aulas" element={<ProtectedRoute allowedRoles={['diretor']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/admin/relatorio-modelo" element={<ProtectedRoute allowedRoles={['admin']}><RelatorioModeloPage /></ProtectedRoute>} />
              <Route path="/admin/relatorio-desempenho" element={<ProtectedRoute allowedRoles={['admin']}><RelatorioDesempenhoPage /></ProtectedRoute>} />
              <Route path="/diretor/relatorio-modelo" element={<ProtectedRoute allowedRoles={['diretor']}><RelatorioModeloPage /></ProtectedRoute>} />
              <Route path="/diretor/relatorio-desempenho" element={<ProtectedRoute allowedRoles={['diretor']}><RelatorioDesempenhoPage /></ProtectedRoute>} />
              <Route path="/educador/relatorio-desempenho" element={<ProtectedRoute allowedRoles={['educador']}><RelatorioDesempenhoPage /></ProtectedRoute>} />
              <Route path="/responsavel/relatorio" element={<ProtectedRoute allowedRoles={['responsavel']}><RelatorioDesempenhoPage /></ProtectedRoute>} />
              <Route path="/educador/grade-aulas" element={<ProtectedRoute allowedRoles={['educador']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/educador/agenda" element={<ProtectedRoute allowedRoles={['educador']}><AgendaEducadorPage /></ProtectedRoute>} />
              <Route path="/admin/permissoes" element={<ProtectedRoute allowedRoles={['admin']}><PermissoesPerfilPage /></ProtectedRoute>} />
              <Route path="/diretor/permissoes" element={<ProtectedRoute allowedRoles={['diretor']}><PermissoesPerfilPage /></ProtectedRoute>} />
              <Route path="/admin/orcamentos" element={<ProtectedRoute allowedRoles={['admin']}><OrcamentosPage /></ProtectedRoute>} />
              <Route path="/admin/sidebar-config" element={<ProtectedRoute allowedRoles={['admin']}><SidebarConfigPage /></ProtectedRoute>} />
              <Route path="/diretor/sidebar-config" element={<ProtectedRoute allowedRoles={['diretor']}><SidebarConfigPage /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/suporte" element={<ProtectedRoute allowedRoles={['admin']}><SuportePage /></ProtectedRoute>} />
              {/* Aluno routes */}
              <Route path="/aluno/dashboard" element={<ProtectedRoute allowedRoles={['aluno']}><AlunoDashboardPage /></ProtectedRoute>} />
              <Route path="/aluno/atividades" element={<ProtectedRoute allowedRoles={['aluno']}><AlunoAtividadesPage /></ProtectedRoute>} />
              <Route path="/aluno/notas" element={<ProtectedRoute allowedRoles={['aluno']}><AlunoNotasPage /></ProtectedRoute>} />
              <Route path="/aluno/calendario" element={<ProtectedRoute allowedRoles={['aluno']}><CalendarioEscolarPage /></ProtectedRoute>} />
              <Route path="/aluno/grade-aulas" element={<ProtectedRoute allowedRoles={['aluno']}><AlunoGradePage /></ProtectedRoute>} />
              {/* Educador atividades */}
              <Route path="/educador/atividades" element={<ProtectedRoute allowedRoles={['admin', 'educador', 'diretor']}><EducadorAtividadesPage /></ProtectedRoute>} />
              {/* Responsável atividades */}
              <Route path="/responsavel/atividades" element={<ProtectedRoute allowedRoles={['admin', 'responsavel']}><ResponsavelAtividadesPage /></ProtectedRoute>} />
              {/* Secretaria routes */}
              <Route path="/secretaria/dashboard" element={<ProtectedRoute allowedRoles={['secretaria']}><SecretariaDashboardPage /></ProtectedRoute>} />
              <Route path="/secretaria/membros" element={<ProtectedRoute allowedRoles={['secretaria']}><DiretorMembrosPage /></ProtectedRoute>} />
              <Route path="/secretaria/turmas" element={<ProtectedRoute allowedRoles={['secretaria']}><TurmasPage /></ProtectedRoute>} />
              <Route path="/secretaria/criancas" element={<ProtectedRoute allowedRoles={['secretaria']}><CriancasDbPage /></ProtectedRoute>} />
              <Route path="/secretaria/usuarios" element={<ProtectedRoute allowedRoles={['secretaria']}><UsuariosPage /></ProtectedRoute>} />
              <Route path="/secretaria/feriados" element={<ProtectedRoute allowedRoles={['secretaria']}><FeriadosPage /></ProtectedRoute>} />
              <Route path="/secretaria/calendario" element={<ProtectedRoute allowedRoles={['secretaria']}><CalendarioAdminPage /></ProtectedRoute>} />
              <Route path="/secretaria/materias" element={<ProtectedRoute allowedRoles={['secretaria']}><MateriasPage /></ProtectedRoute>} />
              <Route path="/secretaria/boletim" element={<ProtectedRoute allowedRoles={['secretaria']}><BoletimPage /></ProtectedRoute>} />
              <Route path="/secretaria/grade-aulas" element={<ProtectedRoute allowedRoles={['secretaria']}><GradeAulasPage /></ProtectedRoute>} />
              <Route path="/secretaria/atividades" element={<ProtectedRoute allowedRoles={['secretaria']}><EducadorAtividadesPage /></ProtectedRoute>} />
              <Route path="/secretaria/relatorio-modelo" element={<ProtectedRoute allowedRoles={['secretaria']}><RelatorioModeloPage /></ProtectedRoute>} />
              <Route path="/secretaria/relatorio-desempenho" element={<ProtectedRoute allowedRoles={['secretaria']}><RelatorioDesempenhoPage /></ProtectedRoute>} />
              <Route path="/secretaria/presencas" element={<ProtectedRoute allowedRoles={['secretaria']}><Index /></ProtectedRoute>} />
              <Route path="/secretaria/eventos" element={<ProtectedRoute allowedRoles={['secretaria']}><Index /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
