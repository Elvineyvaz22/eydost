import { MessageSquare, CreditCard, Smartphone } from 'lucide-react';

export default function HowEsimWorks() {
  const steps = [
    { 
      icon: MessageSquare, 
      title: "Message Us", 
      desc: "Tell us your destination country directly on WhatsApp.", 
      color: 'from-green-400 to-emerald-500' 
    },
    { 
      icon: CreditCard, 
      title: "Pay Instantly", 
      desc: "Secure checkout. We support fast payments.", 
      color: 'from-blue-400 to-cyan-500',
      showPayLogos: true
    },
    { 
      icon: Smartphone, 
      title: "Get Connected", 
      desc: "Receive a QR code, scan it, and activate in seconds.", 
      color: 'from-orange-400 to-amber-500' 
    },
  ];

  return (
    <section id="how-esim" className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-14">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative text-center pt-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {i + 1}
                </div>
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg shadow-${step.color.split('-')[1]}/30`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.desc}</p>
                
                {step.showPayLogos && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors cursor-default">
                      <svg viewBox="0 0 384 512" className="w-3 h-3 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                      Pay
                    </div>
                    <div className="bg-white border border-gray-200 text-[#5f6368] px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-gray-50 transition-colors cursor-default">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Pay
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
