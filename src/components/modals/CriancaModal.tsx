import { useState } from 'react';
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
import { useData } from '@/contexts/DataContext';
import { Crianca } from '@/types';
import { toast } from 'sonner';

const responsavelSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().min(1, 'Telefone obrigatório'),
  email: z.string().email('Email inválido'),
  parentesco: z.string().min(1, 'Parentesco obrigatório'),
});

const criancaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  turmaId: z.string().min(1, 'Turma obrigatória'),
  observacoes: z.string().optional(),
  responsaveis: z.array(responsavelSchema).min(1, 'Adicione pelo menos um responsável'),
});

type CriancaFormData = z.infer<typeof criancaSchema>;

interface CriancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Crianca | null;
}

export function CriancaModal({ open, onOpenChange, editData }: CriancaModalProps) {
  const { turmas, addCrianca, updateCrianca } = useData();
  
  const form = useForm<CriancaFormData>({
    resolver: zodResolver(criancaSchema),
    defaultValues: editData ? {
      nome: editData.nome,
      dataNascimento: editData.dataNascimento,
      turmaId: editData.turmaId,
      observacoes: editData.observacoes || '',
      responsaveis: editData.responsaveis,
    } : {
      nome: '',
      dataNascimento: '',
      turmaId: '',
      observacoes: '',
      responsaveis: [{ id: '', nome: '', telefone: '', email: '', parentesco: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'responsaveis',
  });

  const onSubmit = (data: CriancaFormData) => {
    const responsaveisWithId = data.responsaveis.map((r, index) => ({
      id: r.id || `resp-${Date.now()}-${index}`,
      nome: r.nome,
      telefone: r.telefone,
      email: r.email,
      parentesco: r.parentesco,
    }));

    if (editData) {
      updateCrianca(editData.id, {
        nome: data.nome,
        dataNascimento: data.dataNascimento,
        turmaId: data.turmaId,
        observacoes: data.observacoes,
        responsaveis: responsaveisWithId,
      });
      toast.success('Criança atualizada com sucesso!');
    } else {
      addCrianca({
        nome: data.nome,
        dataNascimento: data.dataNascimento,
        turmaId: data.turmaId,
        observacoes: data.observacoes,
        responsaveis: responsaveisWithId,
      });
      toast.success('Criança cadastrada com sucesso!');
    }
    
    form.reset();
    onOpenChange(false);
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
              {/* Dados da Criança */}
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
                    name="dataNascimento"
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
                    name="turmaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Responsáveis */}
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
                    Adicionar
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
                <Button type="submit">
                  {editData ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
