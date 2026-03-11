import { EventoDb } from '@/hooks/useEventos';
import { EventCard } from './EventCard';

interface EventTimelineProps {
  eventos: EventoDb[];
  loading?: boolean;
}

export function EventTimeline({ eventos, loading }: EventTimelineProps) {
  const groupedEvents = eventos.reduce((acc, evento) => {
    const hour = new Date(evento.data_inicio).getHours();
    let period: string;
    
    if (hour < 12) {
      period = 'Manhã';
    } else if (hour < 18) {
      period = 'Tarde';
    } else {
      period = 'Noite';
    }
    
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(evento);
    return acc;
  }, {} as Record<string, EventoDb[]>);

  const periods = ['Manhã', 'Tarde', 'Noite'];

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="text-center py-8 text-muted-foreground">Carregando eventos...</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="space-y-6">
        {periods.map((period) => {
          const periodEvents = groupedEvents[period];
          if (!periodEvents?.length) return null;

          return (
            <div key={period}>
              <h3 className="text-lg font-bold mb-4">{period}</h3>
              <div className="space-y-3">
                {periodEvents.map((evento) => (
                  <EventCard key={evento.id} evento={evento} />
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum evento registrado para este dia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
