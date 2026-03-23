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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Paperclip, X, FileText, Image } from 'lucide-react';

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

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function RecadoModal({ open, onOpenChange, mode, onSaved }: RecadoModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RecadoFormData>({
    resolver: zodResolver(recadoSchema),
    defaultValues: { titulo: '', conteudo: '', criancaId: '', turmaId: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({ titulo: '', conteudo: '', criancaId: '', turmaId: '' });
      setSelectedFile(null);
      
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
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async (file: File): Promise<{ url: string; tipo: string } | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from('recado-anexos')
      .upload(path, file, { contentType: file.type });

    if (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar anexo');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('recado-anexos')
      .getPublicUrl(path);

    const tipo = file.type === 'application/pdf' ? 'pdf' : 'imagem';
    return { url: urlData.publicUrl, tipo };
  };

  const onSubmit = async (data: RecadoFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      let anexo_url: string | null = null;
      let anexo_tipo: string | null = null;

      if (selectedFile) {
        const result = await uploadFile(selectedFile);
        if (result) {
          anexo_url = result.url;
          anexo_tipo = result.tipo;
        }
      }

      const payload: any = {
        titulo: data.titulo,
        conteudo: data.conteudo,
        remetente_user_id: user.id,
        remetente_nome: profile?.nome || 'Usuário',
        anexo_url,
        anexo_tipo,
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
      setSelectedFile(null);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar recado');
    }
    setLoading(false);
  };

  const isImage = selectedFile && selectedFile.type.startsWith('image/');

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

            {/* Attachment section */}
            <div className="space-y-2">
              <FormLabel>Anexo (opcional)</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                  {isImage ? (
                    <Image className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate flex-1">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Anexar PDF ou Foto
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WebP ou GIF. Máx. 10MB.</p>
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
