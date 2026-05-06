import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { formatDateBR } from '@/lib/blog-utils';

interface Post {
  slug: string;
  titulo: string;
  resumo?: string | null;
  capa_url?: string | null;
  capa_alt?: string | null;
  published_at?: string | null;
  reading_time?: number;
  categoria?: { nome: string; slug: string } | null;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link to={`/blog/${post.slug}`} className="block aspect-video bg-muted overflow-hidden">
        {post.capa_url ? (
          <img
            src={post.capa_url}
            alt={post.capa_alt || post.titulo}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/30" />
        )}
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        {post.categoria && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            {post.categoria.nome}
          </span>
        )}
        <h2 className="text-xl font-bold text-foreground mb-2 leading-snug">
          <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
            {post.titulo}
          </Link>
        </h2>
        {post.resumo && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{post.resumo}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <time dateTime={post.published_at}>{formatDateBR(post.published_at)}</time>
            </span>
          )}
          {post.reading_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.reading_time} min
            </span>
          )}
        </div>
        <Link
          to={`/blog/${post.slug}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ler mais →
        </Link>
      </div>
    </article>
  );
}
