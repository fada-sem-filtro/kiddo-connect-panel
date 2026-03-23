import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Library, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';

interface Materia {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export default function MateriasPage() {
  const { role } = useAuth();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const fetchMaterias = async () => {
    if (!effectiveCrecheId) { setMaterias([]); setLoading(false); return; }
    const { data } = await supabase
      .from('materias').select('id, nome, descricao, ativo')
      .eq('creche_id', effectiveCrecheId).order('nome');
    setMaterias((data as Materia[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMaterias(); }, [effectiveCrecheId]);

  const handleSave = async () => {
    if (!nome.trim() || !effectiveCrecheId) return;
    if (editing) {
      const { error } = await supabase.from('materias').update({ nome: nome.trim(), descricao: descricao.trim() || null }).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar'); else toast.success('Matéria atualizada');
    } else {
      const { error } = await supabase.from('materias').insert({ nome: nome.trim(), descricao: descricao.trim() || null, creche_id: effectiveCrecheId });
      if (error) toast.error('Erro ao criar matéria'); else toast.success('Matéria criada');
    }
    setModalOpen(false); setEditing(null); setNome(''); setDescricao(''); fetchMaterias();
  };

  const handleToggleAtivo = async (materia: Materia) => {
    const { error } = await supabase.from('materias').update({ ativo: !materia.ativo }).eq('id', materia.id);
    if (!error) fetchMaterias();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('materias').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir. A matéria pode estar vinculada a boletins.');
    else { toast.success('Matéria excluída'); fetchMaterias(); }
  };

  const openEdit = (m: Materia) => { setEditing(m); setNome(m.nome); setDescricao(m.descricao || ''); setModalOpen(true); };
  const openNew = () => { setEditing(null); setNome(''); setDescricao(''); setModalOpen(true); };

  if (loading && !isAdmin) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Library className="w-6 h-6 text-primary" />
              Matérias
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie as disciplinas da escola</p>
          </div>
          {effectiveCrecheId && (
            <Button className="rounded-2xl" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Nova Matéria
            </Button>
          )}
        </div>

        {isAdmin && <AdminSchoolSelector selectedCrecheId={selectedCrecheId} setSelectedCrecheId={setSelectedCrecheId} creches={creches} />}

        {!effectiveCrecheId ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Library className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione uma escola para gerenciar matérias</p>
            </CardContent>
          </Card>
        ) : materias.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Library className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma matéria cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {materias.map((m) => (
              <Card key={m.id} className="rounded-2xl border-2 border-border">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{m.nome}</h3>
                      <Badge variant={m.ativo ? 'default' : 'secondary'} className="rounded-xl text-xs">{m.ativo ? 'Ativa' : 'Inativa'}</Badge>
                    </div>
                    {m.descricao && <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={m.ativo} onCheckedChange={() => handleToggleAtivo(m)} />
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome da matéria</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Matemática" className="rounded-xl mt-1" /></div>
            <div><Label>Descrição (opcional)</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da matéria" className="rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={!nome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
