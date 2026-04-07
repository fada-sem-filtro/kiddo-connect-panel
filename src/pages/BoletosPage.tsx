import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt, Plus, Pencil, Trash2, Copy, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BoletoModal from '@/components/modals/BoletoModal';

interface Turma { id: string; nome: string; }
interface Crianca { id: string; nome: string; turma_id: string; }
interface Boleto {
  id: string; creche_id: string; turma_id: string; crianca_id: string;
  valor: number; vencimento: string; status: string; descricao: string | null;
  referencia: string | null; desconto_antecipacao: number | null;
  data_limite_desconto: string | null; multa_atraso: number | null;
  juros_dia: number | null; parcela_atual: number; total_parcelas: number;
  linha_digitavel: string | null; codigo_barras: string | null;
  nosso_numero: string | null; observacoes: string | null;
  data_pagamento: string | null; registrado_por_user_id: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  pago: { label: 'Pago', variant: 'default' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
};

export default function BoletosPage() {
  const { role, user, userCreche } = useAuth();
  const { canCreate, canEdit, canDelete } = useUserPermissions();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const isResponsavel = role === 'responsavel';

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTurma, setFilterTurma] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [viewBoleto, setViewBoleto] = useState<Boleto | null>(null);

  const crecheId = isResponsavel ? userCreche?.id : effectiveCrecheId;

  useEffect(() => {
    if (!crecheId && !isResponsavel) return;
    fetchData();
  }, [crecheId, isResponsavel]);

  const fetchData = async () => {
    setLoading(true);

    if (isResponsavel) {
      // Responsável: fetch boletos of their children
      const { data: criancaIds } = await supabase.rpc('get_crianca_ids_for_responsavel', { _user_id: user!.id });
      if (criancaIds && criancaIds.length > 0) {
        const { data: criancasData } = await supabase.from('criancas').select('id, nome, turma_id').in('id', criancaIds);
        setCriancas(criancasData || []);
        const { data: boletosData } = await supabase.from('boletos').select('*').in('crianca_id', criancaIds).order('vencimento', { ascending: false });
        setBoletos((boletosData as Boleto[]) || []);
      }
    } else {
      // Admin/Diretor/Secretaria
      const { data: turmasData } = await supabase.from('turmas').select('id, nome').eq('creche_id', crecheId!);
      setTurmas(turmasData || []);

      const turmaIds = (turmasData || []).map(t => t.id);
      if (turmaIds.length > 0) {
        const { data: criancasData } = await supabase.from('criancas').select('id, nome, turma_id').in('turma_id', turmaIds).order('nome');
        setCriancas(criancasData || []);
      }

      const { data: boletosData } = await supabase.from('boletos').select('*').eq('creche_id', crecheId!).order('vencimento', { ascending: false });
      setBoletos((boletosData as Boleto[]) || []);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este boleto?')) return;
    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Boleto excluído');
    fetchData();
  };

  const handleCopyLinhaDigitavel = (linha: string) => {
    navigator.clipboard.writeText(linha);
    toast.success('Linha digitável copiada!');
  };

  const getCriancaNome = (id: string) => criancas.find(c => c.id === id)?.nome || '';
  const getTurmaNome = (id: string) => turmas.find(t => t.id === id)?.nome || '';

  const filtered = boletos.filter(b => {
    if (filterTurma !== 'all' && b.turma_id !== filterTurma) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  });

  const canManage = role === 'admin' || canCreate('boletos');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              Boletos e Cobranças
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isResponsavel ? 'Visualize os boletos dos seus filhos' : 'Gerencie os boletos da escola'}
            </p>
          </div>
          {!isResponsavel && canManage && (
            <Button onClick={() => { setEditingBoleto(null); setModalOpen(true); }} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Novo Boleto
            </Button>
          )}
        </div>

        {isAdmin && (
          <AdminSchoolSelector selectedCrecheId={selectedCrecheId} setSelectedCrecheId={setSelectedCrecheId} creches={creches} />
        )}

