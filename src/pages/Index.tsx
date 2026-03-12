import { useState, useMemo, useEffect } from 'react';
import { addWeeks, subWeeks } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { SummaryCards } from '@/components/calendar/SummaryCards';
import { EventTimeline } from '@/components/events/EventTimeline';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventDbModal } from '@/components/modals/EventDbModal';
import { useEventos, EventoDb } from '@/hooks/useEventos';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'educador' || role === 'diretor';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCriancaId, setSelectedCriancaId] = useState<string>('all');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBulkEventModalOpen, setIsBulkEventModalOpen] = useState(false);
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);

  const { eventos, loading, fetchEventos } = useEventos({
    date: selectedDate,
    criancaId: selectedCriancaId,
  });

  useEffect(() => {
    supabase.from('criancas').select('id, nome').order('nome').then(({ data }) => {
      if (data) setCriancas(data);
    });
  }, []);

  // Redirect diretor to their dashboard
  if (role === 'diretor') {
    return <Navigate to="/diretor/dashboard" replace />;
  }

  useEffect(() => {
    supabase.from('criancas').select('id, nome').order('nome').then(({ data }) => {
      if (data) setCriancas(data);
    });
  }, []);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const eventCounts = useMemo(() => {
    return eventos.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [eventos]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Acompanhe as atividades do dia</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCriancaId} onValueChange={setSelectedCriancaId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as crianças" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as crianças</SelectItem>
                {criancas.map(crianca => (
                  <SelectItem key={crianca.id} value={crianca.id}>
                    {crianca.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {canCreate && (
              <>
                <Button onClick={() => setIsEventModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
                
                <Button variant="outline" onClick={() => setIsBulkEventModalOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Evento p/ Turma
                </Button>
              </>
            )}
          </div>
        </div>

        <WeekCalendar 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
        />

        <SummaryCards eventCounts={eventCounts} />

        <EventTimeline eventos={eventos} loading={loading} />
      </div>

      <EventDbModal 
        open={isEventModalOpen} 
        onOpenChange={setIsEventModalOpen}
        mode="individual"
        criancas={criancas}
        onSaved={fetchEventos}
      />
      
      <EventDbModal 
        open={isBulkEventModalOpen} 
        onOpenChange={setIsBulkEventModalOpen}
        mode="turma"
        onSaved={fetchEventos}
      />
    </MainLayout>
  );
};

export default Index;
