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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  turmaId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EventoFuturoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: { id: string; nome: string; descricao: string | null; data_inicio: string; data_fim: string | null; turma_id: string | null } | null;
  onSaved?: () => void;
}

export function EventoFuturoModal({ open, onOpenChange, evento, onSaved }: EventoFuturoModalProps) {
  const isEditing = !!evento;
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', descricao: '', dataInicio: '', dataFim: '', turmaId: '' },
  });

  useEffect(() => {
    if (open) {
      supabase.from('turmas').select('id, nome').order('nome').then(({ data }) => {
        if (data) setTurmas(data);
      });
      if (evento) {
        form.reset({
          nome: evento.nome,
          descricao: evento.descricao || '',
          dataInicio: evento.data_inicio,
          dataFim: evento.data_fim || '',
          turmaId: evento.turma_id || '',
        });
      } else {
        form.reset({ nome: '', descricao: '', dataInicio: '', dataFim: '', turmaId: '' });
      }
    }
  }, [open, evento, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = {
      nome: data.nome,
      descricao: data.descricao || null,
      data_inicio: data.dataInicio,
      data_fim: data.dataFim || null,
      turma_id: data.turmaId && data.turmaId !== 'all' ? data.turmaId : null,
    };
    try {
      if (isEditing && evento) {
        const { error } = await supabase.from('eventos_futuros').update(payload as any).eq('id', evento.id);
        if (error) throw error;
        toast.success('Evento atualizado!');
      } else {
        const { error } = await supabase.from('eventos_futuros').insert(payload as any);
        if (error) throw error;
        toast.success('Evento criado!');
      }
      onOpenChange(false);
      form.reset();
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar evento');
    }
    setLoading(false);
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
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Evento</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Festa Junina" className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl><Textarea {...field} placeholder="Detalhes do evento..." className="rounded-xl resize-none" rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dataInicio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Início</FormLabel>
                  <FormControl><Input {...field} type="date" className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dataFim" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Fim (opcional)</FormLabel>
                  <FormControl><Input {...field} type="date" className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="turmaId" render={({ field }) => (
              <FormItem>
                <FormLabel>Turma</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione uma turma" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {turmas.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl kawaii-btn" disabled={loading}>
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
