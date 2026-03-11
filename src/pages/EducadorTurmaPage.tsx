import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EventModal } from '@/components/modals/EventModal';
import { Users, Plus, Calendar, Sparkles, Baby } from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EventType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EducadorTurmaPage() {
  const { turmas, educadores, criancas, getCriancasByTurma, eventos, getEventosByCrianca } = useData();
  
  // Simula o educador logado (primeiro educador)
  const [educadorId, setEducadorId] = useState(educadores[0]?.id || '');
  const educadorAtual = educadores.find(e => e.id === educadorId);
  const educadorTurmas = turmas.filter(t => educadorAtual?.turmaIds.includes(t.id));
  
  // Selected turma for filtering
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  
  const criancasDasTurmas = educadorAtual?.turmaIds
    ? educadorAtual.turmaIds.flatMap(tid => getCriancasByTurma(tid))
    : [];

  const criancasFiltradas = selectedTurmaId === 'all'
    ? criancasDasTurmas
    : criancasDasTurmas.filter(c => c.turmaId === selectedTurmaId);

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventMode, setEventMode] = useState<'individual' | 'turma'>('individual');
  const [selectedCriancaId, setSelectedCriancaId] = useState<string | undefined>();
  const [selectedTurmaForEvent, setSelectedTurmaForEvent] = useState<string | undefined>();

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
    const hoje = new Date().toISOString().split('T')[0];
    return eventos.filter(e => {
      const eventDate = e.dataInicio.split('T')[0];
      return e.criancaId === criancaId && eventDate === hoje;
    });
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getEventIcon = (tipo: EventType) => {
    return EVENT_TYPE_ICONS[tipo] || '📋';
  };

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
                Visualize e registre eventos das crianças ✨
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector for demo purposes */}
            <Select value={educadorId} onValueChange={(val) => { setEducadorId(val); setSelectedTurmaId('all'); }}>
              <SelectTrigger className="w-[200px] rounded-2xl border-2 border-primary/20">
                <SelectValue placeholder="Selecionar educador" />
              </SelectTrigger>
              <SelectContent>
                {educadores.map((educador) => (
                  <SelectItem key={educador.id} value={educador.id}>
                    {educador.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Turmas cards */}
        {educadorTurmas.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedTurmaId === 'all' ? 'default' : 'outline'}
              className="rounded-2xl"
              onClick={() => setSelectedTurmaId('all')}
            >
              Todas ({criancasDasTurmas.length})
            </Button>
            {educadorTurmas.map(turma => {
              const count = getCriancasByTurma(turma.id).length;
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

        {/* Turma Info Card with event button */}
        {educadorTurmas.length > 0 && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-kawaii-pink/10 to-kawaii-purple/10 rounded-3xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 shadow-md">
                    <Baby className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {educadorTurmas.map(t => t.nome).join(', ')}
                      <span className="text-lg">🎀</span>
                    </h2>
                    <p className="text-sm text-primary font-medium mt-1">
                      Educador(a): {educadorAtual?.nome}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedTurmaId === 'all' ? educadorTurmas : educadorTurmas.filter(t => t.id === selectedTurmaId)).map(turma => (
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
        {criancasFiltradas.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma criança encontrada nesta turma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {criancasFiltradas.map((crianca) => {
              const eventosHoje = getEventosHoje(crianca.id);
              const turma = turmas.find(t => t.id === crianca.turmaId);
              
              return (
                <Card 
                  key={crianca.id} 
                  className="border-2 border-border hover:border-primary/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-kawaii-yellow/20 to-kawaii-peach/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-14 h-14 border-3 border-primary/30 shadow-md">
                          <AvatarImage src={crianca.foto} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                            {getInitials(crianca.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">
                            {crianca.nome}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {turma?.nome} • {format(new Date(crianca.dataNascimento), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xl group-hover:scale-125 transition-transform">🌟</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-4">
                    {/* Observações */}
                    {crianca.observacoes && (
                      <div className="p-3 bg-kawaii-peach/20 rounded-2xl border border-kawaii-peach/30">
                        <p className="text-xs text-muted-foreground">⚠️ {crianca.observacoes}</p>
                      </div>
                    )}

                    {/* Eventos de hoje */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Eventos de Hoje ({eventosHoje.length})
                      </h4>
                      {eventosHoje.length === 0 ? (
                        <p className="text-xs text-muted-foreground/70 italic">Nenhum evento registrado hoje</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {eventosHoje.slice(0, 4).map((evento) => (
                            <Badge 
                              key={evento.id} 
                              variant="secondary"
                              className="rounded-xl text-xs px-2 py-1 bg-muted/50"
                            >
                              {getEventIcon(evento.tipo)} {EVENT_TYPE_LABELS[evento.tipo]}
                            </Badge>
                          ))}
                          {eventosHoje.length > 4 && (
                            <Badge variant="outline" className="rounded-xl text-xs">
                              +{eventosHoje.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Add event button */}
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

      {/* Event Modal */}
      <EventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        mode={eventMode}
        preSelectedCriancaId={selectedCriancaId}
        preSelectedTurmaId={selectedTurmaForEvent || educadorAtual?.turmaIds[0]}
      />
    </MainLayout>
  );
}