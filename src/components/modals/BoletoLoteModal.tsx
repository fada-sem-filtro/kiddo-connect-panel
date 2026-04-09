import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Receipt, Users } from 'lucide-react';

interface Turma { id: string; nome: string; }
interface Crianca { id: string; nome: string; turma_id: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  crecheId: string;
  turmas: Turma[];
  criancas: Crianca[];
  userId: string;
}

export default function BoletoLoteModal({ open, onClose, onSaved, crecheId, turmas, criancas, userId }: Props) {
  const [saving, setSaving] = useState(false);
  const [turmaId, setTurmaId] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [referencia, setReferencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [totalParcelas, setTotalParcelas] = useState('1');
  const [descontoAntecipacao, setDescontoAntecipacao] = useState('0');
  const [dataLimiteDesconto, setDataLimiteDesconto] = useState('');
  const [multaAtraso, setMultaAtraso] = useState('0');
  const [jurosDia, setJurosDia] = useState('0');
  const [selectedCriancas, setSelectedCriancas] = useState<string[]>([]);

  const filteredCriancas = turmaId ? criancas.filter(c => c.turma_id === turmaId) : [];

  useEffect(() => {
    if (turmaId) {
      setSelectedCriancas(filteredCriancas.map(c => c.id));
    } else {
      setSelectedCriancas([]);
    }
  }, [turmaId]);

  const toggleCrianca = (id: string) => {
    setSelectedCriancas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCriancas.length === filteredCriancas.length) {
      setSelectedCriancas([]);
    } else {
      setSelectedCriancas(filteredCriancas.map(c => c.id));
    }
  };

  const handleSave = async () => {
    if (!turmaId || !valor || !vencimento || selectedCriancas.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e selecione ao menos um aluno');
      return;
    }

    setSaving(true);
    const parcelas = parseInt(totalParcelas) || 1;
    const baseDate = new Date(vencimento + 'T12:00:00');

    const allBoletos = [];
    for (const criancaId of selectedCriancas) {
      for (let p = 1; p <= parcelas; p++) {
        const venc = new Date(baseDate);
        venc.setMonth(venc.getMonth() + (p - 1));
        const vencStr = venc.toISOString().split('T')[0];

        allBoletos.push({
          creche_id: crecheId,
          turma_id: turmaId,
          crianca_id: criancaId,
          valor: parseFloat(valor),
          vencimento: vencStr,
          status: 'pendente',
          descricao: descricao || null,
          referencia: referencia ? `${referencia} - Parcela ${p}/${parcelas}` : null,
          desconto_antecipacao: parseFloat(descontoAntecipacao) || 0,
          data_limite_desconto: dataLimiteDesconto || null,
          multa_atraso: parseFloat(multaAtraso) || 0,
          juros_dia: parseFloat(jurosDia) || 0,
          parcela_atual: p,
          total_parcelas: parcelas,
          registrado_por_user_id: userId,
        });
      }
    }

    const { error } = await supabase.from('boletos').insert(allBoletos);
    setSaving(false);

    if (error) {
      toast.error('Erro ao criar boletos em lote');
      console.error(error);
      return;
    }

    toast.success(`${allBoletos.length} boleto(s) criado(s) com sucesso!`);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Criar Boletos em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Turma *</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
              <SelectContent>
                {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {turmaId && filteredCriancas.length > 0 && (
            <div className="border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Alunos ({selectedCriancas.length}/{filteredCriancas.length})</Label>
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
                  {selectedCriancas.length === filteredCriancas.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredCriancas.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedCriancas.includes(c.id)}
                      onCheckedChange={() => toggleCrianca(c.id)}
                    />
                    <span className="text-sm">{c.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Vencimento 1ª parcela *</Label>
              <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Total de parcelas</Label>
              <Input type="number" min="1" max="12" value={totalParcelas} onChange={e => setTotalParcelas(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Referência</Label>
              <Input placeholder="Ex: Mensalidade 2026" value={referencia} onChange={e => setReferencia(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} className="rounded-xl" />
            </div>
          </div>

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
          <div>
            <Label>Juros por dia (%)</Label>
            <Input type="number" step="0.0001" min="0" value={jurosDia} onChange={e => setJurosDia(e.target.value)} className="rounded-xl w-full sm:w-1/3" />
          </div>

          {selectedCriancas.length > 0 && valor && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-sm">
              <p className="font-medium text-foreground">
                Resumo: {selectedCriancas.length} aluno(s) × {totalParcelas || 1} parcela(s) = <strong>{selectedCriancas.length * (parseInt(totalParcelas) || 1)} boleto(s)</strong>
              </p>
              <p className="text-muted-foreground">
                Valor total: R$ {(selectedCriancas.length * (parseInt(totalParcelas) || 1) * (parseFloat(valor) || 0)).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl">
            {saving ? 'Criando...' : `Criar ${selectedCriancas.length * (parseInt(totalParcelas) || 1)} Boleto(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
