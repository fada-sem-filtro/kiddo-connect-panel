import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CrecheData {
  id?: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
}

interface CrecheModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editData?: CrecheData | null;
}

export function CrecheModal({ open, onOpenChange, onSave, editData }: CrecheModalProps) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setEndereco(editData.endereco || '');
      setTelefone(editData.telefone || '');
      setEmail(editData.email || '');
    } else {
      setNome('');
      setEndereco('');
      setTelefone('');
      setEmail('');
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    const payload = {
      nome: nome.trim(),
      endereco: endereco.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
    };

    let error;
    if (editData?.id) {
      ({ error } = await supabase.from('creches').update(payload).eq('id', editData.id));
    } else {
      ({ error } = await supabase.from('creches').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar creche');
      console.error(error);
    } else {
      toast.success(editData?.id ? 'Creche atualizada!' : 'Creche cadastrada!');
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData?.id ? 'Editar Creche' : 'Nova Creche'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da creche" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço completo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@creche.com" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
