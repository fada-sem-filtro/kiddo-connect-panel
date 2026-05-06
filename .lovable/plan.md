## Plano: Estrutura completa de Blog com SEO avançado

Vou implementar um sistema de blog completo, com CMS no admin e área pública otimizada para SEO, focado em ranquear termos como "agenda escolar digital".

### 1. Banco de dados (Lovable Cloud)

Novas tabelas:
- **blog_categorias**: nome, slug, descrição
- **blog_tags**: nome, slug
- **blog_posts**: título, slug (único), conteúdo (HTML rico), resumo, capa_url, capa_alt, meta_title, meta_description, palavra_chave_principal, palavras_chave_secundarias (text[]), categoria_id, status ('rascunho'|'publicado'), autor_user_id, published_at, views, reading_time
- **blog_post_tags**: relação N:N

RLS:
- Leitura pública de posts publicados, categorias e tags (sem autenticação)
- Escrita restrita a admins (`has_role admin`)

Bucket de storage: **blog-imagens** (público, para capas e imagens inline).

### 2. Área pública (`/blog` e `/blog/:slug`)

**`/blog`** — listagem:
- Hero com H1 "Blog Agenda Fleur — Agenda Escolar Digital"
- Filtros por categoria/tag
- Cards: capa (lazy load), H2 título, meta description, data, tempo de leitura, "Ler mais"
- Paginação
- SEO: title, meta description, canonical, Open Graph, JSON-LD `Blog`

**`/blog/:slug`** — artigo:
- H1 único (título)
- Subtítulos H2/H3 do conteúdo rico
- Imagem de capa otimizada com alt
- Meta info: data, autor, categoria, tags, tempo leitura
- Conteúdo renderizado (HTML sanitizado)
- Links internos sugeridos (artigos relacionados pela categoria)
- CTA final para conversão (Solicitar Orçamento)
- SEO completo: meta tags dinâmicas, Open Graph, Twitter Card, JSON-LD `Article`, canonical
- 404 customizado se slug inválido

Componente reutilizável `<SEOHead>` para gerenciar `<head>` dinamicamente.

### 3. Sitemap dinâmico

Edge function `sitemap-xml` que gera `/sitemap.xml` incluindo posts publicados (lastmod = updated_at). Atualizar `public/robots.txt` e adicionar rota redirecionando para a function.

### 4. Área administrativa

Adicionar no menu lateral (sidebar-defaults para admin) a seção **Blog**:
- `/admin/blog` — listagem em tabela (título, palavra-chave, status, data, ações)
- `/admin/blog/novo` — criar
- `/admin/blog/:id` — editar
- `/admin/blog/categorias` — CRUD
- `/admin/blog/tags` — CRUD

Editor de artigo:
- Título + slug editável (auto-gerado a partir do título)
- Editor WYSIWYG (TipTap — bold, italic, H1/H2/H3, listas, links, alinhamento, imagens inline com upload + alt text)
- Upload de capa com preview e alt text
- Aba SEO: meta title, meta description, palavra-chave principal, secundárias (chips), preview do snippet do Google
- Categoria (select) + Tags (multi-select)
- Status: rascunho/publicado
- Botões: Salvar rascunho, Publicar, Visualizar

### 5. Performance & SEO

- Lazy load de imagens (`loading="lazy"`)
- `<picture>` com WebP quando possível (usa as imagens já enviadas)
- Heading hierarchy correta
- HTML semântico (`<article>`, `<header>`, `<time>`, `<nav>` breadcrumb)
- URLs limpas via slug
- Mobile-first (Tailwind)
- Sanitização do HTML do editor (DOMPurify) antes de renderizar

### 6. Detalhes técnicos

- Bibliotecas a instalar: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `dompurify`, `slugify`, `react-helmet-async`
- `react-helmet-async` para SEO dinâmico (envolver App em `HelmetProvider`)
- Edge function para sitemap (sem JWT)
- Adicionar link "Blog" no header público (`SiteHeader`)

### Estrutura de arquivos novos

```
src/pages/blog/BlogListPage.tsx
src/pages/blog/BlogPostPage.tsx
src/pages/admin/blog/AdminBlogListPage.tsx
src/pages/admin/blog/AdminBlogEditorPage.tsx
src/pages/admin/blog/AdminBlogCategoriasPage.tsx
src/pages/admin/blog/AdminBlogTagsPage.tsx
src/components/blog/PostCard.tsx
src/components/blog/RichTextEditor.tsx
src/components/blog/SEOHead.tsx
src/components/blog/SeoFields.tsx
src/lib/blog-utils.ts (slugify, reading time, sanitize)
supabase/functions/sitemap-xml/index.ts
supabase/migrations/<timestamp>_blog.sql
```

### Confirmação

Posso iniciar a implementação? Vou começar pela migração do banco (após sua aprovação) e seguir com instalação das libs, edge function de sitemap e telas. Confirma? Alguma preferência sobre o editor (TipTap como proposto está bom)?