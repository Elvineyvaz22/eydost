import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts, getBlogContent, getBlogImage } from '../data/blogPosts';
import type { AppLanguage } from '../utils/languagePreference';
import { blogPath } from '../utils/localePaths';
import { Clock, ArrowRight } from 'lucide-react';

const categoryColors: Record<string, string> = {
  esim: 'bg-blue-100 text-blue-700',
  taxi: 'bg-green-100 text-green-700',
  travel: 'bg-orange-100 text-orange-700',
};

export default function Blog({ contentLocale }: { contentLocale: AppLanguage }) {
  const { t } = useLanguage();
  const blogT = (t as Record<string, Record<string, string>>).blog;
  const ui = {
    title: blogT?.title ?? 'Ey Dost Blog',
    subtitle: blogT?.subtitle ?? '',
    readMin: blogT?.readMin ?? 'min read',
    readMore: blogT?.readMore ?? 'Read more',
  };
  const categoryLabels: Record<string, string> = {
    esim: blogT?.categoryEsim ?? 'eSIM',
    taxi: blogT?.categoryTaxi ?? 'Taxi',
    travel: blogT?.categoryTravel ?? 'Travel Tips',
  };

  const sorted = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="min-h-screen bg-white">
      <Seo title={ui.title} description={ui.subtitle} canonicalPath={blogPath(undefined, contentLocale)} />
      <Header />

      <main className="pt-24 pb-16">
        <section className="bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{ui.title}</h1>
            <p className="text-xl text-gray-300">{ui.subtitle}</p>
          </div>
        </section>

        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sorted.map((post) => {
              const content = getBlogContent(post, contentLocale);
              const imageUrl = getBlogImage(post);
              const catColor = categoryColors[post.category] || 'bg-gray-100 text-gray-600';
              const catLabel = categoryLabels[post.category] || post.category;

              return (
                <Link
                  key={post.slug}
                  to={blogPath(post.slug, contentLocale)}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
                >
                  <img
                    src={imageUrl}
                    alt={content.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-44 sm:h-48 object-cover bg-gray-100 group-hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallback) return;
                      img.dataset.fallback = '1';
                      img.src = 'https://eydost.com/og-image.png';
                    }}
                  />
                  <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${catColor}`}>
                      {catLabel}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readingMinutes} {ui.readMin}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{post.publishedAt}</span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug flex-1">
                    {content.title}
                  </h2>

                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                    {content.description}
                  </p>

                  <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                    {ui.readMore} <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
