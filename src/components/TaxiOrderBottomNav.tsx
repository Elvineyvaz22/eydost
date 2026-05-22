import { Home, Route } from 'lucide-react';

export type TaxiOrderTab = 'home' | 'requests';

type Labels = {
  home: string;
  requests: string;
};

type Props = {
  active: TaxiOrderTab;
  onChange: (tab: TaxiOrderTab) => void;
  labels: Labels;
  variant?: 'light' | 'dark';
};

const tabs: { id: TaxiOrderTab; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'requests', icon: Route },
];

export default function TaxiOrderBottomNav({ active, onChange, labels, variant = 'dark' }: Props) {
  const light = variant === 'light';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md ${
        light ? 'bg-gray-100/95 border-gray-200' : 'bg-[#1a1a1a]/95 border-white/10'
      }`}
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {tabs.map(({ id, icon: Icon }) => {
          const isActive = active === id;
          const label = labels[id];

          const iconColor = light
            ? isActive
              ? 'text-blue-600'
              : 'text-gray-500'
            : isActive
              ? 'text-[#f5c518]'
              : 'text-gray-500';

          const labelColor = light
            ? isActive
              ? 'text-gray-900'
              : 'text-gray-500'
            : isActive
              ? 'text-[#f5c518]'
              : 'text-gray-500';

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isActive ? (light ? 'bg-white shadow-sm' : 'bg-[#2a2a2a]') : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={`text-[10px] font-medium leading-tight ${labelColor}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
