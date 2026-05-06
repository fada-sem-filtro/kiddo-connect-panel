import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { slugify } from '@/lib/blog-utils';

export default function AdminBlogCategoriasPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [descricao, setDescricao] = useState('');

  const load = async () => {
    const { data } = await supabase.from('blog_categorias').select('*').order('nome');
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setNome(''); setSlug(''); setDescricao(''); setOpen(true); };
  const openEdit = (i: any) => { setEditing(i); setNome(i.nome); setSlug(i.slug); setDescricao(i.descricao || ''); setOpen(true); };

  const save = async () => {
    if (!nome.trim()) return toast.error('Nome obrigatório');
    const payload = { nome: nome.trim(), slug: slug.trim() || slugify(nome), descricao: descricao.trim() || null };
    const { error } = editing
      ? await supabase.from('blog_categorias').update(payload).eq('id', editing.id)
      : await supabase.from('blog_categorias').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Salvo');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir categoria?')) return;
    const { error } = await supabase.from('blog_categorias').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}><ArrowLeft className="w-4 h-4 mr-1" />Blog</Button>
            <h1 className="text-2xl font-bold">Categorias</h1>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova categoria</Button>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Slug</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma categoria</TableCell></TableRow>
              ) : items.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.slug}</TableCell>
                  <TableCell className="text-sm">{i.descricao || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={nome} onChange={e => { setNome(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(slugify(e.target.value))} /></div>
            <div><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
