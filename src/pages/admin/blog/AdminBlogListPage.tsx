import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Eye, Tag, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateBR } from '@/lib/blog-utils';

export default function AdminBlogListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [delId, setDelId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, titulo, slug, status, palavra_chave_principal, published_at, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error(error.message);
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async () => {
    if (!delId) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', delId);
    if (error) return toast.error(error.message);
    toast.success('Artigo excluído');
    setDelId(null);
    load();
  };

  const filtered = posts.filter(p =>
    !search || p.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    p.palavra_chave_principal?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Blog</h1>
            <p className="text-sm text-muted-foreground">Gerencie os artigos publicados no site</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/blog/categorias"><Button variant="outline" size="sm"><FolderOpen className="w-4 h-4 mr-2" />Categorias</Button></Link>
            <Link to="/admin/blog/tags"><Button variant="outline" size="sm"><Tag className="w-4 h-4 mr-2" />Tags</Button></Link>
            <Button onClick={() => navigate('/admin/blog/novo')}><Plus className="w-4 h-4 mr-2" />Novo artigo</Button>
          </div>
        </div>

        <Input placeholder="Buscar por título ou palavra-chave..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Palavra-chave</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Publicado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum artigo encontrado</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.titulo}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.palavra_chave_principal || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'publicado' ? 'default' : 'secondary'}>
                      {p.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.published_at ? formatDateBR(p.published_at) : '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === 'publicado' && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noopener">
                          <Button size="sm" variant="ghost" title="Visualizar"><Eye className="w-4 h-4" /></Button>
                        </a>
                      )}
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => navigate(`/admin/blog/${p.id}`)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" title="Excluir" onClick={() => setDelId(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
