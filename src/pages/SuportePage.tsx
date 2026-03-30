import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Send, Clock, CheckCircle2, XCircle, Mail, User, ChevronDown, ChevronUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SuporteMensagem {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  respondido: { label: 'Respondido', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  arquivado: { label: 'Arquivado', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function SuportePage() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<SuporteMensagem | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .order('created_at', { ascending: false });
    setMensagens((data || []) as SuporteMensagem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenReply = (msg: SuporteMensagem) => {
    setSelectedMsg(msg);
    setReplyContent('');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedMsg || !replyContent.trim() || !user) return;
    setSending(true);
    try {
      // Update status to respondido
      await supabase
        .from('suporte_mensagens')
        .update({ status: 'respondido' })
        .eq('id', selectedMsg.id);

      // Also create a recado for the user so they see it in Recados
      await supabase.from('recados').insert({
        conteudo: replyContent.trim(),
        remetente_user_id: user.id,
        remetente_nome: '🛟 Suporte',
        titulo: `Re: ${selectedMsg.assunto}`,
        crianca_id: null,
        turma_id: null,
      });

      // Send email via edge function
      const emailBody = `
Olá ${selectedMsg.nome},

Referente ao seu contato sobre "${selectedMsg.assunto}":

${replyContent.trim()}

Atenciosamente,
Equipe Agenda Fleur
      `.trim();

      await supabase.functions.invoke('send-orcamento-email', {
        body: {
          to: selectedMsg.email,
          subject: `Re: ${selectedMsg.assunto} - Suporte Agenda Fleur`,
          text: emailBody,
          nome: selectedMsg.nome,
          conteudo: replyContent.trim(),
        },
      });

      toast.success('Resposta enviada com sucesso!');
      setReplyModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao enviar resposta: ' + (err.message || 'Tente novamente'));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('suporte_mensagens').update({ status }).eq('id', id);
    fetchData();
  };

  const filtered = filterStatus === 'all' ? mensagens : mensagens.filter(m => m.status === filterStatus);
  const counts = {
    total: mensagens.length,
    pendente: mensagens.filter(m => m.status === 'pendente').length,
    respondido: mensagens.filter(m => m.status === 'respondido').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte 💬</h1>
          <p className="text-sm text-muted-foreground">Mensagens de suporte recebidas dos usuários</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><HelpCircle className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{counts.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-100"><Clock className="w-5 h-5 text-yellow-700" /></div>
              <div>
                <p className="text-2xl font-bold">{counts.pendente}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100"><CheckCircle2 className="w-5 h-5 text-green-700" /></div>
              <div>
                <p className="text-2xl font-bold">{counts.respondido}</p>
                <p className="text-xs text-muted-foreground">Respondidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="respondido">Respondidos</SelectItem>
              <SelectItem value="arquivado">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma mensagem de suporte encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => {
              const st = STATUS_MAP[msg.status] || STATUS_MAP.pendente;
              const expanded = expandedId === msg.id;
              return (
                <Card key={msg.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{msg.assunto}</h3>
                          <Badge variant="outline" className={st.color}>{st.label}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {msg.nome}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {msg.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleOpenReply(msg)}>
                          <Send className="w-3.5 h-3.5 mr-1" /> Responder
                        </Button>
                        {msg.status !== 'arquivado' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(msg.id, 'arquivado')}>
                            Arquivar
                          </Button>
                        )}
                        {msg.status === 'arquivado' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(msg.id, 'pendente')}>
                            Reabrir
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(expanded ? null : msg.id)}>
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded message */}
                    {expanded && (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="text-sm font-medium text-foreground mb-2">Mensagem:</p>
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.mensagem}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Suporte</DialogTitle>
            <DialogDescription>
              Enviando resposta para <strong>{selectedMsg?.nome}</strong> ({selectedMsg?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3 text-sm space-y-1">
              <p><strong>Assunto:</strong> {selectedMsg?.assunto}</p>
              <p><strong>Mensagem:</strong></p>
              <p className="whitespace-pre-wrap text-muted-foreground">{selectedMsg?.mensagem}</p>
            </div>
            <Textarea
              placeholder="Digite sua resposta..."
              rows={6}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReplyModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSendReply} disabled={!replyContent.trim() || sending}>
                <Send className="w-4 h-4 mr-1" /> {sending ? 'Enviando...' : 'Enviar resposta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
