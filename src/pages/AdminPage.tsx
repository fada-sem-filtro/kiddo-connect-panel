import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Sparkles,
  Baby,
  PartyPopper
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminPage() {
  const { criancas, educadores, eventos, recados, turmas, feriados, eventosFuturos } = useData();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const eventosDoMes = eventos.filter(e => {
      const eventDate = new Date(e.dataInicio);
      return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
    });

    const eventosHoje = eventos.filter(e => {
      const eventDate = new Date(e.dataInicio).toDateString();
      return eventDate === now.toDateString();
    });

    const recadosNaoLidos = recados.filter(r => !r.lido).length;

    const criancasPorTurma = turmas.map(turma => ({
      turma: turma.nome,
      quantidade: criancas.filter(c => c.turmaId === turma.id).length,
    }));

    const eventosPorTipo = eventos.reduce((acc, e) => {
      acc[e.tipo] = (acc[e.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCriancas: criancas.length,
      totalEducadores: educadores.length,
      totalEventosHoje: eventosHoje.length,
      totalEventosMes: eventosDoMes.length,
      recadosNaoLidos,
      totalFeriados: feriados.length,
      totalEventosFuturos: eventosFuturos.length,
      criancasPorTurma,
      eventosPorTipo,
    };
  }, [criancas, educadores, eventos, recados, turmas, feriados, eventosFuturos]);

  const statCards = [
    { 
      title: 'Crianças', 
      value: stats.totalCriancas, 
      icon: Baby, 
      color: 'from-kawaii-pink/30 to-kawaii-pink/10',
      emoji: '👶'
    },
    { 
      title: 'Educadores', 
      value: stats.totalEducadores, 
      icon: GraduationCap, 
      color: 'from-kawaii-purple/30 to-kawaii-purple/10',
      emoji: '👩‍🏫'
    },
    { 
      title: 'Eventos Hoje', 
      value: stats.totalEventosHoje, 
      icon: Calendar, 
      color: 'from-kawaii-blue/30 to-kawaii-blue/10',
      emoji: '📅'
    },
    { 
      title: 'Eventos do Mês', 
      value: stats.totalEventosMes, 
      icon: TrendingUp, 
      color: 'from-kawaii-mint/30 to-kawaii-mint/10',
      emoji: '📊'
    },
    { 
      title: 'Recados Novos', 
      value: stats.recadosNaoLidos, 
      icon: MessageSquare, 
      color: 'from-kawaii-yellow/30 to-kawaii-yellow/10',
      emoji: '💬'
    },
    { 
      title: 'Feriados', 
      value: stats.totalFeriados, 
      icon: PartyPopper, 
      color: 'from-primary/20 to-primary/5',
      emoji: '🎉'
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard ✨</h1>
            <p className="text-muted-foreground">
              Visão geral da escola • {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className={`kawaii-card bg-gradient-to-br ${stat.color} overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-foreground/60" />
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Crianças por Turma */}
          <Card className="kawaii-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Crianças por Turma 👶
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.criancasPorTurma.map((item, index) => (
                  <div key={item.turma} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.turma}</span>
                      <span className="text-muted-foreground">{item.quantidade} crianças</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((item.quantidade / 10) * 100, 100)}%`,
                          background: `hsl(${index * 60 + 340}, 65%, 70%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eventos por Tipo */}
          <Card className="kawaii-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Eventos por Tipo 📊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.eventosPorTipo).map(([tipo, count]) => {
                  const labels: Record<string, { name: string; emoji: string; color: string }> = {
                    ALIMENTACAO: { name: 'Alimentação', emoji: '🍽️', color: 'bg-event-meal' },
                    SONECA: { name: 'Soneca', emoji: '💤', color: 'bg-event-sleep' },
                    BRINCADEIRA: { name: 'Brincadeira', emoji: '🎮', color: 'bg-event-play' },
                    ATIVIDADE: { name: 'Atividade', emoji: '📚', color: 'bg-event-activity' },
                    HIGIENE: { name: 'Higiene', emoji: '🛁', color: 'bg-event-hygiene' },
                    OUTRO: { name: 'Outro', emoji: '📝', color: 'bg-event-other' },
                  };
                  const info = labels[tipo] || { name: tipo, emoji: '📋', color: 'bg-muted' };
                  
                  return (
                    <div 
                      key={tipo} 
                      className={`${info.color} rounded-2xl p-3 text-center kawaii-hover`}
                    >
                      <span className="text-2xl block mb-1">{info.emoji}</span>
                      <p className="text-xl font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Eventos */}
        <Card className="kawaii-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos do Calendário 🗓️
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventosFuturos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span className="text-4xl block mb-2">📭</span>
                <p>Nenhum evento programado</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventosFuturos.slice(0, 6).map(evento => (
                  <div 
                    key={evento.id} 
                    className="p-4 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 border-2 border-secondary/50"
                  >
                    <p className="font-bold text-foreground">{evento.nome}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(evento.dataInicio), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    {evento.descricao && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{evento.descricao}</p>
                    )}
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
