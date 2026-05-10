// SEO + readability scoring for blog posts (pt-BR).

export interface SeoInput {
  titulo: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  resumo?: string;
  conteudoHtml: string;
  capaAlt?: string;
  keyword?: string;
}

export interface SeoCheck {
  id: string;
  label: string;
  ok: boolean;
  warn?: boolean;
  hint?: string;
}

export interface SeoReport {
  score: number; // 0..100
  checks: SeoCheck[];
  wordCount: number;
  keywordDensity: number; // %
  readabilityScore: number; // 0..100
  readabilityLabel: string;
}

const stripHtml = (html: string) =>
  (html || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const lower = (s?: string) => (s || '').toLowerCase();
const countOccurrences = (haystack: string, needle: string) => {
  if (!needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (haystack.match(re) || []).length;
};

function countSyllablesPt(word: string): number {
  const w = word.toLowerCase().replace(/[^a-záàâãéêíóôõúüç]/g, '');
  if (!w) return 0;
  const groups = w.match(/[aeiouáàâãéêíóôõúü]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function computeSeoReport(input: SeoInput): SeoReport {
  const text = stripHtml(input.conteudoHtml);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keyword = lower(input.keyword).trim();
  const kwOccurrences = keyword ? countOccurrences(text, keyword) : 0;
  const keywordDensity = wordCount > 0 ? +((kwOccurrences / wordCount) * 100).toFixed(2) : 0;

  // First H2/H3 / first paragraph extraction
  const firstParagraph = (input.conteudoHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const firstParaText = stripHtml(firstParagraph);
  const headings = Array.from(input.conteudoHtml.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)).map(m => stripHtml(m[2]));

  const checks: SeoCheck[] = [];
  const push = (id: string, label: string, ok: boolean, hint?: string, warn?: boolean) =>
    checks.push({ id, label, ok, warn, hint });

  // Title
  const title = input.metaTitle || input.titulo;
  push('title-len', 'Título SEO entre 30 e 60 caracteres', title.length >= 30 && title.length <= 60,
    `Atual: ${title.length} chars`, title.length > 0 && title.length < 30);
  push('title-keyword', 'Palavra-chave no título', !!keyword && lower(title).includes(keyword));

  // Meta description
  const desc = input.metaDescription || input.resumo || '';
  push('meta-len', 'Meta description entre 120 e 160 caracteres', desc.length >= 120 && desc.length <= 160,
    `Atual: ${desc.length} chars`, desc.length > 0 && desc.length < 120);
  push('meta-keyword', 'Palavra-chave na meta description', !!keyword && lower(desc).includes(keyword));

  // Slug
  push('slug-keyword', 'Palavra-chave no slug', !!keyword && lower(input.slug).includes(keyword.replace(/\s+/g, '-')));
  push('slug-clean', 'Slug curto e limpo', !!input.slug && input.slug.length <= 75 && /^[a-z0-9-]+$/.test(input.slug));

  // Content
  push('word-count', 'Conteúdo com pelo menos 300 palavras', wordCount >= 300, `Atual: ${wordCount} palavras`);
  push('first-para-keyword', 'Palavra-chave no 1º parágrafo', !!keyword && lower(firstParaText).includes(keyword));
  push('headings', 'Usa subtítulos (H2/H3)', headings.length >= 1);
  push('keyword-in-headings', 'Palavra-chave em algum subtítulo',
    !!keyword && headings.some(h => lower(h).includes(keyword)));

  // Density
  push('density', 'Densidade da palavra-chave entre 0,5% e 2,5%',
    keywordDensity >= 0.5 && keywordDensity <= 2.5, `${keywordDensity}%`,
    keywordDensity > 0 && keywordDensity < 0.5);

  // Image alt
  const hasImg = /<img\b/i.test(input.conteudoHtml) || !!input.capaAlt;
  push('image-alt', 'Imagem de capa com texto alternativo (ALT)', !!input.capaAlt && input.capaAlt.length >= 5,
    'Adicione um ALT descritivo à capa.');
  push('inline-imgs-alt', 'Imagens do corpo com ALT',
    !hasImg || !/<img\b(?![^>]*\balt=)/i.test(input.conteudoHtml));

  // Internal links
  push('internal-link', 'Pelo menos 1 link interno (/blog ou agendafleur.app)',
    /<a[^>]+href=["'][^"']*(\/blog|agendafleur\.app)/i.test(input.conteudoHtml));

  // Score
  const passed = checks.filter(c => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  // Readability — Flesch adapted (pt-BR)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const syllables = words.reduce((acc, w) => acc + countSyllablesPt(w), 0);
  const asl = wordCount / sentences;
  const asw = wordCount > 0 ? syllables / wordCount : 0;
  // Flesch Reading Ease adaptation
  const readability = 248.835 - 1.015 * asl - 84.6 * asw;
  const readabilityScore = Math.max(0, Math.min(100, Math.round(readability)));
  const readabilityLabel =
    readabilityScore >= 80 ? 'Muito fácil' :
    readabilityScore >= 70 ? 'Fácil' :
    readabilityScore >= 60 ? 'Padrão' :
    readabilityScore >= 50 ? 'Razoavelmente difícil' :
    readabilityScore >= 30 ? 'Difícil' : 'Muito difícil';

  return { score, checks, wordCount, keywordDensity, readabilityScore, readabilityLabel };
}
