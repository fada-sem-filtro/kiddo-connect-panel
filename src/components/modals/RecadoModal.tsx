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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const recadoSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo obrigatório'),
  criancaId: z.string().optional(),
  turmaId: z.string().optional(),
});

type RecadoFormData = z.infer<typeof recadoSchema>;

interface RecadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'individual' | 'turma';
  onSaved?: () => void;
}

export function RecadoModal({ open, onOpenChange, mode, onSaved }: RecadoModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);

  const form = useForm<RecadoFormData>({
    resolver: zodResolver(recadoSchema),
    defaultValues: { titulo: '', conteudo: '', criancaId: '', turmaId: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({ titulo: '', conteudo: '', criancaId: '', turmaId: '' });
      
      if (mode === 'individual') {
        // Responsáveis only see their linked children
        const fetchCriancas = async () => {
          const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
          if (roleData === 'responsavel') {
            const { data: ids } = await supabase.rpc('get_crianca_ids_for_responsavel', { _user_id: user.id });
            if (ids && ids.length > 0) {
              const { data } = await supabase.from('criancas').select('id, nome').in('id', ids).order('nome');
              if (data) setCriancas(data);
            }
          } else {
            const { data } = await supabase.from('criancas').select('id, nome').order('nome');
            if (data) setCriancas(data);
          }
        };
        fetchCriancas();
      }
      
      supabase.from('turmas').select('id, nome').order('nome').then(({ data }) => {
        if (data) setTurmas(data);
      });
    }
  }, [open, form, user, mode]);

  const onSubmit = async (data: RecadoFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = {
        titulo: data.titulo,
        conteudo: data.conteudo,
        remetente_user_id: user.id,
      };
      if (mode === 'turma' && data.turmaId) {
        payload.turma_id = data.turmaId;
      } else if (data.criancaId) {
        payload.crianca_id = data.criancaId;
      }

      const { error } = await supabase.from('recados').insert(payload);
      if (error) throw error;
      toast.success(mode === 'turma' ? 'Recado enviado para a turma!' : 'Recado enviado!');
      onOpenChange(false);
      form.reset();
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar recado');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'turma' ? 'Recado para Turma' : 'Novo Recado'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'turma' ? (
              <FormField control={form.control} name="turmaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {turmas.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            ) : (
              <FormField control={form.control} name="criancaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Criança</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione a criança" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {criancas.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="titulo" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input placeholder="Assunto do recado" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="conteudo" render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem</FormLabel>
                <FormControl>
                  <Textarea placeholder="Escreva sua mensagem..." className="resize-none min-h-[120px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
