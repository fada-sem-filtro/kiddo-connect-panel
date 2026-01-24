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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { Educador } from '@/types';
import { toast } from 'sonner';

const educadorSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone obrigatório'),
  turmaId: z.string().min(1, 'Turma obrigatória'),
});

type EducadorFormData = z.infer<typeof educadorSchema>;

interface EducadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Educador | null;
}

export function EducadorModal({ open, onOpenChange, editData }: EducadorModalProps) {
  const { turmas, addEducador, updateEducador } = useData();
  
  const form = useForm<EducadorFormData>({
    resolver: zodResolver(educadorSchema),
    defaultValues: editData ? {
      nome: editData.nome,
      email: editData.email,
      telefone: editData.telefone,
      turmaId: editData.turmaId,
    } : {
      nome: '',
      email: '',
      telefone: '',
      turmaId: '',
    },
  });

  const onSubmit = (data: EducadorFormData) => {
    const educadorData = {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      turmaId: data.turmaId,
    };

    if (editData) {
      updateEducador(editData.id, educadorData);
      toast.success('Educador atualizado com sucesso!');
    } else {
      addEducador(educadorData);
      toast.success('Educador cadastrado com sucesso!');
    }
    
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Editar Educador' : 'Novo Educador'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="email"
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

            <FormField
              control={form.control}
              name="telefone"
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
      </DialogContent>
    </Dialog>
  );
}
