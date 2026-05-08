import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts } from '../data/blogPosts';
import { Clock, ArrowRight } from 'lucide-react';

const categoryColors: Record<string, string> = {
  esim: 'bg-blue-100 text-blue-700',
  taxi: 'bg-green-100 text-green-700',
  travel: 'bg-orange-100 text-orange-700',
};

const categoryLabels: Record<string, Record<string, string>> = {
  esim:   { en: 'eSIM', az: 'eSIM', ru: 'eSIM' },
  taxi:   { en: 'Taxi', az: 'Taksi', ru: 'Такси' },
  travel: { en: 'Travel Tips', az: 'Səyahət', ru: 'Советы' },
};

const uiText = {
  en: { title: 'Ey Dost Blog', subtitle: 'eSIM guides, travel tips and connectivity advice for smart travellers.', readMin: 'min read' },
  az: { title: 'Ey Dost Blog', subtitle: 'Ağıllı səyahətçilər üçün eSIM bələdçiləri, səyahət məsləhətləri.', readMin: 'dəq oxu' },
  ru: { title: 'Блог Ey Dost', subtitle: 'Руководства по eSIM, советы для путешественников.', readMin: 'мин чтения' },
};

export default function Blog() {
  const { language } = useLanguage();
  const lang = (language as keyof typeof uiText) in uiText ? language as keyof typeof uiText : 'en';
  const ui = uiText[lang];

  const sorted = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={ui.title}
        description={ui.subtitle}
        canonicalPath="/blog"
      />
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
              const content = post[lang];
              const catColor = categoryColors[post.category] || 'bg-gray-100 text-gray-600';
              const catLabel = categoryLabels[post.category]?.[lang] || post.category;

              return (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${catColor}`}>{catLabel}</span>
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
                    {lang === 'az' ? 'Oxu' : lang === 'ru' ? 'Читать' : 'Read more'} <ArrowRight className="w-4 h-4 ml-1" />
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
