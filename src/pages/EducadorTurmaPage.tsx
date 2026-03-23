import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EventDbModal } from '@/components/modals/EventDbModal';
import { Users, Plus, Calendar, Sparkles, Baby } from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EventType, isTurmaFundamental } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TurmaInfo {
  id: string;
  nome: string;
  faixa_etaria: string | null;
}

interface CriancaInfo {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string;
  observacoes: string | null;
}

interface EventoInfo {
  id: string;
  tipo: string;
  crianca_id: string;
}

export default function EducadorTurmaPage() {
  const { user, profile } = useAuth();
  const [turmas, setTurmas] = useState<TurmaInfo[]>([]);
  const [criancas, setCriancas] = useState<CriancaInfo[]>([]);
  const [eventosHoje, setEventosHoje] = useState<EventoInfo[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventMode, setEventMode] = useState<'individual' | 'turma'>('individual');
  const [selectedCriancaId, setSelectedCriancaId] = useState<string | undefined>();
  const [selectedTurmaForEvent, setSelectedTurmaForEvent] = useState<string | undefined>();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Get turmas assigned to this educador
    const { data: assignments } = await supabase
      .from('turma_educadores')
      .select('turma_id, turmas(id, nome, faixa_etaria)')
      .eq('educador_user_id', user.id);

    const turmasList: TurmaInfo[] = assignments?.map((a: any) => ({
      id: a.turmas.id,
      nome: a.turmas.nome,
      faixa_etaria: a.turmas.faixa_etaria,
    })) || [];
    setTurmas(turmasList);

    if (turmasList.length === 0) {
      setCriancas([]);
      setEventosHoje([]);
      setLoading(false);
      return;
    }

    const turmaIds = turmasList.map(t => t.id);

    // Get crianças in those turmas
    const { data: criancasData } = await supabase
      .from('criancas')
      .select('id, nome, data_nascimento, turma_id, observacoes')
      .in('turma_id', turmaIds)
      .order('nome');

    setCriancas(criancasData || []);

    // Get today's events
    const hoje = new Date();
    const start = new Date(hoje);
    start.setHours(0, 0, 0, 0);
    const end = new Date(hoje);
    end.setHours(23, 59, 59, 999);

    const criancaIds = (criancasData || []).map(c => c.id);
    if (criancaIds.length > 0) {
      const { data: eventosData } = await supabase
        .from('eventos')
        .select('id, tipo, crianca_id')
        .in('crianca_id', criancaIds)
        .gte('data_inicio', start.toISOString())
        .lte('data_inicio', end.toISOString());

      setEventosHoje(eventosData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const criancasFiltradas = selectedTurmaId === 'all'
    ? criancas
    : criancas.filter(c => c.turma_id === selectedTurmaId);

  const handleAddEventoIndividual = (criancaId: string) => {
    setSelectedCriancaId(criancaId);
    setEventMode('individual');
    setEventModalOpen(true);
  };

  const handleAddEventoTurma = (turmaId: string) => {
    setSelectedCriancaId(undefined);
    setSelectedTurmaForEvent(turmaId);
    setEventMode('turma');
    setEventModalOpen(true);
  };

  const getEventosHoje = (criancaId: string) => {
    return eventosHoje.filter(e => e.crianca_id === criancaId);
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getEventIcon = (tipo: string) => {
    return EVENT_TYPE_ICONS[tipo as EventType] || '📋';
  };

  const getTurmaNome = (turmaId: string) => {
    return turmas.find(t => t.id === turmaId)?.nome || '';
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-kawaii-purple/30 to-kawaii-pink/30 shadow-md">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Minhas Turmas</h1>
              <p className="text-sm text-muted-foreground">
                Visualize e registre eventos dos alunos ✨
              </p>
            </div>
          </div>
        </div>

        {/* Turmas tabs */}
        {turmas.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedTurmaId === 'all' ? 'default' : 'outline'}
              className="rounded-2xl"
              onClick={() => setSelectedTurmaId('all')}
            >
              Todas ({criancas.length})
            </Button>
            {turmas.map(turma => {
              const count = criancas.filter(c => c.turma_id === turma.id).length;
              return (
                <Button
                  key={turma.id}
                  variant={selectedTurmaId === turma.id ? 'default' : 'outline'}
                  className="rounded-2xl"
                  onClick={() => setSelectedTurmaId(turma.id)}
                >
                  {turma.nome} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {/* Turma Info Card */}
        {turmas.length > 0 && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-kawaii-pink/10 to-kawaii-purple/10 rounded-3xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 shadow-md">
                    <Baby className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {turmas.map(t => t.nome).join(', ')}
                      <span className="text-lg">🎀</span>
                    </h2>
                    <p className="text-sm text-primary font-medium mt-1">
                      Educador(a): {profile?.nome}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedTurmaId === 'all' ? turmas : turmas.filter(t => t.id === selectedTurmaId)).map(turma => (
                    <Button
                      key={turma.id}
                      onClick={() => handleAddEventoTurma(turma.id)}
                      className="rounded-2xl bg-gradient-to-r from-primary to-kawaii-purple hover:opacity-90 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Evento - {turma.nome}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crianças Grid */}
        {turmas.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Você ainda não foi vinculado(a) a nenhuma turma
              </p>
            </CardContent>
          </Card>
        ) : criancasFiltradas.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum aluno encontrado nesta turma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {criancasFiltradas.map((crianca) => {
              const eventosC = getEventosHoje(crianca.id);
              
              return (
                <Card 
                  key={crianca.id} 
                  className="border-2 border-border hover:border-primary/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-kawaii-yellow/20 to-kawaii-peach/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-14 h-14 border-3 border-primary/30 shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                            {getInitials(crianca.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">
                            {crianca.nome}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {getTurmaNome(crianca.turma_id)} • {format(new Date(crianca.data_nascimento + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-4">
                    {crianca.observacoes && (
                      <div className="p-3 bg-kawaii-peach/20 rounded-2xl border border-kawaii-peach/30">
                        <p className="text-xs text-muted-foreground">⚠️ {crianca.observacoes}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Eventos de Hoje ({eventosC.length})
                      </h4>
                      {eventosC.length === 0 ? (
                        <p className="text-xs text-muted-foreground/70 italic">Nenhum evento registrado hoje</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {eventosC.slice(0, 4).map((evento) => (
                            <Badge 
                              key={evento.id} 
                              variant="secondary"
                              className="rounded-xl text-xs px-2 py-1 bg-muted/50"
                            >
                              {getEventIcon(evento.tipo)} {EVENT_TYPE_LABELS[evento.tipo as EventType] || evento.tipo}
                            </Badge>
                          ))}
                          {eventosC.length > 4 && (
                            <Badge variant="outline" className="rounded-xl text-xs">
                              +{eventosC.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleAddEventoIndividual(crianca.id)}
                      className="w-full rounded-2xl bg-gradient-to-r from-kawaii-mint to-kawaii-blue hover:opacity-90 text-foreground font-semibold shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Evento
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EventDbModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        mode={eventMode}
        preSelectedCriancaId={selectedCriancaId}
        preSelectedTurmaId={selectedTurmaForEvent}
        criancas={criancasFiltradas.map(c => ({ id: c.id, nome: c.nome }))}
        turmas={turmas}
        onSaved={fetchData}
      />
    </MainLayout>
  );
}
