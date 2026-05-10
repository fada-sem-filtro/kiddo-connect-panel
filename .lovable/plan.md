# Plano — Blog Agenda Fleur: CMS profissional + SEO avançado

Objetivo: complementar o blog atual (que já tem `blog_posts`, RichTextEditor TipTap, página pública com SEOHead, JSON-LD Article, sitemap edge function e robots.txt) com correções de editor, SEO Panel completo, preview, schemas extras, RSS, breadcrumbs/categorias SEO e otimização de imagens. **Sem quebrar nada existente.**

## O que já existe (será preservado)
- Tabelas `blog_posts`, `blog_categorias`, `blog_tags`, `blog_post_tags` + RLS
- Editor TipTap (`RichTextEditor.tsx`) com toolbar e upload de imagem
- Página pública `/blog` e `/blog/:slug` com `SEOHead`, JSON-LD Article, breadcrumb visual, related posts
- Edge function `sitemap-xml` já dinâmica
- `robots.txt` já apontando p/ sitemap dinâmico

## 1. Correções no editor (RichTextEditor)
- Trocar `setContent` no `useEffect` para evitar loop / cursor pulando: comparar normalizado e usar guard de "user is typing" (skip sync se editor focused)
- Adicionar `History`, `Underline`, `TaskList/TaskItem`, `Table`, `Youtube`, `HorizontalRule`, `CodeBlockLowlight` extensions
- Sanitizar paste (`transformPastedHTML`) removendo estilos inline / classes inválidas
- Configurar `parseOptions: { preserveWhitespace: 'full' }` e fix mobile (touch handlers)
- Toolbar sticky + responsiva (scroll horizontal no mobile)

## 2. Editor Visual + HTML (abas)
Em `AdminBlogEditorPage`, dentro da aba Conteúdo, adicionar sub-tabs **Visual** / **HTML** com `<Textarea>` mono espaçada. Sincronização bidirecional via `editor.commands.setContent(html)`.

## 3. Autosave + recuperação
- Autosave em `localStorage` (chave `blog-draft-{id|new}`) a cada 5s com debounce
- Autosave em DB (status=rascunho) a cada 30s, somente se houver post id
- Banner "Recuperar rascunho não salvo?" ao abrir editor se localStorage > DB

## 4. Visualização prévia
Botão "Visualizar" abre Dialog full-screen com toggle desktop/mobile que renderiza um componente `<BlogPostPreview>` reutilizando o mesmo layout/estilos da página pública (extrair render para componente compartilhado `BlogPostView`).

## 5. SEO Panel lateral
Novo componente `<BlogSeoPanel>` na lateral (drawer no mobile, sticky aside no desktop) com:
- SEO title, meta desc, slug, keyword principal (já existem — agrupar)
- **Score SEO** calculado (presença de keyword em título/H1/primeiro parágrafo/meta/slug/alt; comprimento; links internos)
- **Score legibilidade** (Flesch adaptado pt-BR)
- Preview Google (já existe — mover para o painel)
- Word count, tempo de leitura, densidade da keyword
- Aviso se ALT da capa vazio

## 6/7. Slug + meta tags + OG/Twitter automáticos
- Já há slugify e fallbacks ao salvar — adicionar verificação de unicidade do slug com sufixo `-2`, `-3`
- `SEOHead` já gera OG e Twitter — garantir que sempre cair em fallback (título + capa)

## 8. Schema.org expandido
Atualizar `BlogPostPage` JSON-LD:
- `@type: BlogPosting` (em vez de Article)
- Adicionar `BreadcrumbList`
- Detectar blocos FAQ no HTML (`<details>` ou H3 marcadas) → gerar `FAQPage`
- Em `BlogListPage` manter `Blog` schema + `ItemList`

## 9. Sitemap (já existe)
- Adicionar URLs de categorias `/blog/categoria/:slug` no `sitemap-xml` edge function

