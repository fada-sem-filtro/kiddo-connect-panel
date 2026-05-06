
-- Tabela de categorias
CREATE TABLE public.blog_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tags
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de artigos
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  resumo TEXT,
  conteudo TEXT NOT NULL DEFAULT '',
  capa_url TEXT,
  capa_alt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  palavra_chave_principal TEXT,
  palavras_chave_secundarias TEXT[] NOT NULL DEFAULT '{}',
  categoria_id UUID REFERENCES public.blog_categorias(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado')),
  autor_user_id UUID,
  autor_nome TEXT,
  reading_time INT NOT NULL DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_categoria ON public.blog_posts(categoria_id);

-- Tabela N:N posts <-> tags
CREATE TABLE public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Trigger updated_at
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_categorias_updated BEFORE UPDATE ON public.blog_categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.blog_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Leitura pública (anon + authenticated)
CREATE POLICY "Public can read categorias" ON public.blog_categorias
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read tags" ON public.blog_tags
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'publicado');

CREATE POLICY "Public can read post_tags of published" ON public.blog_post_tags
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = post_id AND p.status = 'publicado')
  );

-- Admin: gestão completa
CREATE POLICY "Admins manage categorias" ON public.blog_categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage tags" ON public.blog_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage post_tags" ON public.blog_post_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bucket público para imagens do blog
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-imagens', 'blog-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read blog images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'blog-imagens');

CREATE POLICY "Admins can upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));
