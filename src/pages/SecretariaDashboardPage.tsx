import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { usePedagogicalSettings } from '@/hooks/usePedagogicalSettings';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, Baby, UserCog, PartyPopper, CalendarDays,
  FileText, UserCheck, ClipboardList, BookOpen, Library, MessageSquare,
  BarChart3, SlidersHorizontal, Receipt
} from 'lucide-react';

interface ShortcutItem {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const SecretariaDashboardPage = () => {
  const { profile } = useAuth();
  const { canView, loading: permLoading } = useUserPermissions();
  const { settings: pedSettings, loading: pedLoading } = usePedagogicalSettings();
  const navigate = useNavigate();

  const prefix = '/secretaria';

  const shortcuts: ShortcutItem[] = [];

  if (canView('recados')) shortcuts.push({ label: 'Recados', href: '/recados', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600' });
  if (canView('membros')) shortcuts.push({ label: 'Corpo Docente', href: `${prefix}/membros`, icon: Users, color: 'bg-violet-500/10 text-violet-600' });
  if (canView('turmas')) shortcuts.push({ label: 'Turmas', href: `${prefix}/turmas`, icon: GraduationCap, color: 'bg-emerald-500/10 text-emerald-600' });
  if (canView('alunos')) shortcuts.push({ label: 'Alunos', href: `${prefix}/criancas`, icon: Baby, color: 'bg-amber-500/10 text-amber-600' });
  if (canView('usuarios')) shortcuts.push({ label: 'Usuários', href: `${prefix}/usuarios`, icon: UserCog, color: 'bg-rose-500/10 text-rose-600' });
  if (canView('feriados')) shortcuts.push({ label: 'Feriados', href: `${prefix}/feriados`, icon: PartyPopper, color: 'bg-pink-500/10 text-pink-600' });
  if (canView('calendario')) shortcuts.push({ label: 'Calendário', href: `${prefix}/calendario`, icon: CalendarDays, color: 'bg-cyan-500/10 text-cyan-600' });
  if (canView('relatorios')) shortcuts.push({ label: 'Relatórios', href: '/relatorios', icon: FileText, color: 'bg-indigo-500/10 text-indigo-600' });
  if (canView('relatorio_aluno')) shortcuts.push({ label: 'Relatório Aluno', href: '/relatorios/aluno', icon: UserCheck, color: 'bg-teal-500/10 text-teal-600' });
  if (canView('presencas')) shortcuts.push({ label: 'Presenças', href: `${prefix}/presencas`, icon: ClipboardList, color: 'bg-orange-500/10 text-orange-600' });
  if (canView('eventos')) shortcuts.push({ label: 'Eventos Diários', href: `${prefix}/eventos`, icon: ClipboardList, color: 'bg-sky-500/10 text-sky-600' });
  if (pedSettings?.atividades_avaliacoes_ativo && canView('atividades_pedagogicas')) shortcuts.push({ label: 'Atividades Pedagógicas', href: `${prefix}/atividades`, icon: BookOpen, color: 'bg-purple-500/10 text-purple-600' });
  if (pedSettings?.gestao_materias_ativo && canView('materias')) shortcuts.push({ label: 'Matérias', href: `${prefix}/materias`, icon: Library, color: 'bg-lime-500/10 text-lime-600' });
  if (pedSettings?.boletim_ativo && canView('boletim')) shortcuts.push({ label: 'Boletim', href: `${prefix}/boletim`, icon: BookOpen, color: 'bg-fuchsia-500/10 text-fuchsia-600' });
  if (pedSettings?.grade_aulas_ativo && canView('grade_aulas')) shortcuts.push({ label: 'Grade de Aulas', href: `${prefix}/grade-aulas`, icon: CalendarDays, color: 'bg-green-500/10 text-green-600' });
  if (pedSettings?.relatorio_desempenho_ativo && canView('relatorio_desempenho')) {
    shortcuts.push({ label: 'Modelo Relatório', href: `${prefix}/relatorio-modelo`, icon: FileText, color: 'bg-stone-500/10 text-stone-600' });
    shortcuts.push({ label: 'Relatórios Desempenho', href: `${prefix}/relatorio-desempenho`, icon: ClipboardList, color: 'bg-zinc-500/10 text-zinc-600' });
  }
  if (pedSettings?.modulo_boletos_ativo && canView('boletos')) shortcuts.push({ label: 'Boletos', href: `${prefix}/boletos`, icon: Receipt, color: 'bg-yellow-500/10 text-yellow-600' });

  const isLoading = permLoading || pedLoading;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel da Secretaria</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {profile?.nome || 'Secretaria'}! Acesse as funcionalidades abaixo.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-28" />
              </Card>
            ))}
          </div>
        ) : shortcuts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma funcionalidade foi habilitada pelo diretor da escola.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shortcuts.map((item) => (
              <Card
                key={item.href}
                className="cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/30"
                onClick={() => navigate(item.href)}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center gap-3 text-center h-28">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium leading-tight">{item.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SecretariaDashboardPage;
