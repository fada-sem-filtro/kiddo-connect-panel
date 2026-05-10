import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  jsonLd?: Record<string, any> | Record<string, any>[];
  rssUrl?: string;
}

const SITE_URL = 'https://agendafleur.app';

export function SEOHead({
  title,
  description,
  canonical,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  keywords,
  jsonLd,
  rssUrl,
}: SEOHeadProps) {
  const fullTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const fullDesc = description ? (description.length > 160 ? description.slice(0, 157) + '…' : description) : undefined;
  const url = canonical?.startsWith('http') ? canonical : `${SITE_URL}${canonical || ''}`;
  const img = image || `${SITE_URL}/icon-512.png`;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {fullDesc && <meta name="description" content={fullDesc} />}
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.filter(Boolean).join(', ')} />}
      <link rel="canonical" href={url} />
      {rssUrl && <link rel="alternate" type="application/rss+xml" title="Agenda Fleur — Blog" href={rssUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {fullDesc && <meta property="og:description" content={fullDesc} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:site_name" content="Agenda Fleur" />
      <meta property="og:locale" content="pt_BR" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {fullDesc && <meta name="twitter:description" content={fullDesc} />}
      <meta name="twitter:image" content={img} />

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}
