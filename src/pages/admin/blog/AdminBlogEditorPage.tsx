import { useEffect, useMemo, useRef, useState } from 'react';
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
import { BlogSeoPanel } from '@/components/blog/BlogSeoPanel';
import { BlogPreviewDialog } from '@/components/blog/BlogPreviewDialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Eye, X, Upload, ImageOff, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  slugify, calcReadingTime, excerptFromHtml, ensureUniqueSlug, demoteH1ToH2,
} from '@/lib/blog-utils';
import { optimizeImage, suggestAltFromFilename } from '@/lib/image-optimize';

const AUTOSAVE_KEY = (id: string) => `blog-draft-${id}`;

export default function AdminBlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'novo';
  const draftKey = AUTOSAVE_KEY(id || 'novo');
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [resumo, setResumo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
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

  // Load taxonomy
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

  // Load post or local draft
  useEffect(() => {
    (async () => {
      if (isNew) {
        const draft = loadDraft(draftKey);
        if (draft && confirm('Encontramos um rascunho não salvo. Deseja recuperá-lo?')) {
          applyDraft(draft);
        }
        return;
      }
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

        // Offer recovery if local draft is newer than DB updated_at
        const draft = loadDraft(draftKey);
        if (draft && draft.updatedAt && new Date(draft.updatedAt) > new Date(data.updated_at)) {
          if (confirm('Encontramos um rascunho local mais recente que a versão salva. Recuperar?')) {
            applyDraft(draft);
          }
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  function applyDraft(d: any) {
    if (typeof d.titulo === 'string') setTitulo(d.titulo);
    if (typeof d.slug === 'string') { setSlug(d.slug); setSlugTouched(true); }
    if (typeof d.resumo === 'string') setResumo(d.resumo);
    if (typeof d.conteudo === 'string') setConteudo(d.conteudo);
    if (typeof d.capaUrl === 'string') setCapaUrl(d.capaUrl);
    if (typeof d.capaAlt === 'string') setCapaAlt(d.capaAlt);
    if (typeof d.metaTitle === 'string') setMetaTitle(d.metaTitle);
    if (typeof d.metaDescription === 'string') setMetaDescription(d.metaDescription);
    if (typeof d.palavraChave === 'string') setPalavraChave(d.palavraChave);
    if (Array.isArray(d.palavrasSec)) setPalavrasSec(d.palavrasSec);
    if (typeof d.categoriaId === 'string') setCategoriaId(d.categoriaId);
  }

  // Auto-slug from title
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(titulo));
  }, [titulo, slugTouched]);

  // Local autosave (debounced via interval)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try {
        const payload = {
          titulo, slug, resumo, conteudo, capaUrl, capaAlt,
          metaTitle, metaDescription, palavraChave, palavrasSec, categoriaId,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setAutosavedAt(new Date());
      } catch { /* quota? ignore */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [titulo, slug, resumo, conteudo, capaUrl, capaAlt, metaTitle, metaDescription, palavraChave, palavrasSec, categoriaId, draftKey, loading]);

  const addPalavra = () => {
    const v = novaPalavra.trim();
    if (!v) return;
    if (!palavrasSec.includes(v)) setPalavrasSec([...palavrasSec, v]);
    setNovaPalavra('');
  };

  const handleCapaUpload = async (file: File) => {
    try {
      const optimized = await optimizeImage(file, { maxWidth: 1600, quality: 0.82 });
      const safeName = optimized.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `capas/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('blog-imagens').upload(path, optimized, {
        upsert: false, contentType: optimized.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('blog-imagens').getPublicUrl(path);
      setCapaUrl(data.publicUrl);
      if (!capaAlt) setCapaAlt(suggestAltFromFilename(file.name));
      toast.success('Capa enviada e otimizada');
    } catch (e: any) {
      toast.error('Falha: ' + e.message);
    }
  };

  const requestIndexing = async () => {
    if (!slug) return toast.error('Salve o artigo primeiro');
    try {
      const { error } = await supabase.functions.invoke('google-indexing-request', {
        body: { url: `https://agendafleur.app/blog/${slug}` },
      });
      if (error) throw error;
      toast.success('Solicitação de indexação registrada');
    } catch (e: any) {
      toast.error('Falha: ' + e.message);
    }
  };

  const save = async (publish?: boolean) => {
    if (!titulo.trim()) return toast.error('Informe o título');
    if (!conteudo.trim() || conteudo === '<p></p>') return toast.error('Adicione conteúdo ao artigo');

    const finalStatus = publish === undefined ? status : (publish ? 'publicado' : 'rascunho');

    setSaving(true);
    const cleanContent = demoteH1ToH2(conteudo);
    const finalSlug = await ensureUniqueSlug(slug || titulo, isNew ? undefined : id);

    const payload: any = {
      titulo: titulo.trim(),
      slug: finalSlug,
      resumo: resumo.trim() || excerptFromHtml(cleanContent, 200),
      conteudo: cleanContent,
      capa_url: capaUrl || null,
      capa_alt: capaAlt || null,
      meta_title: metaTitle.trim() || titulo.trim(),
      meta_description: metaDescription.trim() || excerptFromHtml(cleanContent, 160),
      palavra_chave_principal: palavraChave.trim() || null,
      palavras_chave_secundarias: palavrasSec,
      categoria_id: categoriaId || null,
      status: finalStatus,
      autor_user_id: user?.id || null,
      autor_nome: profile?.nome || null,
      reading_time: calcReadingTime(cleanContent),
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

    if (postId) {
      await supabase.from('blog_post_tags').delete().eq('post_id', postId);
      if (tagIds.length > 0) {
        await supabase.from('blog_post_tags').insert(tagIds.map(t => ({ post_id: postId, tag_id: t })));
      }
    }

    setSaving(false);
    setStatus(finalStatus);
    setSlug(finalSlug);
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success(finalStatus === 'publicado' ? 'Artigo publicado!' : 'Rascunho salvo');
    if (isNew && postId) navigate(`/admin/blog/${postId}`, { replace: true });
  };

  const previewPost = useMemo(() => ({
    titulo: titulo || 'Título do artigo',
    resumo,
    conteudo,
    capa_url: capaUrl,
    capa_alt: capaAlt,
    published_at: new Date().toISOString(),
    reading_time: calcReadingTime(conteudo),
    autor_nome: profile?.nome || 'Agenda Fleur',
    categoria: categorias.find(c => c.id === categoriaId) || null,
  }), [titulo, resumo, conteudo, capaUrl, capaAlt, categoriaId, categorias, profile?.nome]);

  if (loading) return <MainLayout><div className="text-center py-20">Carregando…</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold">{isNew ? 'Novo artigo' : 'Editar artigo'}</h1>
            <Badge variant={status === 'publicado' ? 'default' : 'secondary'}>
              {status === 'publicado' ? 'Publicado' : 'Rascunho'}
            </Badge>
            {autosavedAt && (
              <span className="text-xs text-muted-foreground">
                Auto-salvo {autosavedAt.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-2" />Visualizar
            </Button>
            {status === 'publicado' && slug && (
              <Button variant="outline" size="sm" onClick={requestIndexing}>
                <Search className="w-4 h-4 mr-2" />Solicitar indexação
              </Button>
            )}
            <Button variant="outline" disabled={saving} onClick={() => save(false)}>
              <Save className="w-4 h-4 mr-2" />Salvar rascunho
            </Button>
            <Button disabled={saving} onClick={() => save(true)}>
              <Send className="w-4 h-4 mr-2" />Publicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
          <div>
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
                  <div className="flex items-center justify-between mb-1">
                    <Label>Conteúdo *</Label>
                    <Tabs value={editorMode} onValueChange={v => setEditorMode(v as any)}>
                      <TabsList className="h-8">
                        <TabsTrigger value="visual" className="text-xs h-6"><Sparkles className="w-3 h-3 mr-1" />Visual</TabsTrigger>
                        <TabsTrigger value="html" className="text-xs h-6">HTML</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {editorMode === 'visual' ? (
                    <RichTextEditor value={conteudo} onChange={setConteudo} />
                  ) : (
                    <Textarea
                      value={conteudo}
                      onChange={e => setConteudo(e.target.value)}
                      className="font-mono text-xs min-h-[400px]"
                      placeholder="<p>HTML do artigo</p>"
                    />
                  )}
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

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <BlogSeoPanel
              titulo={titulo}
              slug={slug}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              resumo={resumo}
              conteudoHtml={conteudo}
              capaAlt={capaAlt}
              keyword={palavraChave}
            />
          </aside>
        </div>

        <BlogPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          post={previewPost}
        />
      </div>
    </MainLayout>
  );
}

function loadDraft(key: string): any | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
