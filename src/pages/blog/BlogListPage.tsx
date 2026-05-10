import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SEOHead } from "@/components/blog/SEOHead";
import { PostCard } from "@/components/blog/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function BlogListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cats }, { data }] = await Promise.all([
        supabase.from("blog_categorias").select("id, nome, slug").order("nome"),
        supabase
          .from("blog_posts")
          .select(
            "id, slug, titulo, resumo, capa_url, capa_alt, published_at, reading_time, categoria_id, blog_categorias(nome, slug)",
          )
          .eq("status", "publicado")
          .order("published_at", { ascending: false })
          .limit(60),
      ]);
      setCategorias(cats || []);
      setPosts((data || []).map((p: any) => ({ ...p, categoria: p.blog_categorias })));
      setLoading(false);
    })();
  }, []);

  const filtered = activeCat ? posts.filter((p) => p.categoria_id === activeCat) : posts;

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const rssUrl = `${SUPABASE_URL}/functions/v1/rss-xml`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Blog Agenda Fleur",
      description: "Conteúdo sobre agenda escolar digital, gestão escolar e educação infantil",
      url: "https://agendafleur.app/blog",
      publisher: { "@type": "Organization", name: "Agenda Fleur" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: posts.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://agendafleur.app/blog/${p.slug}`,
        name: p.titulo,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog Agenda Fleur — Agenda Escolar Digital, Gestão e Educação Infantil"
        description="Dicas, novidades e guias sobre agenda escolar digital, gestão de escolas infantis e tecnologia educacional. Conteúdo da Agenda Fleur."
        canonical="/blog"
        keywords={[
          "agenda escolar digital",
          "agenda digital para escola infantil",
          "gestão escolar",
          "comunicação escola família",
        ]}
        jsonLd={jsonLd}
        rssUrl={rssUrl}
      />
      <SiteHeader />

      <header className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
          <nav aria-label="breadcrumb" className="text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">
              Início
            </Link>{" "}
            <span>›</span> <span>Blog</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">Blog Agenda Fleur</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Dicas, guias e novidades sobre <strong>agenda escolar digital</strong>, gestão de escolas infantis e
            tecnologia educacional.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {categorias.length > 0 && (
          <nav aria-label="Categorias" className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setActiveCat(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCat === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70 text-foreground"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeCat === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/70 text-foreground"
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </nav>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nenhum artigo publicado ainda. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link to="/conheca" className="text-muted-foreground hover:text-primary transition-colors">
              Conheça o sistema
            </Link>
            <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
              Novidades
            </Link>
            <button
              onClick={() => { window.location.href = "/?orcamento=1"; }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Solicitar orçamento
            </button>
            <a
              href="mailto:contato@agendafleur.app"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Contato
            </a>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
