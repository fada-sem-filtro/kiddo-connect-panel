import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SEOHead } from "@/components/blog/SEOHead";
import { PostCard } from "@/components/blog/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { buildBreadcrumbJsonLd } from "@/lib/blog-utils";
import NotFound from "@/pages/NotFound";

export default function BlogCategoriaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [categoria, setCategoria] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: cat } = await supabase
        .from("blog_categorias")
        .select("id, nome, slug, descricao")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat) { setLoading(false); return; }
      setCategoria(cat);
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, titulo, resumo, capa_url, capa_alt, published_at, reading_time, categoria_id, blog_categorias(nome, slug)")
        .eq("status", "publicado")
        .eq("categoria_id", cat.id)
        .order("published_at", { ascending: false });
      setPosts((data || []).map((p: any) => ({ ...p, categoria: p.blog_categorias })));
      setLoading(false);
    })();
  }, [slug]);

  if (!loading && !categoria) return <NotFound />;

  const url = `https://agendafleur.app/blog/categoria/${slug}`;
  const title = categoria ? `${categoria.nome} — Blog Agenda Fleur` : "Categoria";
  const description = categoria?.descricao
    || `Artigos sobre ${categoria?.nome?.toLowerCase() || ''} no Blog Agenda Fleur — agenda escolar digital e gestão de escolas infantis.`;

  const jsonLd = categoria ? [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
    },
    buildBreadcrumbJsonLd([
      { name: "Início", url: "https://agendafleur.app/" },
      { name: "Blog", url: "https://agendafleur.app/blog" },
      { name: categoria.nome, url },
    ]),
  ] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={description}
        canonical={`/blog/categoria/${slug}`}
        keywords={[categoria?.nome, "blog", "agenda escolar"].filter(Boolean) as string[]}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <header className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
          <nav aria-label="breadcrumb" className="text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Início</Link> <span>›</span>{" "}
            <Link to="/blog" className="hover:text-primary">Blog</Link> <span>›</span>{" "}
            <span>{categoria?.nome || ""}</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
            {categoria?.nome || ""}
          </h1>
          {categoria?.descricao && (
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {categoria.descricao}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nenhum artigo nesta categoria ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
