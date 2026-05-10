import { Calendar, Clock } from 'lucide-react';
import { formatDateBR, sanitizeHtml } from '@/lib/blog-utils';
import { useMemo } from 'react';

export interface BlogPostViewData {
  titulo: string;
  resumo?: string | null;
  conteudo: string;
  capa_url?: string | null;
  capa_alt?: string | null;
  published_at?: string | null;
  reading_time?: number | null;
  autor_nome?: string | null;
  categoria?: { nome: string; slug?: string } | null;
}

interface Props {
  post: BlogPostViewData;
  showBreadcrumb?: boolean;
  breadcrumb?: React.ReactNode;
}

export function BlogPostView({ post, showBreadcrumb = true, breadcrumb }: Props) {
  const safeHtml = useMemo(() => sanitizeHtml(post.conteudo || ''), [post.conteudo]);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {showBreadcrumb && breadcrumb}

      <header className="mb-8">
        {post.categoria && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {post.categoria.nome}
          </span>
        )}
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground mt-2 mb-4 leading-tight">
          {post.titulo}
        </h1>
        {post.resumo && <p className="text-lg text-muted-foreground">{post.resumo}</p>}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.published_at}>{formatDateBR(post.published_at)}</time>
            </span>
          )}
          {post.reading_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.reading_time} min de leitura
            </span>
          )}
          {post.autor_nome && <span>Por {post.autor_nome}</span>}
        </div>
      </header>

      {post.capa_url && (
        <figure className="mb-8 -mx-4 sm:mx-0">
          <img
            src={post.capa_url}
            alt={post.capa_alt || post.titulo}
            className="w-full h-auto sm:rounded-2xl"
            loading="eager"
            fetchPriority="high"
          />
        </figure>
      )}

      <div
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </article>
  );
}
