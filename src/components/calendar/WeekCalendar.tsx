import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

export function WeekCalendar({ selectedDate, onDateSelect, onWeekChange }: WeekCalendarProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const monthYear = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="icon"
          className="rounded-xl"
          onClick={() => onWeekChange('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">{monthYear}</h2>
        <Button 
          variant="outline" 
          size="icon"
          className="rounded-xl"
          onClick={() => onWeekChange('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const dayName = format(day, 'EEE', { locale: ptBR });
          const dayNumber = format(day, 'd');

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "day-pill",
                isSelected ? "day-pill-active" : "day-pill-inactive"
              )}
            >
              <span className="text-xs font-medium opacity-70">{dayName}.</span>
              <span className="text-lg font-bold">{dayNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
