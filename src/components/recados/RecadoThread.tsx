import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, Reply, User, ImagePlus, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecadoDb } from '@/pages/RecadosPage';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

interface RecadoThreadProps {
  recado: RecadoDb;
  onChanged?: () => void;
}

function AnexoFoto({ url, tipo }: { url: string; tipo?: string | null }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!url || !tipo?.startsWith('image/')) return null;

  return (
    <>
      <div
        className="mt-3 cursor-pointer group relative inline-block"
        onClick={() => setFullscreen(true)}
      >
        <img
          src={url}
          alt="Foto anexada"
          className="max-w-xs max-h-48 rounded-xl border-2 border-border object-cover transition-transform group-hover:scale-[1.02] shadow-sm"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 rounded-xl transition-colors flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-background opacity-0 group-hover:opacity-80 transition-opacity" />
        </div>
      </div>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-4xl p-2 bg-background/95">
          <img
            src={url}
            alt="Foto anexada"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RecadoThread({ recado, onChanged }: RecadoThreadProps) {
  const { user, profile } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(recado.conteudo);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isSuporte = (nome?: string) => nome?.includes('Suporte') ?? false;

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setReplyFile(file);
    setReplyPreview(URL.createObjectURL(file));
  };

  const removeReplyFile = () => {
    setReplyFile(null);
    if (replyPreview) URL.revokeObjectURL(replyPreview);
    setReplyPreview(null);
    if (replyFileRef.current) replyFileRef.current.value = '';
  };

  const handleReply = async () => {
    if ((!replyText.trim() && !replyFile) || !user) return;
    setReplySending(true);
    try {
      const payload: any = {
        conteudo: replyText || '📷 Foto',
        remetente_user_id: user.id,
        remetente_nome: profile?.nome || 'Usuário',
        parent_id: recado.id,
        turma_id: recado.turma_id,
        crianca_id: recado.crianca_id,
      };

      if (replyFile) {
        const ext = replyFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('recado-anexos').upload(path, replyFile);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('recado-anexos').getPublicUrl(path);
        payload.anexo_url = publicUrl;
        payload.anexo_tipo = replyFile.type;
      }

      const { error } = await supabase.from('recados').insert(payload);
      if (error) throw error;
      setReplyText('');
      removeReplyFile();
      setIsReplying(false);
      toast.success('Resposta enviada!');
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar resposta');
    }
    setReplySending(false);
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
    <div className={cn(
      "rounded-2xl border shadow-sm overflow-hidden animate-fade-in",
      isSuporte(recado.remetente_nome) ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-card border-border"
    )}>
      <Accordion type="single" collapsible>
        <AccordionItem value="thread" className="border-0">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className={cn(
                  "text-sm",
                  isSuporte(recado.remetente_nome) ? "bg-blue-500 text-white" : "bg-primary/10 text-primary"
                )}>
                  {isSuporte(recado.remetente_nome) ? '🛟' : getInitials(recado.remetente_nome || 'US')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "font-semibold",
                    isSuporte(recado.remetente_nome) ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                  )}>
                    {isSuporte(recado.remetente_nome) ? 'Suporte' : (recado.remetente_nome || 'Usuário')}
                  </span>
                  {isSuporte(recado.remetente_nome) && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs border-0">Equipe</Badge>
                  )}
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

            {/* Show attached photo */}
            {(recado as any).anexo_url && (
              <AnexoFoto url={(recado as any).anexo_url} tipo={(recado as any).anexo_tipo} />
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
                
                {/* Reply photo attachment */}
                <input
                  ref={replyFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleReplyFileSelect}
                />
                {replyPreview ? (
                  <div className="relative inline-block">
                    <img src={replyPreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border-2 border-border" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={removeReplyFile}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => replyFileRef.current?.click()}>
                    <ImagePlus className="w-4 h-4" />
                    Anexar foto
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReply} disabled={replySending}>
                    {replySending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsReplying(false); removeReplyFile(); }}>Cancelar</Button>
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
                          {(resp as any).anexo_url && (
                            <AnexoFoto url={(resp as any).anexo_url} tipo={(resp as any).anexo_tipo} />
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
