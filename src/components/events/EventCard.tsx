import { format } from 'date-fns';
import { Evento, EVENT_TYPE_LABELS, EventType } from '@/types';
import { cn } from '@/lib/utils';

interface EventCardProps {
  evento: Evento;
  onEdit?: () => void;
  onDelete?: () => void;
}

const eventStyles: Record<EventType, string> = {
  ALIMENTACAO: 'event-card-meal',
  SONECA: 'event-card-sleep',
  BRINCADEIRA: 'event-card-play',
  ATIVIDADE: 'event-card-activity',
  HIGIENE: 'event-card-meal',
  OUTRO: 'event-card-activity',
};

export function EventCard({ evento }: EventCardProps) {
  const time = format(new Date(evento.dataInicio), 'HH:mm');

  return (
    <div className={cn(
      "rounded-xl p-4 animate-fade-in",
      eventStyles[evento.tipo]
    )}>
      <h4 className="font-bold text-foreground uppercase tracking-wide text-sm">
        {EVENT_TYPE_LABELS[evento.tipo]}
      </h4>
      <p className="text-sm text-muted-foreground mt-1">{time}</p>
      {evento.observacao && (
        <p className="text-sm text-foreground/80 mt-2">{evento.observacao}</p>
      )}
    </div>
  );
}
