import { EventType, EVENT_TYPE_ICONS } from '@/types';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  eventCounts: Record<string, number>;
}

const summaryItems = [
  { type: 'ALIMENTACAO' as EventType, label: 'Refeições', className: 'summary-card-meal' },
  { type: 'SONECA' as EventType, label: 'Sonecas', className: 'summary-card-sleep' },
  { type: 'BRINCADEIRA' as EventType, label: 'Brincadeiras', className: 'summary-card-play' },
];

export function SummaryCards({ eventCounts }: SummaryCardsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📋</span>
        <h3 className="text-lg font-semibold">Resumo do Dia</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryItems.map((item) => (
          <div key={item.type} className={cn(item.className)}>
            <span className="text-2xl">{EVENT_TYPE_ICONS[item.type]}</span>
            <p className="text-2xl font-bold mt-2">{eventCounts[item.type] || 0}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
