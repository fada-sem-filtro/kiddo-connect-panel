import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Baby, Clock, Utensils, Moon, Droplets, Gamepad2, BookOpen, ShowerHead, FileText } from 'lucide-react';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EVENT_TYPE_LABELS, EventType, EVENT_TYPE_ICONS } from '@/types';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  ALIMENTACAO: <Utensils className="h-4 w-4" />,
  SONECA: <Moon className="h-4 w-4" />,
  BRINCADEIRA: <Gamepad2 className="h-4 w-4" />,
  ATIVIDADE: <BookOpen className="h-4 w-4" />,
  HIGIENE: <ShowerHead className="h-4 w-4" />,
  OUTRO: <FileText className="h-4 w-4" />,
};

const EVENT_COLORS: Record<EventType, string> = {
  ALIMENTACAO: 'bg-kawaii-green/20 text-green-700 border-kawaii-green',
  SONECA: 'bg-kawaii-blue/20 text-blue-700 border-kawaii-blue',
  BRINCADEIRA: 'bg-kawaii-purple/20 text-purple-700 border-kawaii-purple',
  ATIVIDADE: 'bg-kawaii-pink/20 text-pink-700 border-kawaii-pink',
  HIGIENE: 'bg-kawaii-peach/20 text-orange-700 border-kawaii-peach',
  OUTRO: 'bg-kawaii-yellow/20 text-yellow-700 border-kawaii-yellow',
};

export default function ResponsavelEventosPage() {
  const { criancas, eventos, turmas } = useData();
  const [selectedCrianca, setSelectedCrianca] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filtrar crianças (em um app real, filtraria pelo responsável logado)
  const criancasDoResponsavel = criancas;

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(evento => {
    const matchesCrianca = selectedCrianca === 'all' || evento.criancaId === selectedCrianca;
    const eventoDate = parseISO(evento.dataInicio);
    const matchesDate = isSameDay(eventoDate, selectedDate);
    
    // Verificar se o evento pertence a uma criança do responsável
    const pertenceAoResponsavel = criancasDoResponsavel.some(c => c.id === evento.criancaId);
    
    return matchesCrianca && matchesDate && pertenceAoResponsavel;
  });

  // Agrupar eventos por criança
  const eventosPorCrianca = eventosFiltrados.reduce((acc, evento) => {
    const crianca = criancas.find(c => c.id === evento.criancaId);
    if (crianca) {
      if (!acc[crianca.id]) {
        acc[crianca.id] = { crianca, eventos: [] };
      }
      acc[crianca.id].eventos.push(evento);
    }
    return acc;
  }, {} as Record<string, { crianca: typeof criancas[0], eventos: typeof eventos }>);

  // Ordenar eventos por hora
  Object.values(eventosPorCrianca).forEach(group => {
    group.eventos.sort((a, b) => 
      new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
    );
  });

  const getTurmaName = (turmaId: string) => {
    return turmas.find(t => t.id === turmaId)?.nome || 'Sem turma';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">📋</span> Eventos das Crianças
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe todos os eventos e atividades do dia
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-[240px] rounded-2xl border-2",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    isToday(selectedDate) ? (
                      <span>Hoje - {format(selectedDate, "dd/MM", { locale: ptBR })}</span>
                    ) : (
                      format(selectedDate, "PPP", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-2xl"
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedCrianca} onValueChange={setSelectedCrianca}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-2xl border-2">
                <Baby className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as crianças" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Todas as crianças</SelectItem>
                {criancasDoResponsavel.map(crianca => (
                  <SelectItem key={crianca.id} value={crianca.id}>
                    {crianca.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Eventos */}
        {Object.keys(eventosPorCrianca).length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🌸</div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Nenhum evento registrado
              </h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Não há eventos para a data selecionada
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.values(eventosPorCrianca).map(({ crianca, eventos: criancaEventos }) => (
              <Card key={crianca.id} className="rounded-3xl border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-kawaii-pink/30 to-kawaii-purple/30 pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
                      {crianca.foto ? (
                        <img src={crianca.foto} alt={crianca.nome} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        '👶'
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{crianca.nome}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {getTurmaName(crianca.turmaId)} • {criancaEventos.length} evento{criancaEventos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {criancaEventos.map((evento) => (
                      <div
                        key={evento.id}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all hover:shadow-md",
                          EVENT_COLORS[evento.tipo]
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-white/60 shadow-sm">
                            {EVENT_ICONS[evento.tipo]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="rounded-full text-xs">
                                {EVENT_TYPE_LABELS[evento.tipo]}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(evento.dataInicio), 'HH:mm')}
                                {evento.dataFim && ` - ${format(parseISO(evento.dataFim), 'HH:mm')}`}
                              </span>
                            </div>
                            {evento.observacao && (
                              <p className="mt-2 text-sm text-foreground/80">
                                {evento.observacao}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Resumo do Dia */}
        {Object.keys(eventosPorCrianca).length > 0 && (
          <Card className="rounded-3xl border-2 bg-gradient-to-br from-kawaii-mint/20 to-kawaii-blue/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>📊</span> Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(
                  eventosFiltrados.reduce((acc, evento) => {
                    acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([tipo, count]) => (
                  <div
                    key={tipo}
                    className="flex items-center gap-2 p-3 rounded-2xl bg-white/60"
                  >
                    <div className="p-2 rounded-xl bg-white shadow-sm">
                      {EVENT_ICONS[tipo as EventType]}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {EVENT_TYPE_LABELS[tipo as EventType]}
                      </p>
                      <p className="font-bold">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
