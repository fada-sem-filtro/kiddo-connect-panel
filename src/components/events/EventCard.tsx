import { format } from 'date-fns';
import { EventoDb } from '@/hooks/useEventos';
import {
  EVENT_TYPE_LABELS, EventType,
  TIPO_REFEICAO_LABELS, RESULTADO_REFEICAO_LABELS, TIPO_HIGIENE_LABELS,
  TipoRefeicao, ResultadoRefeicao, TipoHigiene,
} from '@/types';
import { cn } from '@/lib/utils';
import { 
  Utensils, Moon, Gamepad2, BookOpen, Droplets, 
  MoreHorizontal, Pill, DoorOpen 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  MEDICAMENTO: 'event-card-other',
  SAIDA: 'event-card-other',
  OUTRO: 'event-card-other',
};

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ALIMENTACAO: Utensils,
  SONECA: Moon,
  BRINCADEIRA: Gamepad2,
  ATIVIDADE: BookOpen,
  HIGIENE: Droplets,
  MEDICAMENTO: Pill,
  SAIDA: DoorOpen,
  OUTRO: MoreHorizontal,
};

const eventEmojis: Record<string, string> = {
  ALIMENTACAO: '🍽️',
  SONECA: '💤',
  BRINCADEIRA: '🎮',
  ATIVIDADE: '📚',
  HIGIENE: '🛁',
  MEDICAMENTO: '💊',
  SAIDA: '🚪',
  OUTRO: '📝',
};

export function EventCard({ evento }: EventCardProps) {
  const time = format(new Date(evento.data_inicio), 'HH:mm');
  const Icon = eventIcons[evento.tipo] || MoreHorizontal;
  const label = EVENT_TYPE_LABELS[evento.tipo as EventType] || evento.tipo;

  const renderDetails = () => {
    const details: React.ReactNode[] = [];

    if (evento.tipo === 'ALIMENTACAO') {
      if (evento.tipo_refeicao) {
        details.push(
          <Badge key="refeicao" variant="secondary" className="text-xs">
            {TIPO_REFEICAO_LABELS[evento.tipo_refeicao as TipoRefeicao] || evento.tipo_refeicao}
          </Badge>
        );
      }
      if (evento.resultado_refeicao) {
        details.push(
          <Badge key="resultado" variant="outline" className="text-xs">
            {RESULTADO_REFEICAO_LABELS[evento.resultado_refeicao as ResultadoRefeicao] || evento.resultado_refeicao}
          </Badge>
        );
      }
    }

    if (evento.tipo === 'HIGIENE' && evento.tipo_higiene) {
      const emoji = evento.tipo_higiene === 'banho' ? '🛁' : evento.tipo_higiene === 'xixi' ? '💧' : '💩';
      details.push(
        <Badge key="higiene" variant="secondary" className="text-xs">
          {emoji} {TIPO_HIGIENE_LABELS[evento.tipo_higiene as TipoHigiene] || evento.tipo_higiene}
        </Badge>
      );
    }

    if (evento.tipo === 'MEDICAMENTO') {
      if (evento.nome_medicamento) {
        details.push(
          <Badge key="med" variant="secondary" className="text-xs">
            {evento.nome_medicamento} {evento.dosagem ? `(${evento.dosagem})` : ''}
          </Badge>
        );
      }
      if (evento.administrado) {
        details.push(
          <Badge key="admin" variant="default" className="text-xs bg-green-600">
            ✓ Administrado
          </Badge>
        );
      } else {
        details.push(
          <Badge key="pending" variant="outline" className="text-xs text-orange-600 border-orange-300">
            Pendente
          </Badge>
        );
      }
    }

    if (evento.tipo === 'SAIDA' && evento.authorized_person_name) {
      details.push(
        <Badge key="pickup" variant="secondary" className="text-xs">
          Retirado por: {evento.authorized_person_name}
        </Badge>
      );
    }

    return details.length > 0 ? (
      <div className="flex flex-wrap gap-1 mt-2">{details}</div>
    ) : null;
  };

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
          {renderDetails()}
          {evento.observacao && (
            <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{evento.observacao}</p>
          )}
        </div>
      </div>
    </div>
  );
}
