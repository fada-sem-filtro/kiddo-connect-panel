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
    <div className="kawaii-card bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        
        <h3 className="text-lg font-bold">Resumo do Dia</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryItems.map((item) =>
        <div key={item.type} className={cn(item.className, "text-center")}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <item.icon className="w-5 h-5 text-foreground/60" />
              
            </div>
            <p className="text-3xl font-bold">{eventCounts[item.type] || 0}</p>
            <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
          </div>
        )}
      </div>
    </div>);

}