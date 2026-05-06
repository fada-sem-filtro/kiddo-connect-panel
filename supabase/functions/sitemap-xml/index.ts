import { createClient } from 'jsr:@supabase/supabase-js@2';

const SITE = 'https://agendafleur.app';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'publicado')
    .order('published_at', { ascending: false });

  const staticUrls = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'monthly' },
    { loc: `${SITE}/conheca`, priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE}/sobre`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE}/blog`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE}/login`, priority: '0.5', changefreq: 'yearly' },
  ];

  const urls = [
    ...staticUrls.map(u => `<url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`),
    ...(posts || []).map((p: any) => {
      const lastmod = (p.updated_at || p.published_at || '').slice(0, 10);
      return `<url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
});
