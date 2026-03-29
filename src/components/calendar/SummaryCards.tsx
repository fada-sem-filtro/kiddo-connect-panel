import { EventType } from '@/types';
import { cn } from '@/lib/utils';
import { Utensils, Moon, Gamepad2, BookOpen } from 'lucide-react';

interface SummaryCardsProps {
  eventCounts: Record<string, number>;
}

const summaryItems = [
{
  type: 'ALIMENTACAO' as EventType,
  label: 'Refeições',
  className: 'summary-card-meal',
  icon: Utensils,
  emoji: '🍽️'
},
{
  type: 'SONECA' as EventType,
  label: 'Sonecas',
  className: 'summary-card-sleep',
  icon: Moon,
  emoji: '💤'
},
{
  type: 'BRINCADEIRA' as EventType,
  label: 'Brincadeiras',
  className: 'summary-card-play',
  icon: Gamepad2,
  emoji: '🎮'
},
{
  type: 'ATIVIDADE' as EventType,
  label: 'Atividades',
  className: 'summary-card-activity',
  icon: BookOpen,
  emoji: '📚'
}];


export function SummaryCards({ eventCounts }: SummaryCardsProps) {
  return (
    <div className="kawaii-card bg-card p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold">Resumo do Dia</h3>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {summaryItems.map((item) =>
        <div key={item.type} className={cn(item.className, "text-center")}>
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/60" />
            </div>
            <p className="text-xl sm:text-3xl font-bold">{eventCounts[item.type] || 0}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">{item.label}</p>
          </div>
        )}
      </div>
    </div>);

}