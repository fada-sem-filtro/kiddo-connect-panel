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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { EventType, EVENT_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';

const eventSchema = z.object({
  tipo: z.string().min(1, 'Selecione o tipo de evento'),
  criancaId: z.string().optional(),
  turmaId: z.string().optional(),
  observacao: z.string().optional(),
  dataInicio: z.string().min(1, 'Informe a data/hora de início'),
  dataFim: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'individual' | 'turma';
  editData?: EventFormData & { id: string };
  preSelectedCriancaId?: string;
  preSelectedTurmaId?: string;
}

export function EventModal({ open, onOpenChange, mode, editData, preSelectedCriancaId, preSelectedTurmaId }: EventModalProps) {
  const { criancas, turmas, addEvento, addEventoTurma, updateEvento } = useData();
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: editData || {
      tipo: '',
      criancaId: preSelectedCriancaId || '',
      turmaId: preSelectedTurmaId || '',
      observacao: '',
      dataInicio: new Date().toISOString().slice(0, 16),
      dataFim: '',
    },
  });

  // Reset form when modal opens with preselected values
  useEffect(() => {
    if (open) {
      form.reset({
        tipo: editData?.tipo || '',
        criancaId: preSelectedCriancaId || editData?.criancaId || '',
        turmaId: preSelectedTurmaId || editData?.turmaId || '',
        observacao: editData?.observacao || '',
        dataInicio: editData?.dataInicio || new Date().toISOString().slice(0, 16),
        dataFim: editData?.dataFim || '',
      });
    }
  }, [open, preSelectedCriancaId, preSelectedTurmaId, editData, form]);

  const onSubmit = (data: EventFormData) => {
    if (editData) {
      updateEvento(editData.id, {
        tipo: data.tipo as EventType,
        observacao: data.observacao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim || undefined,
      });
      toast.success('Evento atualizado com sucesso!');
    } else if (mode === 'turma' && data.turmaId) {
      addEventoTurma(data.turmaId, {
        tipo: data.tipo as EventType,
        observacao: data.observacao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim || undefined,
      });
      toast.success('Evento adicionado para toda a turma!');
    } else if (data.criancaId) {
      addEvento({
        tipo: data.tipo as EventType,
        criancaId: data.criancaId,
        observacao: data.observacao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim || undefined,
      });
      toast.success('Evento adicionado com sucesso!');
    }
    
    form.reset();
    onOpenChange(false);
  };

  const eventTypes = Object.entries(EVENT_TYPE_LABELS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Editar Evento' : mode === 'turma' ? 'Novo Evento para Turma' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'turma' ? (
              <FormField
                control={form.control}
                name="turmaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turmas.map((turma) => (
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
            ) : (
              <FormField
                control={form.control}
                name="criancaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criança</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a criança" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {criancas.map((crianca) => (
                          <SelectItem key={crianca.id} value={crianca.id}>
                            {crianca.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dataInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data/Hora Início</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                  <FormLabel>Data/Hora Fim (opcional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o evento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editData ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
