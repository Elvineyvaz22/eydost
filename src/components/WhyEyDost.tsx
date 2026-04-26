import { MessageCircle, Zap, Globe, Car, Bot, Clock } from 'lucide-react';

export default function WhyEyDost() {
  const features = [
    { 
      icon: MessageCircle, 
      title: "No App Required", 
      desc: "Everything works seamlessly via WhatsApp.", 
      color: 'from-green-500 to-emerald-600' 
    },
    { 
      icon: Zap, 
      title: "Instant Delivery", 
      desc: "Get your eSIM connected in seconds.", 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      icon: Globe, 
      title: "150+ Countries", 
      desc: "Global coverage for connectivity and rides.", 
      color: 'from-indigo-500 to-purple-500' 
    },
    { 
      icon: Car, 
      title: "Fast Taxis", 
      desc: "Have a taxi next to you in just 3-4 minutes.", 
      color: 'from-yellow-400 to-orange-500' 
    },
    { 
      icon: Bot, 
      title: "AI Powered", 
      desc: "A smart assistant that perfectly understands you.", 
      color: 'from-cyan-400 to-blue-500' 
    },
    { 
      icon: Clock, 
      title: "24/7 Support", 
      desc: "We are always here when you need us.", 
      color: 'from-orange-400 to-red-500' 
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-14">Why Choose Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
