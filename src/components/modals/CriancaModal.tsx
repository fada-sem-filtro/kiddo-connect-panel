import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const responsavelSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido'),
  parentesco: z.string().min(1, 'Parentesco obrigatório'),
});

const criancaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  turma_id: z.string().min(1, 'Turma obrigatória'),
  observacoes: z.string().optional(),
  email_aluno: z.string().email('Email inválido').optional().or(z.literal('')),
  responsaveis: z.array(responsavelSchema).min(1, 'Adicione pelo menos um responsável'),
});

type CriancaFormData = z.infer<typeof criancaSchema>;

function calcAge(dateStr: string): number {
  if (!dateStr) return 0;
  const birth = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface CriancaEditData {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string;
  observacoes: string | null | undefined;
  responsaveis: { id: string; nome: string; telefone: string; email: string; parentesco: string }[];
}

interface CriancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: CriancaEditData | null;
  turmas: { id: string; nome: string; descricao?: string }[];
  onSaved?: () => void;
}

export function CriancaModal({ open, onOpenChange, editData, turmas, onSaved }: CriancaModalProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<CriancaFormData>({
    resolver: zodResolver(criancaSchema),
    defaultValues: {
      nome: '',
      data_nascimento: '',
      turma_id: '',
      observacoes: '',
      responsaveis: [{ id: '', nome: '', telefone: '', email: '', parentesco: '' }],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(editData ? {
        nome: editData.nome,
        data_nascimento: editData.data_nascimento,
        turma_id: editData.turma_id,
        observacoes: editData.observacoes || '',
        responsaveis: editData.responsaveis.length > 0
          ? editData.responsaveis
          : [{ id: '', nome: '', telefone: '', email: '', parentesco: '' }],
      } : {
        nome: '',
        data_nascimento: '',
        turma_id: '',
        observacoes: '',
        responsaveis: [{ id: '', nome: '', telefone: '', email: '', parentesco: '' }],
      });
    }
  }, [open, editData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'responsaveis',
  });

  const onSubmit = async (data: CriancaFormData) => {
    setSaving(true);
    try {
      if (editData) {
        // Update crianca
        const { error } = await supabase
          .from('criancas')
          .update({
            nome: data.nome,
            data_nascimento: data.data_nascimento,
            turma_id: data.turma_id,
            observacoes: data.observacoes || null,
          })
          .eq('id', editData.id);

        if (error) throw error;

        // Sync responsaveis: delete old, insert new
        await supabase.from('crianca_responsaveis').delete().eq('crianca_id', editData.id);

        for (const resp of data.responsaveis) {
          // Find or create profile for responsavel by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', resp.email)
            .maybeSingle();

          if (profile) {
            await supabase.from('crianca_responsaveis').insert({
              crianca_id: editData.id,
              responsavel_user_id: profile.user_id,
              parentesco: resp.parentesco,
            });
          }
        }

        toast.success('Criança atualizada com sucesso!');
      } else {
        // Insert crianca
        const { data: newCrianca, error } = await supabase
          .from('criancas')
          .insert({
            nome: data.nome,
            data_nascimento: data.data_nascimento,
            turma_id: data.turma_id,
            observacoes: data.observacoes || null,
          })
          .select('id')
          .single();

        if (error) throw error;

        // Link responsaveis
        for (const resp of data.responsaveis) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', resp.email)
            .maybeSingle();

          if (profile) {
            await supabase.from('crianca_responsaveis').insert({
              crianca_id: newCrianca.id,
              responsavel_user_id: profile.user_id,
              parentesco: resp.parentesco,
            });
          }
        }

        toast.success('Criança cadastrada com sucesso!');
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar criança');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Editar Criança' : 'Nova Criança'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Dados da Criança</h3>
                
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="turma_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Alergias, restrições alimentares, etc..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Responsáveis</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id: '', nome: '', telefone: '', email: '', parentesco: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border rounded-xl space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Responsável {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`responsaveis.${index}.nome`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responsaveis.${index}.parentesco`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parentesco</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Mãe, Pai, Avó..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responsaveis.${index}.telefone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responsaveis.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editData ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
