import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import SoroBlogEmbed from '../components/SoroBlogEmbed';
import { useLanguage } from '../contexts/LanguageContext';

export default function Blog() {
  const { t } = useLanguage();
  const blogT = (t as Record<string, Record<string, string>>).blog;
  const ui = {
    title: blogT?.title ?? 'Ey Dost Blog',
    subtitle: blogT?.subtitle ?? '',
  };

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

        <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SoroBlogEmbed />
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
