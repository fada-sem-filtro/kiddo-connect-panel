import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SEOHead } from "@/components/blog/SEOHead";
import { PostCard } from "@/components/blog/PostCard";
import { BlogPostView } from "@/components/blog/BlogPostView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { buildBreadcrumbJsonLd, extractFaqJsonLd } from "@/lib/blog-utils";
import NotFound from "@/pages/NotFound";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categorias(nome, slug)")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();

      if (data) {
        setPost(data);
        // Increment views (best-effort)
        supabase
          .from("blog_posts")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", data.id)
          .then(() => {});

        // Tags
        const { data: pt } = await supabase
          .from("blog_post_tags")
          .select("blog_tags(id, nome, slug)")
          .eq("post_id", data.id);
        setTags((pt || []).map((r: any) => r.blog_tags).filter(Boolean));

        // Related
        if (data.categoria_id) {
          const { data: rel } = await supabase
            .from("blog_posts")
            .select("id, slug, titulo, resumo, capa_url, capa_alt, published_at, reading_time, blog_categorias(nome, slug)")
            .eq("status", "publicado")
            .eq("categoria_id", data.categoria_id)
            .neq("id", data.id)
            .order("published_at", { ascending: false })
            .limit(3);
          setRelated((rel || []).map((p: any) => ({ ...p, categoria: p.blog_categorias })));
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) return <NotFound />;

  const url = `https://agendafleur.app/blog/${post.slug}`;
  const categoriaUrl = post.blog_categorias?.slug
    ? `https://agendafleur.app/blog/categoria/${post.blog_categorias.slug}`
    : "https://agendafleur.app/blog";

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.meta_description || post.resumo,
    image: post.capa_url ? [post.capa_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.autor_nome || "Agenda Fleur" },
    publisher: {
      "@type": "Organization",
      name: "Agenda Fleur",
      logo: { "@type": "ImageObject", url: "https://agendafleur.app/icon-512.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.blog_categorias?.nome,
    keywords: [post.palavra_chave_principal, ...(post.palavras_chave_secundarias || [])].filter(Boolean).join(", "),
    wordCount: (post.conteudo || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length,
  };

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Início", url: "https://agendafleur.app/" },
    { name: "Blog", url: "https://agendafleur.app/blog" },
    ...(post.blog_categorias ? [{ name: post.blog_categorias.nome, url: categoriaUrl }] : []),
    { name: post.titulo, url },
  ]);

  const faq = extractFaqJsonLd(post.conteudo || '');
  const jsonLd: any[] = [blogPosting, breadcrumb];
  if (faq) jsonLd.push(faq);

  const breadcrumbNav = (
    <nav aria-label="breadcrumb" className="text-xs text-muted-foreground mb-6">
      <Link to="/" className="hover:text-primary">Início</Link> <span>›</span>{" "}
      <Link to="/blog" className="hover:text-primary">Blog</Link>{" "}
      {post.blog_categorias && (
        <>
          <span>›</span>{" "}
          <Link to={`/blog/categoria/${post.blog_categorias.slug}`} className="hover:text-primary">
            {post.blog_categorias.nome}
          </Link>{" "}
        </>
      )}
      <span>›</span> <span>{post.titulo}</span>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.meta_title || post.titulo}
        description={post.meta_description || post.resumo}
        canonical={`/blog/${post.slug}`}
        image={post.capa_url || undefined}
        type="article"
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        author={post.autor_nome}
        keywords={[post.palavra_chave_principal, ...(post.palavras_chave_secundarias || [])].filter(Boolean)}
        jsonLd={jsonLd}
        rssUrl={`${SUPABASE_URL}/functions/v1/rss-xml`}
      />
      <SiteHeader />

      <BlogPostView
        post={{
          titulo: post.titulo,
          resumo: post.resumo,
          conteudo: post.conteudo,
          capa_url: post.capa_url,
          capa_alt: post.capa_alt,
          published_at: post.published_at,
          reading_time: post.reading_time,
          autor_nome: post.autor_nome,
          categoria: post.blog_categorias,
        }}
        breadcrumb={breadcrumbNav}
      />

      <div className="max-w-3xl mx-auto px-4 -mt-4 pb-12">
        {tags.length > 0 && (
          <div className="mt-2 pt-6 border-t border-border flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.id} className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                #{t.nome}
              </span>
            ))}
          </div>
        )}

        <aside className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Quer modernizar a agenda da sua escola?</h2>
          <p className="text-muted-foreground mb-4">
            Conheça a Agenda Fleur — a agenda escolar digital pensada para escolas infantis.
          </p>
          <Link to="/conheca">
            <Button size="lg">Conhecer o sistema</Button>
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Artigos relacionados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/blog">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Blog
              </Button>
            </Link>
          </div>
        </section>
      )}

      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
            <Link to="/conheca" className="text-muted-foreground hover:text-primary transition-colors">Conheça o sistema</Link>
            <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">Novidades</Link>
            <button onClick={() => { window.location.href = "/?orcamento=1"; }} className="text-muted-foreground hover:text-primary transition-colors">Solicitar orçamento</button>
            <a href="mailto:contato@agendafleur.app" className="text-muted-foreground hover:text-primary transition-colors">Contato</a>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
