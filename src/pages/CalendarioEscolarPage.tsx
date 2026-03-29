import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PartyPopper, CalendarDays } from 'lucide-react';
import {
  format,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Feriado {
  id: string;
  nome: string;
  data: string;
  recorrente: boolean;
}

interface EventoFuturo {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  turma_id: string | null;
}

export default function CalendarioEscolarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [eventos, setEventos] = useState<EventoFuturo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [feriadosRes, eventosRes] = await Promise.all([
        supabase.from('feriados').select('*').order('data'),
        supabase.from('eventos_futuros').select('*').order('data_inicio'),
      ]);
      if (feriadosRes.data) setFeriados(feriadosRes.data);
      if (eventosRes.data) setEventos(eventosRes.data);
    };
    fetchData();
  }, []);

  // Build lookup maps for the selected year
  const feriadosByDate = useMemo(() => {
    const map = new Map<string, Feriado[]>();
    feriados.forEach((f) => {
      const d = f.recorrente
        ? `${year}-${f.data.substring(5)}`
        : f.data;
      if (d.startsWith(String(year))) {
        const key = d;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(f);
      }
    });
    return map;
  }, [feriados, year]);

  const eventosByDate = useMemo(() => {
    const map = new Map<string, EventoFuturo[]>();
    eventos.forEach((ev) => {
      const start = parseISO(ev.data_inicio);
      const end = ev.data_fim ? parseISO(ev.data_fim) : start;
      const yearStart = startOfYear(new Date(year, 0));
      const yearEnd = endOfYear(new Date(year, 0));

      let cursor = start < yearStart ? yearStart : start;
      const limit = end > yearEnd ? yearEnd : end;

      while (cursor <= limit) {
        const key = format(cursor, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(ev);
        cursor = addDays(cursor, 1);
      }
    });
    return map;
  }, [eventos, year]);

  // Items for selected date
  const selectedItems = useMemo(() => {
    if (!selectedDate) return { feriados: [], eventos: [] };
    const key = format(selectedDate, 'yyyy-MM-dd');
    return {
      feriados: feriadosByDate.get(key) || [],
      eventos: eventosByDate.get(key) || [],
    };
  }, [selectedDate, feriadosByDate, eventosByDate]);

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">📅</span> Calendário Escolar
          </h1>
          <p className="text-muted-foreground mt-1">
            Feriados e eventos da escola
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold">{year}</span>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-destructive inline-block" />
            Feriado
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-primary inline-block" />
            Evento escolar
          </div>
        </div>

        {/* Annual grid */}
        {expandedMonth !== null ? (
          <MonthExpandedView
            monthDate={new Date(year, expandedMonth, 1)}
            feriadosByDate={feriadosByDate}
            eventosByDate={eventosByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onCollapse={() => setExpandedMonth(null)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((monthDate) => (
              <MonthMiniCalendar
                key={monthDate.getMonth()}
                monthDate={monthDate}
                feriadosByDate={feriadosByDate}
                eventosByDate={eventosByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onExpand={() => setExpandedMonth(monthDate.getMonth())}
              />
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selectedDate && (selectedItems.feriados.length > 0 || selectedItems.eventos.length > 0) && (
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedItems.feriados.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                  <PartyPopper className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{f.nome}</p>
                    {f.recorrente && <Badge variant="outline" className="text-xs mt-1">Recorrente</Badge>}
                  </div>
                </div>
              ))}
              {selectedItems.eventos.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{ev.nome}</p>
                    {ev.descricao && <p className="text-xs text-muted-foreground mt-1">{ev.descricao}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(ev.data_inicio), 'dd/MM')}
                      {ev.data_fim && ` – ${format(parseISO(ev.data_fim), 'dd/MM')}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

/* ---------- Mini month calendar ---------- */

interface MonthMiniCalendarProps {
  monthDate: Date;
  feriadosByDate: Map<string, Feriado[]>;
  eventosByDate: Map<string, EventoFuturo[]>;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}

function MonthMiniCalendar({ monthDate, feriadosByDate, eventosByDate, selectedDate, onSelectDate }: MonthMiniCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = calStart;
  while (cursor <= calEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-bold capitalize text-center">
          {format(monthDate, 'MMMM', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {weekDays.map((d, i) => (
            <span key={i} className="text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </span>
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, monthDate);
            const hasFeriado = feriadosByDate.has(key);
            const hasEvento = eventosByDate.has(key);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={key}
                onClick={() => inMonth && (hasFeriado || hasEvento) && onSelectDate(day)}
                disabled={!inMonth || (!hasFeriado && !hasEvento)}
                className={cn(
                  'relative w-full aspect-square flex items-center justify-center text-[11px] rounded-md transition-colors',
                  !inMonth && 'text-muted-foreground/30',
                  inMonth && !hasFeriado && !hasEvento && 'text-foreground',
                  inMonth && (hasFeriado || hasEvento) && 'cursor-pointer font-bold hover:bg-muted',
                  isToday && 'ring-1 ring-primary',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {format(day, 'd')}
                {inMonth && (hasFeriado || hasEvento) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {hasFeriado && <span className="w-1 h-1 rounded-full bg-destructive" />}
                    {hasEvento && <span className="w-1 h-1 rounded-full bg-primary" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
