import { useEffect, useState, useRef } from 'react';
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
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

async function uploadAnexo(file: File, userId: string): Promise<{ url: string; tipo: string }> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('recado-anexos').upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('recado-anexos').getPublicUrl(path);
  return { url: publicUrl, tipo: file.type };
}

export function RecadoModal({ open, onOpenChange, mode, onSaved }: RecadoModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RecadoFormData>({
    resolver: zodResolver(recadoSchema),
    defaultValues: { titulo: '', conteudo: '', criancaId: '', turmaId: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({ titulo: '', conteudo: '', criancaId: '', turmaId: '' });
      setSelectedFile(null);
      setFilePreview(null);
      
      if (mode === 'individual') {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: RecadoFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = {
        titulo: data.titulo,
        conteudo: data.conteudo,
        remetente_user_id: user.id,
        remetente_nome: profile?.nome || 'Usuário',
      };
      if (mode === 'turma' && data.turmaId) {
        payload.turma_id = data.turmaId;
      } else if (data.criancaId) {
        payload.crianca_id = data.criancaId;
      }

      if (selectedFile) {
        const { url, tipo } = await uploadAnexo(selectedFile, user.id);
        payload.anexo_url = url;
        payload.anexo_tipo = tipo;
      }

      const { error } = await supabase.from('recados').insert(payload);
      if (error) throw error;
      toast.success(mode === 'turma' ? 'Recado enviado para a turma!' : 'Recado enviado!');
      onOpenChange(false);
      form.reset();
      removeFile();
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
                  <FormLabel>Aluno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
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

            {/* Photo attachment */}
            <div className="space-y-2">
              <FormLabel>Foto (opcional)</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />
              {filePreview ? (
                <div className="relative inline-block">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-xl border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeFile}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4" />
                  Anexar foto
                </Button>
              )}
            </div>

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
