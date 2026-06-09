import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { activateEsimDemoChatbot } from '../components/EsimDemoChatbot';

export default function ChatbotDemo() {
  useEffect(() => {
    activateEsimDemoChatbot();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="eSIM Chatbot Demo" noIndex canonicalPath="/chatbot-demo" />
      <Header />
      <main className="pt-28">
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:items-center lg:px-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-blue-100">
                <Bot className="h-4 w-4" />
                Test rejimi
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                eSIM chatbot demo
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Chatbot ölkəni başa düşür, uyğun eSIM səhifəsinə keçir, paket təklif edir və sifarişi WhatsApp-da tamamlayır.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/turkey-esim" className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700">
                  Türkiyə ilə test et
                </Link>
                <Link to="/esim" className="rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/15 hover:bg-white/15">
                  Ölkələrə bax
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-2xl">
              <div className="grid gap-4">
                {[
                  { icon: MessageCircle, title: 'Chatla başlayır', text: 'Müştəri “Türkiyə üçün internet” yazır.' },
                  { icon: Smartphone, title: 'Səhifəyə keçir', text: 'Arxa planda uyğun ölkə səhifəsi açılır.' },
                  { icon: ShieldCheck, title: 'WhatsApp final', text: 'Paket seçilir və sifariş WhatsApp-a göndərilir.' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-black">{item.title}</div>
                        <div className="mt-1 text-sm font-medium text-slate-500">{item.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">Necə test edək?</h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              Sağ altdakı chatbot açıq qalacaq. “Türkiyə üçün 7 günlük eSIM lazımdır” yazın. Chatbot sizi Türkiyə eSIM səhifəsinə aparacaq və paket seçimini WhatsApp mesajına çevirəcək.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
