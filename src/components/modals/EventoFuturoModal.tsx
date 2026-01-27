import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { EventoFuturo } from '@/types';
import { CalendarDays } from 'lucide-react';

const eventoFuturoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  turmaId: z.string().optional(),
});

type EventoFuturoFormData = z.infer<typeof eventoFuturoSchema>;

interface EventoFuturoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: EventoFuturo | null;
}

export function EventoFuturoModal({ open, onOpenChange, evento }: EventoFuturoModalProps) {
  const { addEventoFuturo, updateEventoFuturo, turmas } = useData();
  const isEditing = !!evento;

  const form = useForm<EventoFuturoFormData>({
    resolver: zodResolver(eventoFuturoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      dataInicio: '',
      dataFim: '',
      turmaId: '',
    },
  });

  useEffect(() => {
    if (evento) {
      form.reset({
        nome: evento.nome,
        descricao: evento.descricao || '',
        dataInicio: evento.dataInicio,
        dataFim: evento.dataFim || '',
        turmaId: evento.turmaId || '',
      });
    } else {
      form.reset({
        nome: '',
        descricao: '',
        dataInicio: '',
        dataFim: '',
        turmaId: '',
      });
    }
  }, [evento, form]);

  const onSubmit = (data: EventoFuturoFormData) => {
    const submitData = {
      nome: data.nome,
      dataInicio: data.dataInicio,
      turmaId: data.turmaId === 'all' || !data.turmaId ? undefined : data.turmaId,
      dataFim: data.dataFim || undefined,
      descricao: data.descricao || undefined,
    };

    if (isEditing && evento) {
      updateEventoFuturo(evento.id, submitData);
    } else {
      addEventoFuturo(submitData);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Evento' : 'Novo Evento'} 📅
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: Festa Junina"
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Detalhes do evento..."
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fim (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="turmaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {turmas.map(turma => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl kawaii-btn">
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
