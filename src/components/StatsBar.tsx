import { useLanguage } from '../contexts/LanguageContext';

export default function StatsBar() {
  const { t } = useLanguage();

  const stats = [
    { value: t.stats.countries, label: t.stats.countriesLabel },
    { value: t.stats.available, label: t.stats.availableLabel },
    { value: t.stats.response, label: t.stats.responseLabel },
    { value: t.stats.noApp, label: t.stats.noAppLabel },
  ];

  return (
    <section className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