        {/* Filters */}
        {!isResponsavel && (
          <div className="flex flex-wrap gap-3">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="Todas turmas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas turmas</SelectItem>
                {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Todos status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum boleto encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    {!isResponsavel && <TableHead>Turma</TableHead>}
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.pendente;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{getCriancaNome(b.crianca_id)}</TableCell>
                        {!isResponsavel && <TableCell>{getTurmaNome(b.turma_id)}</TableCell>}
                        <TableCell>{b.referencia || '—'}</TableCell>
                        <TableCell>R$ {Number(b.valor).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(b.vencimento + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{b.parcela_atual}/{b.total_parcelas}</TableCell>
                        <TableCell><Badge variant={st.variant} className="rounded-lg">{st.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {b.linha_digitavel && (
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyLinhaDigitavel(b.linha_digitavel!)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewBoleto(b)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!isResponsavel && canEdit('boletos') && (
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingBoleto(b); setModalOpen(true); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {!isResponsavel && canDelete('boletos') && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* View Modal */}
        {viewBoleto && (
          <BoletoViewModal boleto={viewBoleto} criancaNome={getCriancaNome(viewBoleto.crianca_id)} onClose={() => setViewBoleto(null)} onCopy={handleCopyLinhaDigitavel} />
        )}

        {/* Create/Edit Modal */}
        {modalOpen && crecheId && (
          <BoletoModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditingBoleto(null); }}
            onSaved={fetchData}
            crecheId={crecheId}
            turmas={turmas}
            criancas={criancas}
            editingBoleto={editingBoleto}
            userId={user!.id}
          />
        )}
      </div>
    </MainLayout>
  );
}

// View detail modal
function BoletoViewModal({ boleto, criancaNome, onClose, onCopy }: {
  boleto: Boleto; criancaNome: string; onClose: () => void;
  onCopy: (linha: string) => void;
}) {
  // Uses Dialog imported at top of file
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Detalhes do Boleto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Aluno:</span> <p className="font-medium">{criancaNome}</p></div>
            <div><span className="text-muted-foreground">Referência:</span> <p className="font-medium">{boleto.referencia || '—'}</p></div>
            <div><span className="text-muted-foreground">Valor:</span> <p className="font-medium">R$ {Number(boleto.valor).toFixed(2)}</p></div>
            <div><span className="text-muted-foreground">Vencimento:</span> <p className="font-medium">{format(new Date(boleto.vencimento + 'T12:00:00'), 'dd/MM/yyyy')}</p></div>
            <div><span className="text-muted-foreground">Parcela:</span> <p className="font-medium">{boleto.parcela_atual}/{boleto.total_parcelas}</p></div>
            <div><span className="text-muted-foreground">Status:</span> <p className="font-medium capitalize">{boleto.status}</p></div>
          </div>
          {(boleto.desconto_antecipacao && boleto.desconto_antecipacao > 0) && (
            <div><span className="text-muted-foreground">Desconto antecipação:</span> {boleto.desconto_antecipacao}% {boleto.data_limite_desconto && `até ${format(new Date(boleto.data_limite_desconto + 'T12:00:00'), 'dd/MM/yyyy')}`}</div>
          )}
          {(boleto.multa_atraso && boleto.multa_atraso > 0) && (
            <div><span className="text-muted-foreground">Multa atraso:</span> {boleto.multa_atraso}%</div>
          )}
          {(boleto.juros_dia && boleto.juros_dia > 0) && (
            <div><span className="text-muted-foreground">Juros/dia:</span> {boleto.juros_dia}%</div>
          )}
          {boleto.nosso_numero && <div><span className="text-muted-foreground">Nosso número:</span> {boleto.nosso_numero}</div>}
          {boleto.linha_digitavel && (
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Linha Digitável</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs break-all flex-1">{boleto.linha_digitavel}</p>
                <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={() => onCopy(boleto.linha_digitavel!)}>
                  <Copy className="w-3 h-3 mr-1" /> Copiar
                </Button>
              </div>
            </div>
          )}
          {boleto.observacoes && <div><span className="text-muted-foreground">Observações:</span> <p>{boleto.observacoes}</p></div>}
          {boleto.data_pagamento && <div><span className="text-muted-foreground">Data do pagamento:</span> {format(new Date(boleto.data_pagamento + 'T12:00:00'), 'dd/MM/yyyy')}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