## 10. robots.txt (já existe)
- Adicionar `Disallow: /admin /dashboard /login` e manter Sitemap

## 11. RSS Feed
Nova edge function `rss-xml` em `https://…/functions/v1/rss-xml`, exposta via redirect estático. Adicionar `<link rel="alternate" type="application/rss+xml">` no `<head>` do blog.

## 12. Links internos automáticos
Já há "Artigos relacionados". Adicionar bloco "Últimos do blog" no rodapé do post + auto-link de palavra-chave principal apontando para outros posts que a tenham (server-side simples no render do HTML sanitizado).

## 13. Breadcrumbs
Já visuais. Adicionar `BreadcrumbList` JSON-LD via `SEOHead.jsonLd` array.

## 14. Página de categoria SEO
Nova rota `/blog/categoria/:slug` (`BlogCategoriaPage`) listando posts da categoria com H1, meta tags, schema CollectionPage, paginação simples.

## 15. Otimização de imagens
- No upload (capa + inline): converter para WebP no client via `<canvas>` e comprimir (max 1600px, quality 0.82)
- Gerar ALT sugerido a partir do nome do arquivo (sanitizado)
- `loading="lazy"` já presente nas imagens inline; manter

## 16. HTML limpo / sanitização
`sanitizeHtml` (DOMPurify) já existe. Ajustar config para permitir `iframe[src^="https://www.youtube.com/embed/"]` e `details/summary` para FAQ. Garantir somente 1 H1 (no título da página); rebaixar H1 dentro do conteúdo para H2 ao salvar.

## 17. Performance
- `<img loading="lazy" decoding="async">` em capas de cards
- `fetchPriority="high"` apenas na capa do artigo (já está)
- Code-split do `RichTextEditor` via `React.lazy` no admin

## 18. Indexação Google (estrutura)
- Adicionar botão "Solicitar indexação" no editor (chama edge function `google-indexing-request` que hoje só registra log/audit; pronta para integração futura com Google Indexing API quando credenciais forem fornecidas)

## Arquivos a criar
- `src/components/blog/BlogPostView.tsx` (render compartilhado)
- `src/components/blog/BlogSeoPanel.tsx`
- `src/components/blog/BlogPreviewDialog.tsx`
- `src/lib/blog-seo.ts` (score, legibilidade, densidade)
- `src/lib/image-optimize.ts` (canvas WebP)
- `src/pages/blog/BlogCategoriaPage.tsx`
- `supabase/functions/rss-xml/index.ts`
- `supabase/functions/google-indexing-request/index.ts` (stub)

## Arquivos a editar
- `src/components/blog/RichTextEditor.tsx` (extensions + estabilidade)
- `src/pages/admin/blog/AdminBlogEditorPage.tsx` (autosave, abas Visual/HTML, painel SEO, preview, slug único)
- `src/pages/blog/BlogPostPage.tsx` (BlogPosting + BreadcrumbList + FAQ schema, usar BlogPostView)
- `src/pages/blog/BlogListPage.tsx` (link RSS, ItemList schema)
- `src/components/blog/SEOHead.tsx` (suportar `jsonLd` array)
- `src/lib/blog-utils.ts` (slug único, scores)
- `src/App.tsx` (rota `/blog/categoria/:slug`)
- `supabase/functions/sitemap-xml/index.ts` (incluir categorias)
- `public/robots.txt` (Disallow extras)

## Banco de dados
Sem mudanças destrutivas. Apenas (opcional, via migration leve):
- `blog_posts.last_autosaved_at TIMESTAMPTZ NULL`
- (não obrigatório — autosave pode usar localStorage + UPDATE comum)

Vou pular a migration para preservar 100% o esquema atual e usar localStorage + updated_at existente.

## Garantias
- Nenhuma rota existente removida
- Nenhuma tabela alterada
- Layout público mantido (apenas componente extraído)
- Auth e RLS intocadas
- Integrações financeiras intocadas
