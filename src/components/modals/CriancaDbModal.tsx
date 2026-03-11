import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CriancaDbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: { id: string; nome: string; data_nascimento: string; turma_id: string; observacoes: string | null } | null;
  turmas: { id: string; nome: string; creche_id: string }[];
  onSaved: () => void;
}

export function CriancaDbModal({ open, onOpenChange, editData, turmas, onSaved }: CriancaDbModalProps) {
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setDataNascimento(editData.data_nascimento);
      setTurmaId(editData.turma_id);
      setObservacoes(editData.observacoes || '');
    } else {
      setNome('');
      setDataNascimento('');
      setTurmaId('');
      setObservacoes('');
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataNascimento || !turmaId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    const payload = {
      nome,
      data_nascimento: dataNascimento,
      turma_id: turmaId,
      observacoes: observacoes || null,
    };

    if (editData) {
      const { error } = await supabase.from('criancas').update(payload).eq('id', editData.id);
      if (error) toast.error('Erro ao atualizar criança');
      else toast.success('Criança atualizada!');
    } else {
      const { error } = await supabase.from('criancas').insert(payload);
      if (error) toast.error('Erro ao cadastrar criança');
      else toast.success('Criança cadastrada!');
    }

    setLoading(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Criança' : 'Nova Criança'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required />
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento *</Label>
            <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Turma *</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alergias, observações especiais..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editData ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
