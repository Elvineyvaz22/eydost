import { formatOrderDate, type TaxiOrderRecord } from '../services/taxiSessionApi';

type Props = {
  orders: TaxiOrderRecord[];
  language: string;
  title: string;
  emptyText: string;
  repeatLabel: string;
  onSelect: (order: TaxiOrderRecord) => void;
  variant?: 'dark' | 'light';
};

export default function TaxiRequestsPanel({
  orders,
  language,
  title,
  emptyText,
  repeatLabel,
  onSelect,
  variant = 'dark',
}: Props) {
  const isDark = variant === 'dark';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={`px-1 pb-3 ${isDark ? '' : 'pt-2'}`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {orders.length === 0 ? (
          <p className={`text-sm text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {emptyText}
          </p>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelect(order)}
              className={`w-full text-left rounded-2xl p-4 active:opacity-90 border ${
                isDark
                  ? 'bg-[#1e1e1e] border-white/10 active:bg-[#252525]'
                  : 'bg-gray-50 border-gray-100 active:bg-gray-100'
              }`}
            >
              <p className={`text-[10px] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatOrderDate(order.created_at, language)}
              </p>
              <div className="flex gap-2 items-start mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {order.pickup_address}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-2 h-2 rounded-sm bg-sky-500 mt-1.5 shrink-0" />
                <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {order.dropoff_address}
                </p>
              </div>
              <p className="text-[#f5c518] text-xs font-semibold mt-3">{repeatLabel}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
