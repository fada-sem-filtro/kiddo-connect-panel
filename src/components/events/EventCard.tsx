import { format } from 'date-fns';
import { EventoDb } from '@/hooks/useEventos';
import { EVENT_TYPE_LABELS, EventType } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Utensils, 
  Moon, 
  Gamepad2, 
  BookOpen, 
  Droplets, 
  MoreHorizontal 
} from 'lucide-react';

interface EventCardProps {
  evento: EventoDb;
  onEdit?: () => void;
  onDelete?: () => void;
}

const eventStyles: Record<string, string> = {
  ALIMENTACAO: 'event-card-meal',
  SONECA: 'event-card-sleep',
  BRINCADEIRA: 'event-card-play',
  ATIVIDADE: 'event-card-activity',
  HIGIENE: 'event-card-hygiene',
  OUTRO: 'event-card-other',
};

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ALIMENTACAO: Utensils,
  SONECA: Moon,
  BRINCADEIRA: Gamepad2,
  ATIVIDADE: BookOpen,
  HIGIENE: Droplets,
  OUTRO: MoreHorizontal,
};

const eventEmojis: Record<string, string> = {
  ALIMENTACAO: '🍽️',
  SONECA: '💤',
  BRINCADEIRA: '🎮',
  ATIVIDADE: '📚',
  HIGIENE: '🛁',
  OUTRO: '📝',
};

export function EventCard({ evento }: EventCardProps) {
  const time = format(new Date(evento.data_inicio), 'HH:mm');
  const Icon = eventIcons[evento.tipo] || MoreHorizontal;
  const label = EVENT_TYPE_LABELS[evento.tipo as EventType] || evento.tipo;

  return (
    <div className={cn(
      "rounded-2xl p-4 animate-fade-in kawaii-hover",
      eventStyles[evento.tipo] || 'event-card-other'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-card/60 shadow-sm">
          <Icon className="w-5 h-5 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm">
              {label}
            </h4>
            <span className="text-lg">{eventEmojis[evento.tipo] || '📋'}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {time}
            {evento.crianca_nome && ` · ${evento.crianca_nome}`}
            {evento.turma_nome && ` · ${evento.turma_nome}`}
          </p>
          {evento.observacao && (
            <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{evento.observacao}</p>
          )}
        </div>
      </div>
    </div>
  );
}
