import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { slugify } from '@/lib/blog-utils';

export default function AdminBlogTagsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [nome, setNome] = useState('');

  const load = async () => {
    const { data } = await supabase.from('blog_tags').select('*').order('nome');
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!nome.trim()) return;
    const { error } = await supabase.from('blog_tags').insert({ nome: nome.trim(), slug: slugify(nome) });
    if (error) return toast.error(error.message);
    setNome('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir tag?')) return;
    const { error } = await supabase.from('blog_tags').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}><ArrowLeft className="w-4 h-4 mr-1" />Blog</Button>
          <h1 className="text-2xl font-bold">Tags</h1>
        </div>

        <div className="flex gap-2">
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nova tag" onKeyDown={e => { if (e.key === 'Enter') add(); }} />
          <Button onClick={add}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma tag cadastrada</p>
          ) : items.map(t => (
            <div key={t.id} className="flex items-center gap-1 bg-muted rounded-full pl-3 pr-1 py-1 text-sm">
              <span>{t.nome}</span>
              <button onClick={() => remove(t.id)} className="hover:bg-destructive/20 rounded-full p-1">
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
