import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVENT_TYPE_LABELS } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface CriancaOption {
  id: string;
  nome: string;
}

interface TurmaOption {
  id: string;
  nome: string;
}

interface EventDbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'individual' | 'turma';
  preSelectedCriancaId?: string;
  preSelectedTurmaId?: string;
  criancas?: CriancaOption[];
  turmas?: TurmaOption[];
  onSaved?: () => void;
}

export function EventDbModal({
  open, onOpenChange, mode, preSelectedCriancaId, preSelectedTurmaId,
  criancas: criancasProp, turmas: turmasProp, onSaved,
}: EventDbModalProps) {
  const { user } = useAuth();
  const [criancas, setCriancas] = useState<CriancaOption[]>(criancasProp || []);
  const [turmas, setTurmas] = useState<TurmaOption[]>(turmasProp || []);
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      tipo: '',
      criancaId: preSelectedCriancaId || '',
      turmaId: preSelectedTurmaId || '',
      observacao: '',
      dataInicio: new Date().toISOString().slice(0, 16),
      dataFim: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: '',
        criancaId: preSelectedCriancaId || '',
        turmaId: preSelectedTurmaId || '',
        observacao: '',
        dataInicio: new Date().toISOString().slice(0, 16),
        dataFim: '',
      });

      // Fetch criancas/turmas if not provided
      if (!criancasProp) {
        supabase.from('criancas').select('id, nome').order('nome').then(({ data }) => {
          if (data) setCriancas(data);
        });
      }
      if (!turmasProp) {
        supabase.from('turmas').select('id, nome').order('nome').then(({ data }) => {
          if (data) setTurmas(data);
        });
      }
    }
  }, [open, preSelectedCriancaId, preSelectedTurmaId]);

  useEffect(() => {
    if (criancasProp) setCriancas(criancasProp);
  }, [criancasProp]);

  useEffect(() => {
    if (turmasProp) setTurmas(turmasProp);
  }, [turmasProp]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      if (mode === 'turma' && data.turmaId) {
        const { data: criancasTurma } = await supabase
          .from('criancas')
          .select('id')
          .eq('turma_id', data.turmaId);

        if (!criancasTurma || criancasTurma.length === 0) {
          toast.error('Nenhum aluno na turma');
          setLoading(false);
          return;
        }

        const rows = criancasTurma.map(c => ({
          tipo: data.tipo,
          crianca_id: c.id,
          observacao: data.observacao || null,
          data_inicio: data.dataInicio,
          data_fim: data.dataFim || null,
          educador_user_id: user?.id || null,
        }));

        const { error } = await supabase.from('eventos').insert(rows);
        if (error) throw error;
        toast.success('Evento adicionado para toda a turma!');
      } else if (data.criancaId) {
        const { error } = await supabase.from('eventos').insert({
          tipo: data.tipo,
          crianca_id: data.criancaId,
          observacao: data.observacao || null,
          data_inicio: data.dataInicio,
          data_fim: data.dataFim || null,
          educador_user_id: user?.id || null,
        });
        if (error) throw error;
        toast.success('Evento adicionado!');
      }

      form.reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar evento');
    }
    setLoading(false);
  };

  const eventTypes = Object.entries(EVENT_TYPE_LABELS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'turma' ? 'Novo Evento para Turma' : 'Novo Evento'}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turmas.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
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
                    <FormLabel>Aluno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {criancas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
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
                    <Textarea placeholder="Descreva o evento..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
