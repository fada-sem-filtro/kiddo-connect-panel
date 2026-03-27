import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Clock, CheckCircle2, XCircle, Mail, Phone, MapPin, School, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Orcamento {
  id: string;
  nome: string;
  escola: string;
  cidade: string;
  telefone: string | null;
  email: string;
  num_alunos: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrcamentoResposta {
  id: string;
  orcamento_id: string;
  admin_user_id: string;
  conteudo: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  respondido: { label: 'Respondido', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  arquivado: { label: 'Arquivado', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function OrcamentosPage() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [respostas, setRespostas] = useState<Record<string, OrcamentoResposta[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .order('created_at', { ascending: false });

    const orcList = (orc || []) as Orcamento[];
    setOrcamentos(orcList);

    if (orcList.length > 0) {
      const ids = orcList.map(o => o.id);
      const { data: resp } = await supabase
        .from('orcamento_respostas')
        .select('*')
        .in('orcamento_id', ids)
        .order('created_at', { ascending: true });

      const grouped: Record<string, OrcamentoResposta[]> = {};
      (resp || []).forEach((r: any) => {
        if (!grouped[r.orcamento_id]) grouped[r.orcamento_id] = [];
        grouped[r.orcamento_id].push(r as OrcamentoResposta);
      });
      setRespostas(grouped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenReply = (orc: Orcamento) => {
    setSelectedOrcamento(orc);
    setReplyContent('');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedOrcamento || !replyContent.trim() || !user) return;
    setSending(true);
    try {
      // Insert response
      const { error } = await supabase.from('orcamento_respostas').insert({
        orcamento_id: selectedOrcamento.id,
        admin_user_id: user.id,
        conteudo: replyContent.trim(),
      });
      if (error) throw error;

      // Update status to respondido
      await supabase.from('orcamentos').update({ status: 'respondido' }).eq('id', selectedOrcamento.id);

      // Send email via edge function
      const emailBody = `
Olá ${selectedOrcamento.nome},

${replyContent.trim()}

Atenciosamente,
Equipe Agenda Fleur
      `.trim();

      await supabase.functions.invoke('send-orcamento-email', {
        body: {
          to: selectedOrcamento.email,
          subject: `Resposta ao seu orçamento - Agenda Fleur`,
          text: emailBody,
          nome: selectedOrcamento.nome,
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
    await supabase.from('orcamentos').update({ status }).eq('id', id);
    fetchData();
  };

  const filtered = filterStatus === 'all' ? orcamentos : orcamentos.filter(o => o.status === filterStatus);
  const counts = {
    total: orcamentos.length,
    pendente: orcamentos.filter(o => o.status === 'pendente').length,
    respondido: orcamentos.filter(o => o.status === 'respondido').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamentos 🌸</h1>
            <p className="text-sm text-muted-foreground">Solicitações recebidas pela landing page</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><MessageSquare className="w-5 h-5 text-primary" /></div>
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
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma solicitação de orçamento encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(orc => {
              const st = STATUS_MAP[orc.status] || STATUS_MAP.pendente;
              const expanded = expandedId === orc.id;
              const orcRespostas = respostas[orc.id] || [];
              return (
                <Card key={orc.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{orc.nome}</h3>
                          <Badge variant="outline" className={st.color}>{st.label}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><School className="w-3.5 h-3.5" /> {orc.escola}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {orc.cidade}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {orc.email}</span>
                          {orc.telefone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {orc.telefone}</span>}
                          {orc.num_alunos && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {orc.num_alunos} alunos</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(orc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleOpenReply(orc)}>
                          <Send className="w-3.5 h-3.5 mr-1" /> Responder
                        </Button>
                        {orc.status !== 'arquivado' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(orc.id, 'arquivado')}>
                            Arquivar
                          </Button>
                        )}
                        {orc.status === 'arquivado' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(orc.id, 'pendente')}>
                            Reabrir
                          </Button>
                        )}
                        {orcRespostas.length > 0 && (
                          <Button size="sm" variant="ghost" onClick={() => setExpandedId(expanded ? null : orc.id)}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Responses */}
                    {expanded && orcRespostas.length > 0 && (
                      <div className="mt-4 border-t border-border pt-3 space-y-3">
                        <p className="text-sm font-medium text-foreground">Respostas enviadas:</p>
                        {orcRespostas.map(r => (
                          <div key={r.id} className="bg-muted/50 rounded-xl p-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{r.conteudo}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        ))}
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
            <DialogTitle>Responder Orçamento</DialogTitle>
            <DialogDescription>
              Enviando resposta para <strong>{selectedOrcamento?.nome}</strong> ({selectedOrcamento?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3 text-sm">
              <p><strong>Escola:</strong> {selectedOrcamento?.escola}</p>
              <p><strong>Cidade:</strong> {selectedOrcamento?.cidade}</p>
              {selectedOrcamento?.num_alunos && <p><strong>Alunos:</strong> {selectedOrcamento.num_alunos}</p>}
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
