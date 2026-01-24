import { useState, useMemo } from 'react';
import { addWeeks, subWeeks } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { SummaryCards } from '@/components/calendar/SummaryCards';
import { EventTimeline } from '@/components/events/EventTimeline';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventModal } from '@/components/modals/EventModal';
import { useData } from '@/contexts/DataContext';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCriancaId, setSelectedCriancaId] = useState<string>('all');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBulkEventModalOpen, setIsBulkEventModalOpen] = useState(false);
  
  const { criancas, eventos, turmas } = useData();

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const filteredEventos = useMemo(() => {
    return eventos.filter(evento => {
      const eventDate = new Date(evento.dataInicio).toDateString();
      const matchesDate = eventDate === selectedDate.toDateString();
      
      if (selectedCriancaId === 'all') return matchesDate;
      return matchesDate && evento.criancaId === selectedCriancaId;
    });
  }, [eventos, selectedDate, selectedCriancaId]);

  const eventCounts = useMemo(() => {
    return filteredEventos.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredEventos]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
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
            
            <Button onClick={() => setIsEventModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
            
            <Button variant="outline" onClick={() => setIsBulkEventModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Evento p/ Turma
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <WeekCalendar 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
        />

        {/* Summary */}
        <SummaryCards eventCounts={eventCounts} />

        {/* Timeline */}
        <EventTimeline eventos={filteredEventos} />
      </div>

      <EventModal 
        open={isEventModalOpen} 
        onOpenChange={setIsEventModalOpen}
        mode="individual"
      />
      
      <EventModal 
        open={isBulkEventModalOpen} 
        onOpenChange={setIsBulkEventModalOpen}
        mode="turma"
      />
    </MainLayout>
  );
};

export default Index;
