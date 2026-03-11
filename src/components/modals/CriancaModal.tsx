import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, UserPlus } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useData } from '@/contexts/DataContext';
import { Crianca, Responsavel } from '@/types';
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
  const { turmas, criancas, addCrianca, updateCrianca } = useData();
  const [existingPopoverOpen, setExistingPopoverOpen] = useState(false);
  
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

  // Get all unique existing responsáveis from other crianças
  const existingResponsaveis = useMemo(() => {
    const map = new Map<string, Responsavel & { criancaNome: string }>();
    criancas.forEach(c => {
      if (editData && c.id === editData.id) return;
      c.responsaveis.forEach(r => {
        if (!map.has(r.email)) {
          map.set(r.email, { ...r, criancaNome: c.nome });
        }
      });
    });
    return Array.from(map.values());
  }, [criancas, editData]);

  const handleAddExisting = (resp: Responsavel) => {
    // Check if already added
    const current = form.getValues('responsaveis');
    if (current.some(r => r.email === resp.email)) {
      toast.info('Este responsável já foi adicionado');
      return;
    }
    append({
      id: resp.id,
      nome: resp.nome,
      telefone: resp.telefone,
      email: resp.email,
      parentesco: resp.parentesco,
    });
    setExistingPopoverOpen(false);
    toast.success(`${resp.nome} adicionado(a)`);
  };

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
                  <div className="flex gap-2">
                    {existingResponsaveis.length > 0 && (
                      <Popover open={existingPopoverOpen} onOpenChange={setExistingPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Vincular Existente
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <div className="p-3 border-b border-border">
                            <p className="text-sm font-semibold">Responsáveis Cadastrados</p>
                            <p className="text-xs text-muted-foreground">Selecione para vincular a esta criança</p>
                          </div>
                          <ScrollArea className="max-h-60">
                            <div className="p-2 space-y-1">
                              {existingResponsaveis.map((resp) => (
                                <button
                                  key={resp.email}
                                  type="button"
                                  className="w-full text-left p-3 rounded-xl hover:bg-muted transition-colors"
                                  onClick={() => handleAddExisting(resp)}
                                >
                                  <p className="text-sm font-medium">{resp.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {resp.parentesco} • {resp.email} • Resp. de {resp.criancaNome}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    )}
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