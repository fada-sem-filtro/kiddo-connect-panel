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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PartyPopper } from 'lucide-react';

const feriadoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  recorrente: z.boolean(),
});

type FeriadoFormData = z.infer<typeof feriadoSchema>;

interface FeriadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feriado?: { id: string; nome: string; data: string; recorrente: boolean } | null;
  onSaved?: () => void;
}

export function FeriadoModal({ open, onOpenChange, feriado, onSaved }: FeriadoModalProps) {
  const isEditing = !!feriado;
  const [loading, setLoading] = useState(false);

  const form = useForm<FeriadoFormData>({
    resolver: zodResolver(feriadoSchema),
    defaultValues: { nome: '', data: '', recorrente: false },
  });

  useEffect(() => {
    if (feriado) {
      form.reset({ nome: feriado.nome, data: feriado.data, recorrente: feriado.recorrente });
    } else {
      form.reset({ nome: '', data: '', recorrente: false });
    }
  }, [feriado, form]);

  const onSubmit = async (data: FeriadoFormData) => {
    setLoading(true);
    try {
      if (isEditing && feriado) {
        const { error } = await supabase.from('feriados').update({
          nome: data.nome, data: data.data, recorrente: data.recorrente,
        } as any).eq('id', feriado.id);
        if (error) throw error;
        toast.success('Feriado atualizado!');
      } else {
        const { error } = await supabase.from('feriados').insert({
          nome: data.nome, data: data.data, recorrente: data.recorrente,
        } as any);
        if (error) throw error;
        toast.success('Feriado criado!');
      }
      onOpenChange(false);
      form.reset();
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar feriado');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PartyPopper className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Feriado' : 'Novo Feriado'} 🎉
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Feriado</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Carnaval" className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="data" render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl><Input {...field} type="date" className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="recorrente" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border-2 border-border p-4">
                <div>
                  <FormLabel className="text-base">Feriado Anual</FormLabel>
                  <p className="text-sm text-muted-foreground">Repetir todos os anos nesta data</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
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
