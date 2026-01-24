import { format } from 'date-fns';
import { Evento } from '@/types';
import { EventCard } from './EventCard';

interface EventTimelineProps {
  eventos: Evento[];
}

export function EventTimeline({ eventos }: EventTimelineProps) {
  // Group events by period (morning/afternoon/evening)
  const groupedEvents = eventos.reduce((acc, evento) => {
    const hour = new Date(evento.dataInicio).getHours();
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
  }, {} as Record<string, Evento[]>);

  const periods = ['Manhã', 'Tarde', 'Noite'];

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
