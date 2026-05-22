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
};

const tabs: { id: TaxiOrderTab; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'requests', icon: Route },
];

export default function TaxiOrderBottomNav({ active, onChange, labels }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1a1a]/95 border-t border-white/10 backdrop-blur-md"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch justify-around px-2 pt-2">
        {tabs.map(({ id, icon: Icon }) => {
          const isActive = active === id;
          const label = labels[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 rounded-2xl transition-colors ${
                isActive ? 'text-[#f5c518]' : 'text-gray-500'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? 'bg-[#2a2a2a]' : ''
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={`text-[11px] font-medium ${isActive ? 'text-white' : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
