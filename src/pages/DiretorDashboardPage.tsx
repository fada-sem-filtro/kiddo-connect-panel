import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePresencas } from '@/hooks/usePresencas';
import { Users, Baby, CheckCircle2, XCircle, LogOut, Clock, AlertTriangle, Calendar, GraduationCap, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePedagogicalSettings } from '@/hooks/usePedagogicalSettings';
import { useNavigate } from 'react-router-dom';

interface TurmaComCriancas {
  id: string;
  nome: string;
  criancaCount: number;
}

interface CriancaSimples {
  id: string;
  nome: string;
  turma_id: string;
}

interface EventoFuturoInfo {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
}

export default function DiretorDashboardPage() {
  const { userCreche } = useAuth();
  const { settings: pedSettings } = usePedagogicalSettings();
  const navigate = useNavigate();
  const today = new Date();
  const { presencas, getPresenca } = usePresencas(today);

  const [turmas, setTurmas] = useState<TurmaComCriancas[]>([]);
  const [criancas, setCriancas] = useState<CriancaSimples[]>([]);
  const [eventosFuturos, setEventosFuturos] = useState<EventoFuturoInfo[]>([]);
  const [eventosHoje, setEventosHoje] = useState<{ id: string; tipo: string; crianca_id: string; observacao: string | null; data_inicio: string }[]>([]);
  const [boletosStats, setBoletosStats] = useState<{ pendentes: number; vencidos: number; totalValor: number }>({ pendentes: 0, vencidos: 0, totalValor: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userCreche) return;
    const fetch = async () => {
      setLoading(true);

      // Turmas da creche
      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, nome')
        .eq('creche_id', userCreche.id);
      
      const turmaIds = (turmasData || []).map(t => t.id);

      // Crianças
      let criancasData: CriancaSimples[] = [];
      if (turmaIds.length > 0) {
        const { data } = await supabase
          .from('criancas')
          .select('id, nome, turma_id')
          .in('turma_id', turmaIds)
          .order('nome');
        criancasData = data || [];
      }
      setCriancas(criancasData);

      // Turmas com contagem
      const turmasComCount = (turmasData || []).map(t => ({
        id: t.id,
        nome: t.nome,
        criancaCount: criancasData.filter(c => c.turma_id === t.id).length,
      }));
      setTurmas(turmasComCount);

      // Eventos futuros do dia
      const todayStr = format(today, 'yyyy-MM-dd');
      const { data: efData } = await supabase
        .from('eventos_futuros')
        .select('id, nome, descricao, data_inicio, data_fim')
        .lte('data_inicio', todayStr)
        .or(`data_fim.gte.${todayStr},data_fim.is.null`);
      setEventosFuturos(efData || []);

      // Eventos diários (registrados por educadores)
      if (criancasData.length > 0) {
        const start = new Date(today); start.setHours(0, 0, 0, 0);
        const end = new Date(today); end.setHours(23, 59, 59, 999);
        const { data: evData } = await supabase
          .from('eventos')
          .select('id, tipo, crianca_id, observacao, data_inicio')
          .in('crianca_id', criancasData.map(c => c.id))
          .gte('data_inicio', start.toISOString())
          .lte('data_inicio', end.toISOString())
          .order('data_inicio', { ascending: false });
        setEventosHoje(evData || []);
      }

      // Boletos stats
      if (userCreche) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: boletosData } = await supabase
          .from('boletos')
          .select('valor, status, vencimento')
          .eq('creche_id', userCreche.id)
          .in('status', ['pendente', 'vencido']);
        if (boletosData) {
          const pendentes = boletosData.filter(b => b.status === 'pendente').length;
          const vencidos = boletosData.filter(b => b.status === 'vencido' || (b.status === 'pendente' && b.vencimento < todayStr)).length;
          const totalValor = boletosData.reduce((sum, b) => sum + Number(b.valor), 0);
          setBoletosStats({ pendentes, vencidos, totalValor });
        }
      }

      setLoading(false);
    };
    fetch();
  }, [userCreche]);

  const totalAlunos = criancas.length;
  const presentes = criancas.filter(c => getPresenca(c.id)?.status === 'presente').length;
  const sairam = criancas.filter(c => getPresenca(c.id)?.status === 'saiu').length;
  const ausentes = totalAlunos - presentes - sairam;

  // Alerts
  const alunosSemSaida = criancas.filter(c => {
    const p = getPresenca(c.id);
    return p?.status === 'presente' && !p?.hora_saida;
  });

  const chegadaMuitoCedo = criancas.filter(c => {
    const p = getPresenca(c.id);
    if (!p?.hora_chegada) return false;
    const hora = new Date(p.hora_chegada).getHours();
    return hora < 7;
  });

  const getCriancaNome = (id: string) => criancas.find(c => c.id === id)?.nome || '';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {userCreche?.nome}
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5 text-center">
              <Baby className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold text-foreground">{totalAlunos}</p>
              <p className="text-sm text-muted-foreground">Matriculados</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-2 border-[hsl(var(--success))]/30 bg-gradient-to-br from-[hsl(var(--success))]/5 to-[hsl(var(--success))]/10">
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[hsl(var(--success))] mb-2" />
              <p className="text-3xl font-bold text-foreground">{presentes}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-2 border-border">
            <CardContent className="p-5 text-center">
              <XCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-3xl font-bold text-foreground">{ausentes}</p>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-2 border-secondary">
            <CardContent className="p-5 text-center">
              <LogOut className="w-8 h-8 mx-auto text-secondary-foreground mb-2" />
              <p className="text-3xl font-bold text-foreground">{sairam}</p>
              <p className="text-sm text-muted-foreground">Saíram</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Turmas */}
          <Card className="rounded-2xl border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {turmas.map(t => {
                const turmaPresentes = criancas.filter(c => c.turma_id === t.id && getPresenca(c.id)?.status === 'presente').length;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.criancaCount} alunos</p>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      {turmaPresentes}/{t.criancaCount} presentes
                    </Badge>
                  </div>
                );
              })}
              {turmas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada</p>}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="rounded-2xl border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))]" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alunosSemSaida.length > 0 && (
                <div className="p-3 bg-[hsl(var(--warning))]/10 rounded-xl border border-[hsl(var(--warning))]/30">
                  <p className="text-sm font-semibold text-foreground mb-1">⚠️ Sem registro de saída</p>
                  <div className="flex flex-wrap gap-1">
                    {alunosSemSaida.map(c => (
                      <Badge key={c.id} variant="outline" className="rounded-lg text-xs">{c.nome}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {chegadaMuitoCedo.length > 0 && (
                <div className="p-3 bg-[hsl(var(--info))]/10 rounded-xl border border-[hsl(var(--info))]/30">
                  <p className="text-sm font-semibold text-foreground mb-1">🕐 Chegada antes das 7h</p>
                  <div className="flex flex-wrap gap-1">
                    {chegadaMuitoCedo.map(c => (
                      <Badge key={c.id} variant="outline" className="rounded-lg text-xs">{c.nome}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {eventosHoje.filter(e => e.observacao).slice(0, 5).map(e => (
                <div key={e.id} className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">{getCriancaNome(e.crianca_id)}</p>
                  <p className="text-sm text-foreground">{e.observacao}</p>
                </div>
              ))}
              {alunosSemSaida.length === 0 && chegadaMuitoCedo.length === 0 && eventosHoje.filter(e => e.observacao).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento ✅</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Boletos */}
        {pedSettings?.modulo_boletos_ativo && (
          <Card className="rounded-2xl border-2 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Boletos e Cobranças
                </CardTitle>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate('/diretor/boletos')}>
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">{boletosStats.pendentes}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-xl">
                  <p className="text-2xl font-bold text-destructive">{boletosStats.vencidos}</p>
                  <p className="text-xs text-muted-foreground">Vencidos</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-xl">
                  <p className="text-lg font-bold text-foreground">R$ {boletosStats.totalValor.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">A receber</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Presence */}
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Presença em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Aluno</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Turma</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chegada</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {criancas.map(c => {
                    const p = getPresenca(c.id);
                    const status = p?.status || 'ausente';
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium text-foreground">{c.nome}</td>
                        <td className="py-2 px-3 text-muted-foreground">{turmas.find(t => t.id === c.turma_id)?.nome}</td>
                        <td className="py-2 px-3">
                          {status === 'presente' && <Badge className="rounded-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Presente</Badge>}
                          {status === 'saiu' && <Badge variant="secondary" className="rounded-lg">Saiu</Badge>}
                          {status === 'ausente' && <Badge variant="outline" className="rounded-lg">Ausente</Badge>}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{p?.hora_chegada ? format(new Date(p.hora_chegada), 'HH:mm') : '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{p?.hora_saida ? format(new Date(p.hora_saida), 'HH:mm') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Agenda do Dia */}
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agenda do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventosFuturos.map(ef => (
              <div key={ef.id} className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                <p className="font-semibold text-foreground">{ef.nome}</p>
                {ef.descricao && <p className="text-sm text-muted-foreground">{ef.descricao}</p>}
              </div>
            ))}
            {eventosFuturos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum evento programado para hoje</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
