import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { getPost, getBlogContent, getBlogImage } from '../data/blogPosts';
import { Clock, ArrowLeft, ArrowRight, Wifi } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const post = slug ? getPost(slug) : undefined;
  if (!post) return <Navigate to="/blog" replace />;

  const content = getBlogContent(post, language);
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
    mainEntityOfPage: `https://eydost.com/blog/${post.slug}`,
    image: imageUrl,
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={content.title}
        description={content.description}
        canonicalPath={`/blog/${post.slug}`}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">{catLabel}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readingMinutes} {readLabel}
              </span>
              <span className="text-xs text-gray-500">{post.publishedAt}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">{content.title}</h1>
            <p className="text-gray-300 text-lg leading-relaxed">{content.description}</p>
          </div>
        </section>

        {/* Featured image */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <img
            src={imageUrl}
            alt={content.title}
            className="w-full rounded-2xl shadow-lg object-cover max-h-[420px]"
          />
        </div>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10">
            {content.sections.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{section.heading}</h2>
                )}
                <p className="text-gray-600 leading-relaxed">{section.body}</p>
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
              href="https://wa.me/994992000444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors"
            >
              {ctaBtn} <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link to="/blog" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
          </div>
        </article>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
