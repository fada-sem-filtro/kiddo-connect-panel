import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle, MessageSquare, CalendarClock, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const DIAS_SEMANA = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
];

interface GradeItem {
  id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  materia_nome: string;
  educador_nome: string;
}

export default function AlunoDashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [crianca, setCrianca] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, pendentes: 0, entregues: 0, avaliadas: 0 });
  const [atividades, setAtividades] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<Map<string, any>>(new Map());
  const [notas, setNotas] = useState<any[]>([]);
  const [grade, setGrade] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // Find crianca linked to this user
      const { data: criancaData } = await supabase
        .from('criancas')
        .select('*, turmas(nome)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!criancaData) { setLoading(false); return; }
      setCrianca(criancaData);

      // Fetch all in parallel
      const [entregasRes, atividadesRes, gradeRes] = await Promise.all([
        supabase
          .from('atividade_entregas')
          .select('*, atividades_pedagogicas(titulo, tipo, data_entrega)')
          .eq('aluno_crianca_id', criancaData.id),
        supabase
          .from('atividades_pedagogicas')
          .select('id, titulo, tipo, data_entrega, descricao')
          .eq('turma_id', criancaData.turma_id)
          .order('data_entrega', { ascending: false }),
        supabase
          .from('grade_aulas')
          .select('id, dia_semana, horario_inicio, horario_fim, materia_id, educador_user_id')
          .eq('turma_id', criancaData.turma_id)
          .order('dia_semana')
          .order('horario_inicio'),
      ]);

      // Process entregas
      const entregasList = entregasRes.data || [];
      const entMap = new Map<string, any>();
      entregasList.forEach((e: any) => entMap.set(e.atividade_id, e));
      setEntregas(entMap);

      // Stats
      const total = atividadesRes.data?.length || 0;
      const pendentes = total - entMap.size;
      const entregues = entregasList.filter((e: any) => e.status === 'entregue').length;
      const avaliadas = entregasList.filter((e: any) => e.status === 'avaliada').length;
      setStats({ total, pendentes: Math.max(0, pendentes), entregues, avaliadas });

      // Activities list (latest 10)
      setAtividades((atividadesRes.data || []).slice(0, 10));

      // Notas (avaliadas only, latest 5)
      const notasList = entregasList
        .filter((e: any) => e.status === 'avaliada' && e.nota != null)
        .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 5);
      setNotas(notasList);

      // Process grade
      const gradeData = gradeRes.data || [];
      if (gradeData.length > 0) {
        const materiaIds = [...new Set(gradeData.map(d => d.materia_id))];
        const educadorIds = [...new Set(gradeData.map(d => d.educador_user_id))];
        const [materiasRes, profilesRes] = await Promise.all([
          supabase.from('materias').select('id, nome').in('id', materiaIds),
          supabase.from('profiles').select('user_id, nome').in('user_id', educadorIds),
        ]);
        const materiaMap = new Map((materiasRes.data || []).map(m => [m.id, m.nome]));
        const educadorMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.nome]));
        setGrade(gradeData.map(d => ({
          id: d.id,
          dia_semana: d.dia_semana,
          horario_inicio: d.horario_inicio,
          horario_fim: d.horario_fim,
          materia_nome: materiaMap.get(d.materia_id) || 'Matéria',
          educador_nome: educadorMap.get(d.educador_user_id) || 'Professor',
        })));
      }

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!crianca) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Perfil não encontrado</h2>
          <p className="text-muted-foreground mt-2">Seu perfil de aluno ainda não foi vinculado.</p>
        </div>
      </MainLayout>
    );
  }

  const statusColor: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    entregue: 'bg-blue-100 text-blue-800',
    avaliada: 'bg-green-100 text-green-800',
    revisao: 'bg-red-100 text-red-800',
  };

  const todayDow = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayGrade = grade.filter(g => g.dia_semana === todayDow);

  const gradeByDay = DIAS_SEMANA.map(dia => ({
    ...dia,
    aulas: grade.filter(g => g.dia_semana === dia.value),
  })).filter(d => d.aulas.length > 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {crianca.nome}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turma: {(crianca as any).turmas?.nome}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-7 h-7 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-7 h-7 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <FileText className="w-7 h-7 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.entregues}</p>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.avaliadas}</p>
              <p className="text-xs text-muted-foreground">Avaliadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        {todayGrade.length > 0 && (
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Aulas de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {todayGrade.map(aula => (
                  <div key={aula.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-xl">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {aula.horario_inicio.slice(0, 5)}–{aula.horario_fim.slice(0, 5)}
                    </span>
                    <span className="font-semibold text-sm text-foreground">{aula.materia_nome}</span>
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">
                      {aula.educador_nome}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Schedule */}
        {gradeByDay.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Grade Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {gradeByDay.map(dia => (
                    <div key={dia.value} className={`rounded-xl border p-3 ${dia.value === todayDow ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <p className={`text-xs font-bold mb-2 ${dia.value === todayDow ? 'text-primary' : 'text-muted-foreground'}`}>
                        {dia.label} {dia.value === todayDow && '• Hoje'}
                      </p>
                      <div className="space-y-1.5">
                        {dia.aulas.map(aula => (
                          <div key={aula.id} className="text-xs">
                            <p className="font-semibold text-foreground truncate">{aula.materia_nome}</p>
                            <p className="text-muted-foreground">{aula.horario_inicio.slice(0, 5)}–{aula.horario_fim.slice(0, 5)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities with pending indicator */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Atividades
              {stats.pendentes > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-1">
                  {stats.pendentes} pendente{stats.pendentes > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {atividades.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma atividade registrada.</p>
            ) : (
              <div className="space-y-2">
                {atividades.map((atv: any) => {
                  const entrega = entregas.get(atv.id);
                  const isPendente = !entrega;
                  const status = entrega?.status || 'pendente';
                  return (
                    <div
                      key={atv.id}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer hover:shadow-sm transition ${isPendente ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/40'}`}
                      onClick={() => navigate('/aluno/atividades')}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isPendente && <Clock className="w-3.5 h-3.5 text-yellow-600 shrink-0" />}
                          <p className="font-semibold text-sm text-foreground truncate">{atv.titulo}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {atv.tipo === 'avaliacao' ? '📝 Avaliação' : '📚 Atividade'} • {format(new Date(atv.data_entrega), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {entrega?.nota != null && (
                          <span className="text-sm font-bold text-primary">{entrega.nota}</span>
                        )}
                        <Badge className={`text-xs ${statusColor[status] || 'bg-muted text-foreground'}`}>
                          {status === 'pendente' ? 'Pendente' : status === 'entregue' ? 'Entregue' : status === 'avaliada' ? 'Avaliada' : 'Revisão'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Últimas Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {notas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma nota disponível ainda.</p>
            ) : (
              <div className="space-y-2">
                {notas.map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{n.atividades_pedagogicas?.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.atividades_pedagogicas?.data_entrega ? format(new Date(n.atividades_pedagogicas.data_entrega), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xl font-bold text-primary">{n.nota}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
