import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Receipt } from 'lucide-react';

interface Turma { id: string; nome: string; }
interface Crianca { id: string; nome: string; turma_id: string; }

interface BoletoData {
  id?: string; creche_id: string; turma_id: string; crianca_id: string;
  valor: number; vencimento: string; status: string; descricao: string | null;
  referencia: string | null; desconto_antecipacao: number | null;
  data_limite_desconto: string | null; multa_atraso: number | null;
  juros_dia: number | null; parcela_atual: number; total_parcelas: number;
  linha_digitavel: string | null; codigo_barras: string | null;
  nosso_numero: string | null; observacoes: string | null;
  data_pagamento: string | null; registrado_por_user_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  crecheId: string;
  turmas: Turma[];
  criancas: Crianca[];
  editingBoleto: BoletoData | null;
  userId: string;
}

export default function BoletoModal({ open, onClose, onSaved, crecheId, turmas, criancas, editingBoleto, userId }: Props) {
  const [saving, setSaving] = useState(false);
  const [turmaId, setTurmaId] = useState(editingBoleto?.turma_id || '');
  const [criancaId, setCriancaId] = useState(editingBoleto?.crianca_id || '');
  const [valor, setValor] = useState(editingBoleto?.valor?.toString() || '');
  const [vencimento, setVencimento] = useState(editingBoleto?.vencimento || '');
  const [status, setStatus] = useState(editingBoleto?.status || 'pendente');
  const [descricao, setDescricao] = useState(editingBoleto?.descricao || '');
  const [referencia, setReferencia] = useState(editingBoleto?.referencia || '');
  const [descontoAntecipacao, setDescontoAntecipacao] = useState(editingBoleto?.desconto_antecipacao?.toString() || '0');
  const [dataLimiteDesconto, setDataLimiteDesconto] = useState(editingBoleto?.data_limite_desconto || '');
  const [multaAtraso, setMultaAtraso] = useState(editingBoleto?.multa_atraso?.toString() || '0');
  const [jurosDia, setJurosDia] = useState(editingBoleto?.juros_dia?.toString() || '0');
  const [parcelaAtual, setParcelaAtual] = useState(editingBoleto?.parcela_atual?.toString() || '1');
  const [totalParcelas, setTotalParcelas] = useState(editingBoleto?.total_parcelas?.toString() || '1');
  const [linhaDigitavel, setLinhaDigitavel] = useState(editingBoleto?.linha_digitavel || '');
  const [codigoBarras, setCodigoBarras] = useState(editingBoleto?.codigo_barras || '');
  const [nossoNumero, setNossoNumero] = useState(editingBoleto?.nosso_numero || '');
  const [observacoes, setObservacoes] = useState(editingBoleto?.observacoes || '');
  const [dataPagamento, setDataPagamento] = useState(editingBoleto?.data_pagamento || '');

  const filteredCriancas = turmaId ? criancas.filter(c => c.turma_id === turmaId) : criancas;

  const handleSave = async () => {
    if (!turmaId || !criancaId || !valor || !vencimento) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    const payload = {
      creche_id: crecheId,
      turma_id: turmaId,
      crianca_id: criancaId,
      valor: parseFloat(valor),
      vencimento,
      status,
      descricao: descricao || null,
      referencia: referencia || null,
      desconto_antecipacao: parseFloat(descontoAntecipacao) || 0,
      data_limite_desconto: dataLimiteDesconto || null,
      multa_atraso: parseFloat(multaAtraso) || 0,
      juros_dia: parseFloat(jurosDia) || 0,
      parcela_atual: parseInt(parcelaAtual) || 1,
      total_parcelas: parseInt(totalParcelas) || 1,
      linha_digitavel: linhaDigitavel || null,
      codigo_barras: codigoBarras || null,
      nosso_numero: nossoNumero || null,
      observacoes: observacoes || null,
      data_pagamento: dataPagamento || null,
      registrado_por_user_id: userId,
    };

    let error;
    if (editingBoleto?.id) {
      ({ error } = await supabase.from('boletos').update(payload).eq('id', editingBoleto.id));
    } else {
      ({ error } = await supabase.from('boletos').insert(payload));
    }

    setSaving(false);
    if (error) { toast.error('Erro ao salvar boleto'); console.error(error); return; }
    toast.success(editingBoleto ? 'Boleto atualizado' : 'Boleto criado');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Turma *</Label>
              <Select value={turmaId} onValueChange={(v) => { setTurmaId(v); setCriancaId(''); }}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aluno *</Label>
              <Select value={criancaId} onValueChange={setCriancaId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCriancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Referência</Label>
              <Input placeholder="Ex: Mensalidade Março 2026" value={referencia} onChange={e => setReferencia(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Parcela atual</Label>
              <Input type="number" min="1" value={parcelaAtual} onChange={e => setParcelaAtual(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Total de parcelas</Label>
              <Input type="number" min="1" value={totalParcelas} onChange={e => setTotalParcelas(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Desconto/Multa/Juros */}
          <p className="text-sm font-semibold text-muted-foreground pt-2">Desconto, Multa e Juros</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Desconto antecipação (%)</Label>
              <Input type="number" step="0.01" min="0" value={descontoAntecipacao} onChange={e => setDescontoAntecipacao(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Data limite desconto</Label>
              <Input type="date" value={dataLimiteDesconto} onChange={e => setDataLimiteDesconto(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Multa atraso (%)</Label>
              <Input type="number" step="0.01" min="0" value={multaAtraso} onChange={e => setMultaAtraso(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Juros por dia (%)</Label>
              <Input type="number" step="0.0001" min="0" value={jurosDia} onChange={e => setJurosDia(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Data do pagamento</Label>
              <Input type="date" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Dados bancários */}
          <p className="text-sm font-semibold text-muted-foreground pt-2">Dados Bancários</p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Linha digitável</Label>
              <Input value={linhaDigitavel} onChange={e => setLinhaDigitavel(e.target.value)} className="rounded-xl font-mono text-xs" />
            </div>
            <div>
              <Label>Código de barras</Label>
              <Input value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)} className="rounded-xl font-mono text-xs" />
            </div>
            <div>
              <Label>Nosso número</Label>
              <Input value={nossoNumero} onChange={e => setNossoNumero(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="rounded-xl" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl">
            {saving ? 'Salvando...' : editingBoleto ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
