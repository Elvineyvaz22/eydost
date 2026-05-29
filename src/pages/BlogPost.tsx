import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { getPost, getBlogContent, getBlogImage } from '../data/blogPosts';
import type { AppLanguage } from '../utils/languagePreference';
import { blogPath, hrefLangCode } from '../utils/localePaths';
import { Clock, ArrowLeft, ArrowRight, Wifi } from 'lucide-react';
import BlogArticleBody from '../components/BlogArticleBody';

export default function BlogPost({ contentLocale }: { contentLocale: AppLanguage }) {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const post = slug ? getPost(slug) : undefined;
  const blogIndexPath = blogPath(undefined, contentLocale);
  if (!post) return <Navigate to={blogIndexPath} replace />;

  const content = getBlogContent(post, contentLocale);
  const imageUrl = getBlogImage(post);
  const blogT = (t as Record<string, Record<string, string>>).blog ?? {};

  const readLabel = blogT.readMin ?? 'min read';
  const backLabel = blogT.backToBlog ?? 'Back to Blog';
  const ctaTitle = blogT.ctaTitle ?? 'Ready to get connected?';
  const ctaBtn = blogT.ctaButton ?? 'Get eSIM on WhatsApp';
  const categoryLabels: Record<string, string> = {
    esim: blogT.categoryEsim ?? 'eSIM',
    taxi: blogT.categoryTaxi ?? 'Taxi',
    travel: blogT.categoryTravel ?? 'Travel',
  };
  const catLabel = categoryLabels[post.category] ?? post.category;
  const ctaWhatsApp =
    post.category === 'taxi' ? 'https://wa.me/994992000444' : 'https://wa.me/994992010117';

  const sectionImages = content.sections
    .map((s) => s.image?.src)
    .filter((src): src is string => Boolean(src));
  const jsonLdImages = Array.from(new Set([imageUrl, ...sectionImages]));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    description: content.description,
    author: { '@type': 'Organization', name: 'Ey Dost' },
    publisher: {
      '@type': 'Organization',
      name: 'Ey Dost',
      logo: { '@type': 'ImageObject', url: 'https://eydost.com/icon-512.png' },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: `https://eydost.com${blogPath(post.slug, contentLocale)}`,
    inLanguage: hrefLangCode(contentLocale),
    image: jsonLdImages.length === 1 ? jsonLdImages[0] : jsonLdImages,
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={content.title}
        description={content.description}
        canonicalPath={blogPath(post.slug, contentLocale)}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-24 pb-16 bg-gray-50">
        {/* Hero — text only */}
        <section className="bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <Link
              to={blogIndexPath}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
                {catLabel}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readingMinutes} {readLabel}
              </span>
              <span className="text-xs text-gray-500">{post.publishedAt}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{content.title}</h1>
            <p className="mt-4 text-gray-300 text-lg leading-relaxed max-w-2xl">{content.description}</p>
          </div>
        </section>

        {/* Image + article — single card below hero (no overlap) */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <figure className="bg-gray-100">
              <img
                src={imageUrl}
                alt={content.title}
                decoding="async"
                className="w-full aspect-[2/1] sm:aspect-[21/9] object-cover bg-gray-100"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallback) return;
                  img.dataset.fallback = '1';
                  img.src = 'https://eydost.com/og-image.png';
                }}
              />
            </figure>

            <article className="px-6 sm:px-10 py-8 sm:py-10">
          <div className="space-y-10">
            {content.sections.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pt-2">{section.heading}</h2>
                )}
                <BlogArticleBody body={section.body} />
                {section.image && (
                  <figure className="my-6">
                    <img
                      src={section.image.src}
                      alt={section.image.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-xl border border-gray-100 object-cover max-h-80 bg-gray-50"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallback) return;
                        img.dataset.fallback = '1';
                        img.src = 'https://eydost.com/og-image.png';
                      }}
                    />
                    {section.image.caption && (
                      <figcaption className="mt-2 text-sm text-gray-500 text-center">
                        {section.image.caption}
                      </figcaption>
                    )}
                  </figure>
                )}
                {section.list && (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-gray-600 text-sm">
                        <span className="text-blue-500 font-bold mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 bg-gradient-to-br from-gray-900 to-[#0A0F1C] rounded-3xl p-8 text-center text-white">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{ctaTitle}</h3>
            <p className="text-gray-400 text-sm mb-6">{content.description}</p>
            <a
              href={ctaWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors"
            >
              {ctaBtn} <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link to={blogIndexPath} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
          </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
