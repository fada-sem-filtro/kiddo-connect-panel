import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, Reply, User, FileText, Image, Paperclip, X, Download } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecadoDb } from '@/pages/RecadosPage';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface RecadoThreadProps {
  recado: RecadoDb;
  onChanged?: () => void;
}

function AttachmentDisplay({ url, tipo }: { url: string; tipo: string }) {
  if (tipo === 'imagem') {
    return (
      <div className="mt-3">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-xs">
          <img
            src={url}
            alt="Anexo"
            className="rounded-xl border border-border max-h-48 object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border hover:bg-muted transition-colors text-sm"
    >
      <FileText className="w-4 h-4 text-destructive" />
      <span className="text-foreground">Documento PDF</span>
      <Download className="w-4 h-4 text-muted-foreground" />
    </a>
  );
}

export function RecadoThread({ recado, onChanged }: RecadoThreadProps) {
  const { user, profile } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(recado.conteudo);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo não permitido. Use PDF, JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    setReplyFile(file);
  };

  const uploadFile = async (file: File): Promise<{ url: string; tipo: string } | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('recado-anexos')
      .upload(path, file, { contentType: file.type });
    if (error) {
      toast.error('Erro ao enviar anexo');
      return null;
    }
    const { data: urlData } = supabase.storage.from('recado-anexos').getPublicUrl(path);
    return { url: urlData.publicUrl, tipo: file.type === 'application/pdf' ? 'pdf' : 'imagem' };
  };

  const handleReply = async () => {
    if ((!replyText.trim() && !replyFile) || !user) return;
    setReplySending(true);

    let anexo_url: string | null = null;
    let anexo_tipo: string | null = null;
    if (replyFile) {
      const result = await uploadFile(replyFile);
      if (result) {
        anexo_url = result.url;
        anexo_tipo = result.tipo;
      }
    }

    const { error } = await supabase.from('recados').insert({
      conteudo: replyText || (anexo_tipo === 'pdf' ? '📎 Documento anexado' : '📷 Foto anexada'),
      remetente_user_id: user.id,
      remetente_nome: profile?.nome || 'Usuário',
      parent_id: recado.id,
      turma_id: recado.turma_id,
      crianca_id: recado.crianca_id,
      anexo_url,
      anexo_tipo,
    } as any);
    if (error) { toast.error('Erro ao enviar resposta'); setReplySending(false); return; }
    setReplyText('');
    setReplyFile(null);
    setIsReplying(false);
    setReplySending(false);
    toast.success('Resposta enviada!');
    onChanged?.();
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    const { error } = await supabase.from('recados').update({ conteudo: editText } as any).eq('id', recado.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setIsEditing(false);
    toast.success('Recado atualizado!');
    onChanged?.();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase.from('recados').delete().eq('id', deleteTargetId);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Recado removido!');
    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
    onChanged?.();
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
      <Accordion type="single" collapsible>
        <AccordionItem value="thread" className="border-0">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(recado.remetente_nome || 'US')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{recado.remetente_nome || 'Usuário'}</span>
                  {recado.turma_nome && <Badge variant="secondary" className="text-xs">{recado.turma_nome}</Badge>}
                  {recado.crianca_nome && <Badge variant="outline" className="text-xs">{recado.crianca_nome}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(recado.created_at)}</p>
              </div>
              {user?.id === recado.remetente_user_id && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setDeleteTargetId(recado.id); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {recado.titulo && <h3 className="font-semibold text-foreground mb-2">{recado.titulo}</h3>}

            {isEditing ? (
              <div className="space-y-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground/80 whitespace-pre-wrap">{recado.conteudo}</p>
            )}

            {recado.anexo_url && recado.anexo_tipo && (
              <AttachmentDisplay url={recado.anexo_url} tipo={recado.anexo_tipo} />
            )}

            <div className="flex items-center gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
                <Reply className="w-4 h-4 mr-2" />
                Responder
              </Button>
              {recado.respostas && recado.respostas.length > 0 && (
                <AccordionTrigger className="py-0 hover:no-underline">
                  <Badge variant="secondary" className="text-xs">
                    {recado.respostas.length} resposta(s)
                  </Badge>
                </AccordionTrigger>
              )}
            </div>

            {isReplying && (
              <div className="mt-4 pl-10 space-y-2">
                <Textarea placeholder="Escreva sua resposta..." value={replyText}
                  onChange={(e) => setReplyText(e.target.value)} className="resize-none" />
                
                <input
                  ref={replyFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={handleReplyFileSelect}
                  className="hidden"
                />

                {replyFile ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border text-sm">
                    {replyFile.type.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="truncate flex-1">{replyFile.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5"
                      onClick={() => { setReplyFile(null); if (replyFileRef.current) replyFileRef.current.value = ''; }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => replyFileRef.current?.click()}>
                    <Paperclip className="w-4 h-4 mr-1" />
                    Anexar
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReply} disabled={replySending}>
                    {replySending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsReplying(false); setReplyFile(null); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>

          {recado.respostas && recado.respostas.length > 0 && (
            <AccordionContent>
              <div className="border-t border-border bg-muted/30 px-4 py-2">
                <div className="space-y-4">
                  {recado.respostas.map((resp) => (
                    <div key={resp.id} className="thread-message pl-6 py-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{resp.remetente_nome || 'Usuário'}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(resp.created_at)}</span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-1">{resp.conteudo}</p>
                          {resp.anexo_url && resp.anexo_tipo && (
                            <AttachmentDisplay url={resp.anexo_url} tipo={resp.anexo_tipo} />
                          )}
                        </div>
                        {user?.id === resp.remetente_user_id && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => { setDeleteTargetId(resp.id); setIsDeleteDialogOpen(true); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este recado? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
