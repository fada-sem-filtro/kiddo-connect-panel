import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlunoDashboardPage() {
  const { user, profile } = useAuth();
  const [crianca, setCrianca] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, pendentes: 0, entregues: 0, avaliadas: 0 });
  const [recentEntregas, setRecentEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Find crianca linked to this user
      const { data: criancaData } = await supabase
        .from('criancas')
        .select('*, turmas(nome)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!criancaData) { setLoading(false); return; }
      setCrianca(criancaData);

      // Fetch entregas stats
      const { data: entregas } = await supabase
        .from('atividade_entregas')
        .select('*, atividades_pedagogicas(titulo, tipo, data_entrega)')
        .eq('aluno_crianca_id', criancaData.id);

      // Fetch all atividades for turma
      const { data: atividades } = await supabase
        .from('atividades_pedagogicas')
        .select('id')
        .eq('turma_id', criancaData.turma_id);

      const total = atividades?.length || 0;
      const entregasMap = new Map((entregas || []).map((e: any) => [e.atividade_id, e]));
      const pendentes = total - entregasMap.size;
      const entregues = (entregas || []).filter((e: any) => e.status === 'entregue').length;
      const avaliadas = (entregas || []).filter((e: any) => e.status === 'avaliada').length;

      setStats({ total, pendentes: Math.max(0, pendentes), entregues, avaliadas });
      setRecentEntregas((entregas || []).slice(0, 5));
      setLoading(false);
    };
    fetch();
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
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Atividades</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.entregues}</p>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.avaliadas}</p>
              <p className="text-xs text-muted-foreground">Avaliadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Últimas Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntregas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentEntregas.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{e.atividades_pedagogicas?.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Entrega: {e.atividades_pedagogicas?.data_entrega ? format(new Date(e.atividades_pedagogicas.data_entrega), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.nota != null && (
                        <span className="text-sm font-bold text-primary">{e.nota}</span>
                      )}
                      <Badge className={statusColor[e.status] || 'bg-muted text-foreground'}>
                        {e.status === 'pendente' ? 'Pendente' : e.status === 'entregue' ? 'Entregue' : e.status === 'avaliada' ? 'Avaliada' : 'Revisão'}
                      </Badge>
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
