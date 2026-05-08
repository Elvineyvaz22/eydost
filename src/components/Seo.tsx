import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonicalPath?: string;
  jsonLd?: object | object[];
};

const DEFAULT_SITE_URL = 'https://eydost.com';
const DEFAULT_OG_IMAGE = 'https://eydost.com/og-image.png';
const DEFAULT_TITLE = 'Ey Dost — Global eSIM & Taxi Booking via WhatsApp';
const DEFAULT_DESCRIPTION =
  "Ey Dost — Your Global Travel Companion on WhatsApp. Instant eSIM in 150+ countries and worldwide taxi booking. No app needed.";

function getSiteUrl(): string {
  const env = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  const raw = (env || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '');
}

function toCanonicalUrl(siteUrl: string, canonicalPath: string) {
  const pathname = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  return `${siteUrl}${pathname}`;
}

export default function Seo(props: SeoProps) {
  const { language } = useLanguage();
  const location = useLocation();

  const title = props.title ? `${props.title} | Ey Dost` : DEFAULT_TITLE;
  const description = props.description || DEFAULT_DESCRIPTION;
  const image = props.image || DEFAULT_OG_IMAGE;

  const siteUrl = getSiteUrl();
  const canonicalPath = props.canonicalPath ?? location.pathname;
  const canonicalUrl = toCanonicalUrl(siteUrl, canonicalPath);

  const jsonLdItems = props.jsonLd
    ? Array.isArray(props.jsonLd) ? props.jsonLd : [props.jsonLd]
    : [];

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <link rel="canonical" href={canonicalUrl} />

      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Ey Dost" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {props.noIndex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : null}

      {jsonLdItems.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

