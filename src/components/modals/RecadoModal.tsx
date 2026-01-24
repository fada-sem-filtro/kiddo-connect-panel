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
import { Recado } from '@/types';
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
  editData?: Recado | null;
}

export function RecadoModal({ open, onOpenChange, mode, editData }: RecadoModalProps) {
  const { criancas, turmas, addRecado, addRecadoTurma, updateRecado } = useData();
  
  const form = useForm<RecadoFormData>({
    resolver: zodResolver(recadoSchema),
    defaultValues: editData ? {
      titulo: editData.titulo,
      conteudo: editData.conteudo,
      criancaId: editData.criancaId || '',
      turmaId: editData.turmaId || '',
    } : {
      titulo: '',
      conteudo: '',
      criancaId: '',
      turmaId: '',
    },
  });

  const onSubmit = (data: RecadoFormData) => {
    if (editData) {
      updateRecado(editData.id, {
        titulo: data.titulo,
        conteudo: data.conteudo,
      });
      toast.success('Recado atualizado com sucesso!');
    } else if (mode === 'turma' && data.turmaId) {
      addRecadoTurma(data.turmaId, {
        titulo: data.titulo,
        conteudo: data.conteudo,
        remetenteId: '1', // Current user
        remetenteTipo: 'educador',
      });
      toast.success('Recado enviado para a turma!');
    } else if (data.criancaId) {
      addRecado({
        titulo: data.titulo,
        conteudo: data.conteudo,
        criancaId: data.criancaId,
        remetenteId: '1', // Current user
        remetenteTipo: 'educador',
      });
      toast.success('Recado enviado com sucesso!');
    }
    
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Editar Recado' : mode === 'turma' ? 'Recado para Turma' : 'Novo Recado'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Assunto do recado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Escreva sua mensagem..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editData ? 'Salvar' : 'Enviar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
