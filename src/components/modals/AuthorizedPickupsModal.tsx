import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, User, Phone, Save, X } from 'lucide-react';

interface AuthorizedPerson {
  id: string;
  nome: string;
  parentesco: string;
  telefone: string | null;
  foto_url: string | null;
  documento: string | null;
}

interface AuthorizedPickupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criancaId: string;
  criancaNome: string;
}

export function AuthorizedPickupsModal({ open, onOpenChange, criancaId, criancaNome }: AuthorizedPickupsModalProps) {
  const [persons, setPersons] = useState<AuthorizedPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', parentesco: '', telefone: '', documento: '' });

  const fetchPersons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('authorized_pickups')
      .select('*')
      .eq('crianca_id', criancaId)
      .order('nome');
    if (data) setPersons(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && criancaId) fetchPersons();
  }, [open, criancaId]);

  const resetForm = () => {
    setForm({ nome: '', parentesco: '', telefone: '', documento: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.nome) {
      toast.error('Informe o nome');
      return;
    }

    if (editId) {
      const { error } = await supabase.from('authorized_pickups').update({
        nome: form.nome,
        parentesco: form.parentesco || 'Outro',
        telefone: form.telefone || null,
        documento: form.documento || null,
      }).eq('id', editId);
      if (error) toast.error('Erro ao atualizar');
      else toast.success('Atualizado!');
    } else {
      const { error } = await supabase.from('authorized_pickups').insert({
        crianca_id: criancaId,
        nome: form.nome,
        parentesco: form.parentesco || 'Outro',
        telefone: form.telefone || null,
        documento: form.documento || null,
      });
      if (error) toast.error('Erro ao cadastrar');
      else toast.success('Pessoa autorizada cadastrada!');
    }

    resetForm();
    fetchPersons();
  };

  const handleEdit = (p: AuthorizedPerson) => {
    setForm({ nome: p.nome, parentesco: p.parentesco, telefone: p.telefone || '', documento: p.documento || '' });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('authorized_pickups').delete().eq('id', id);
    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Removido!');
      fetchPersons();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Pessoas autorizadas — {criancaNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* List */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : persons.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pessoa autorizada cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {persons.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={p.foto_url || undefined} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.parentesco}</p>
                    {p.telefone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.telefone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Input value={form.parentesco} onChange={(e) => setForm(f => ({ ...f, parentesco: e.target.value }))} placeholder="Ex: Avó, Tio" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Documento (opcional)</Label>
                <Input value={form.documento} onChange={(e) => setForm(f => ({ ...f, documento: e.target.value }))} placeholder="RG ou CPF" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5 mr-1" /> {editId ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </div>
          )}

          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar pessoa autorizada
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
