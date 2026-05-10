import slugifyLib from 'slugify';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

export function slugify(input: string): string {
  return slugifyLib(input || '', { lower: true, strict: true, locale: 'pt' });
}

export function calcReadingTime(html: string): number {
  const text = (html || '').replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel', 'loading', 'alt', 'allow', 'allowfullscreen', 'frameborder', 'open'],
    ADD_TAGS: ['iframe', 'details', 'summary'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

export function excerptFromHtml(html: string, maxLen = 160): string {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + '…';
}

export function formatDateBR(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
}

/**
 * Ensure the slug is unique in blog_posts. Appends -2, -3, ... if needed.
 * Pass `excludeId` when editing an existing post.
 */
export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'post';
  let candidate = root;
  let i = 1;
  // Up to 50 attempts — more than enough.
  while (i <= 50) {
    const q = supabase.from('blog_posts').select('id').eq('slug', candidate).limit(1);
    const { data } = await q;
    const conflict = (data || []).find((r: any) => r.id !== excludeId);
    if (!conflict) return candidate;
    i += 1;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

/**
 * Demote any extra <h1> tags to <h2> so the article body keeps a single H1
 * (the page title is already an H1).
 */
export function demoteH1ToH2(html: string): string {
  return (html || '').replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
}

/**
 * Detects FAQ blocks in the form:
 *   <h3>Pergunta?</h3>
 *   <p>Resposta...</p>
 * Returns FAQPage JSON-LD entities or null when none qualify.
 */
export function extractFaqJsonLd(html: string): any | null {
  if (!html) return null;
  const items: { q: string; a: string }[] = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*((?:<p[^>]*>[\s\S]*?<\/p>\s*)+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const q = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const a = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (q.endsWith('?') && a.length > 20) items.push({ q, a });
  }
  if (items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(i => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
