import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, Edit, Trash2, Reply, User } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { Recado } from '@/types';
import { toast } from 'sonner';

interface RecadoThreadProps {
  recado: Recado;
}

export function RecadoThread({ recado }: RecadoThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(recado.conteudo);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  const { turmas, criancas, educadores, addResposta, updateRecado, deleteRecado } = useData();

  const turma = turmas.find(t => t.id === recado.turmaId);
  const crianca = criancas.find(c => c.id === recado.criancaId);
  const educador = educadores.find(e => e.id === recado.remetenteId);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    
    addResposta(recado.id, {
      titulo: '',
      conteudo: replyText,
      turmaId: recado.turmaId,
      criancaId: recado.criancaId,
      remetenteId: '1', // Current user
      remetenteTipo: 'educador',
    });
    
    setReplyText('');
    setIsReplying(false);
    toast.success('Resposta enviada!');
  };

  const handleEdit = () => {
    if (!editText.trim()) return;
    
    updateRecado(recado.id, { conteudo: editText });
    setIsEditing(false);
    toast.success('Recado atualizado!');
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteRecado(deleteTargetId);
      toast.success('Recado removido!');
    }
    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
      <Accordion type="single" collapsible>
        <AccordionItem value="thread" className="border-0">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(educador?.nome || 'ED')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {educador?.nome || 'Educador'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {recado.remetenteTipo === 'educador' ? 'Educador' : 'Responsável'}
                  </Badge>
                  {turma && (
                    <Badge variant="secondary" className="text-xs">
                      {turma.nome}
                    </Badge>
                  )}
                  {crianca && (
                    <Badge variant="outline" className="text-xs">
                      {crianca.nome}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(recado.createdAt)}
                </p>
              </div>

              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(recado.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Title */}
            {recado.titulo && (
              <h3 className="font-semibold text-foreground mb-2">{recado.titulo}</h3>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground/80 whitespace-pre-wrap">{recado.conteudo}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
              >
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

            {/* Reply Input */}
            {isReplying && (
              <div className="mt-4 pl-10 space-y-2">
                <Textarea 
                  placeholder="Escreva sua resposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReply}>Enviar</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Respostas */}
          {recado.respostas && recado.respostas.length > 0 && (
            <AccordionContent>
              <div className="border-t border-border bg-muted/30 px-4 py-2">
                <div className="space-y-4">
                  {recado.respostas.map((resposta) => (
                    <div key={resposta.id} className="thread-message pl-6 py-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {resposta.remetenteTipo === 'educador' ? 'Educador' : 'Responsável'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(resposta.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-1">{resposta.conteudo}</p>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(resposta.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
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
