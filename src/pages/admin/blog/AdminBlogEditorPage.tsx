import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Eye, X, Upload, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { slugify, calcReadingTime, excerptFromHtml } from '@/lib/blog-utils';

export default function AdminBlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'novo';
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [resumo, setResumo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [capaUrl, setCapaUrl] = useState('');
  const [capaAlt, setCapaAlt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [palavraChave, setPalavraChave] = useState('');
  const [palavrasSec, setPalavrasSec] = useState<string[]>([]);
  const [novaPalavra, setNovaPalavra] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [status, setStatus] = useState<'rascunho' | 'publicado'>('rascunho');
  const [tagIds, setTagIds] = useState<string[]>([]);

  const [categorias, setCategorias] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: ts }] = await Promise.all([
        supabase.from('blog_categorias').select('id, nome').order('nome'),
        supabase.from('blog_tags').select('id, nome').order('nome'),
      ]);
      setCategorias(cats || []);
      setTags(ts || []);
    })();
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
      if (data) {
        setTitulo(data.titulo);
        setSlug(data.slug);
        setSlugTouched(true);
        setResumo(data.resumo || '');
        setConteudo(data.conteudo || '');
        setCapaUrl(data.capa_url || '');
        setCapaAlt(data.capa_alt || '');
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        setPalavraChave(data.palavra_chave_principal || '');
        setPalavrasSec(data.palavras_chave_secundarias || []);
        setCategoriaId(data.categoria_id || '');
        setStatus(data.status as 'rascunho' | 'publicado');
        const { data: pt } = await supabase.from('blog_post_tags').select('tag_id').eq('post_id', id);
        setTagIds((pt || []).map((r: any) => r.tag_id));
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(titulo));
  }, [titulo, slugTouched]);

  const addPalavra = () => {
    const v = novaPalavra.trim();
    if (!v) return;
    if (!palavrasSec.includes(v)) setPalavrasSec([...palavrasSec, v]);
    setNovaPalavra('');
  };

  const handleCapaUpload = async (file: File) => {
    try {
      const path = `capas/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('blog-imagens').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('blog-imagens').getPublicUrl(path);
      setCapaUrl(data.publicUrl);
      toast.success('Capa enviada');
    } catch (e: any) {
      toast.error('Falha: ' + e.message);
    }
  };

  const save = async (publish?: boolean) => {
    if (!titulo.trim()) return toast.error('Informe o título');
    if (!slug.trim()) return toast.error('Informe o slug');
    if (!conteudo.trim() || conteudo === '<p></p>') return toast.error('Adicione conteúdo ao artigo');

    const finalStatus = publish === undefined ? status : (publish ? 'publicado' : 'rascunho');

    setSaving(true);
    const payload: any = {
      titulo: titulo.trim(),
      slug: slug.trim(),
      resumo: resumo.trim() || excerptFromHtml(conteudo, 200),
      conteudo,
      capa_url: capaUrl || null,
      capa_alt: capaAlt || null,
      meta_title: metaTitle.trim() || titulo.trim(),
      meta_description: metaDescription.trim() || excerptFromHtml(conteudo, 160),
      palavra_chave_principal: palavraChave.trim() || null,
      palavras_chave_secundarias: palavrasSec,
      categoria_id: categoriaId || null,
      status: finalStatus,
      autor_user_id: user?.id || null,
      autor_nome: profile?.nome || null,
      reading_time: calcReadingTime(conteudo),
    };

    if (finalStatus === 'publicado') {
      payload.published_at = new Date().toISOString();
    }

    let postId = id;
    if (isNew) {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select('id').single();
      if (error) { setSaving(false); return toast.error(error.message); }
      postId = data.id;
    } else {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }

    // Sync tags
    if (postId) {
      await supabase.from('blog_post_tags').delete().eq('post_id', postId);
      if (tagIds.length > 0) {
        await supabase.from('blog_post_tags').insert(tagIds.map(t => ({ post_id: postId, tag_id: t })));
      }
    }

    setSaving(false);
    setStatus(finalStatus);
    toast.success(finalStatus === 'publicado' ? 'Artigo publicado!' : 'Rascunho salvo');
    if (isNew && postId) navigate(`/admin/blog/${postId}`, { replace: true });
  };

  if (loading) return <MainLayout><div className="text-center py-20">Carregando…</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold">{isNew ? 'Novo artigo' : 'Editar artigo'}</h1>
            <Badge variant={status === 'publicado' ? 'default' : 'secondary'}>
              {status === 'publicado' ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
          <div className="flex gap-2">
            {status === 'publicado' && slug && (
              <a href={`/blog/${slug}`} target="_blank" rel="noopener">
                <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" />Ver</Button>
              </a>
            )}
            <Button variant="outline" disabled={saving} onClick={() => save(false)}>
              <Save className="w-4 h-4 mr-2" />Salvar rascunho
            </Button>
            <Button disabled={saving} onClick={() => save(true)}>
              <Send className="w-4 h-4 mr-2" />Publicar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="conteudo">
          <TabsList>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="organizacao">Organização</TabsTrigger>
          </TabsList>

          <TabsContent value="conteudo" className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Como escolher uma agenda escolar digital" />
            </div>
            <div>
              <Label>Slug (URL) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/blog/</span>
                <Input value={slug} onChange={e => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
              </div>
            </div>
            <div>
              <Label>Resumo</Label>
              <Textarea value={resumo} onChange={e => setResumo(e.target.value)} rows={2} placeholder="Aparece nos cards e como meta description padrão" />
            </div>

            <div>
              <Label>Imagem de capa</Label>
              <div className="flex items-start gap-4">
                <div className="w-40 h-24 bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border shrink-0">
                  {capaUrl ? <img src={capaUrl} alt={capaAlt} className="w-full h-full object-cover" /> : <ImageOff className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCapaUpload(f); e.target.value = ''; }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />Enviar imagem
                  </Button>
                  {capaUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setCapaUrl('')}>Remover</Button>}
                  <Input placeholder="Texto alternativo (alt) — importante para SEO" value={capaAlt} onChange={e => setCapaAlt(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label>Conteúdo *</Label>
              <RichTextEditor value={conteudo} onChange={setConteudo} />
              <p className="text-xs text-muted-foreground mt-2">
                Use H2 e H3 para estruturar o texto. Tempo estimado: <strong>{calcReadingTime(conteudo)} min</strong>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div>
              <Label>Palavra-chave principal *</Label>
              <Input value={palavraChave} onChange={e => setPalavraChave(e.target.value)} placeholder="Ex: agenda escolar digital" />
            </div>
            <div>
              <Label>Palavras-chave secundárias</Label>
              <div className="flex gap-2">
                <Input
                  value={novaPalavra}
                  onChange={e => setNovaPalavra(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPalavra(); } }}
                  placeholder="Digite e Enter"
                />
                <Button type="button" variant="outline" onClick={addPalavra}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {palavrasSec.map(p => (
                  <Badge key={p} variant="secondary" className="gap-1">
                    {p}
                    <button onClick={() => setPalavrasSec(palavrasSec.filter(x => x !== p))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Meta title <span className="text-xs text-muted-foreground">(máx. 60 chars)</span></Label>
              <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} maxLength={70} placeholder="Padrão: título do artigo" />
              <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60</p>
            </div>
            <div>
              <Label>Meta description <span className="text-xs text-muted-foreground">(máx. 160 chars)</span></Label>
              <Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} maxLength={200} />
              <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160</p>
            </div>

            {/* Preview do snippet do Google */}
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização (Google)</p>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">https://agendafleur.app/blog/{slug || 'slug'}</div>
                <div className="text-blue-700 dark:text-blue-400 text-lg font-medium leading-tight truncate">
                  {metaTitle || titulo || 'Título do artigo'}
                </div>
                <div className="text-sm text-foreground/80 line-clamp-2">
                  {metaDescription || resumo || excerptFromHtml(conteudo, 160) || 'Descrição que aparecerá no Google.'}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organizacao" className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md min-h-[60px]">
                {tags.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada</p>}
                {tags.map(t => {
                  const active = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTagIds(active ? tagIds.filter(x => x !== t.id) : [...tagIds, t.id])}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
                      }`}
                    >
                      {t.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
