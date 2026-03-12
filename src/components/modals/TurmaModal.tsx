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

interface TurmaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: { id: string; nome: string; descricao: string | null; creche_id: string } | null;
  creches: { id: string; nome: string }[];
  defaultCrecheId?: string;
  onSaved: () => void;
}

export function TurmaModal({ open, onOpenChange, editData, creches, defaultCrecheId, onSaved }: TurmaModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [crecheId, setCrecheId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setDescricao(editData.descricao || '');
      setCrecheId(editData.creche_id);
    } else {
      setNome('');
      setDescricao('');
      setCrecheId(defaultCrecheId || (creches.length === 1 ? creches[0].id : ''));
    }
  }, [editData, open, defaultCrecheId, creches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !crecheId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    const payload = { nome, descricao: descricao || null, creche_id: crecheId };

    if (editData) {
      const { error } = await supabase.from('turmas').update(payload).eq('id', editData.id);
      if (error) toast.error('Erro ao atualizar turma');
      else toast.success('Turma atualizada!');
    } else {
      const { error } = await supabase.from('turmas').insert(payload);
      if (error) toast.error('Erro ao criar turma');
      else toast.success('Turma criada!');
    }

    setLoading(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Berçário I" required />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da turma" />
          </div>
          {creches.length > 0 && (
            <div className="space-y-2">
              <Label>Escola *</Label>
              <Select value={crecheId} onValueChange={setCrecheId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {creches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editData ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
