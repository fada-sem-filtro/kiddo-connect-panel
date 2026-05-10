import { createClient } from 'jsr:@supabase/supabase-js@2';

const SITE = 'https://agendafleur.app';

const escape = (s: string) =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, titulo, resumo, capa_url, published_at, autor_nome')
    .eq('status', 'publicado')
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts || []).map((p: any) => {
    const link = `${SITE}/blog/${p.slug}`;
    const date = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString();
    return `    <item>
      <title>${escape(p.titulo)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      ${p.autor_nome ? `<author>contato@agendafleur.app (${escape(p.autor_nome)})</author>` : ''}
      <description>${escape(p.resumo || '')}</description>
      ${p.capa_url ? `<enclosure url="${escape(p.capa_url)}" type="image/jpeg" />` : ''}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Agenda Fleur</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Conteúdo sobre agenda escolar digital, gestão escolar e educação infantil.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
