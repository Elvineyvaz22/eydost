/**
 * EsimAccountDemo
 * ================
 * Real API çağırışı olmadan `EsimAccount` ekranını mock data ilə render edir.
 * Route: `/esim-demo`.
 *
 * Backend canlı endpoint-lər deploy etməmiş, dizaynı yoxlamaq və test etmək
 * üçün istifadə olunur. Production-da heç bir effekti yoxdur — adi istifadəçi
 * adətən bu URL-ə düşmür.
 */

import EsimAccount, {
  type EnrichedEsim,
  type EnrichedOrder,
} from './EsimAccount';

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

const DEMO_ESIMS: EnrichedEsim[] = [
  {
    id: 1042,
    iccid: '8990012050000123456',
    status: 'active',
    qr_code_url: null,
    activation_code: null,
    smdp_address: null,
    pin: null,
    puk: null,
    apn: null,
    country_code: 'TR',
    country_name: 'Turkey',
    package_name: 'Turkey 5 GB · 30 days',
    package_volume_bytes: 5 * GB,
    package_duration_days: 30,
    usage: {
      total_volume: 5 * GB,
      used_volume: 5 * GB - Math.floor(2.1 * GB),
      remain_volume: Math.floor(2.1 * GB),
      expired_time: daysFromNow(18),
      status: 'IN_USE',
    },
  },
  {
    id: 1038,
    iccid: '8990012050000098765',
    status: 'active',
    qr_code_url: null,
    activation_code: null,
    smdp_address: null,
    pin: null,
    puk: null,
    apn: null,
    country_code: 'GE',
    country_name: 'Georgia',
    package_name: 'Georgia 1 GB · 7 days',
    package_volume_bytes: 1 * GB,
    package_duration_days: 7,
    usage: {
      total_volume: 1 * GB,
      used_volume: 650 * MB,
      remain_volume: 374 * MB,
      expired_time: daysFromNow(3),
      status: 'IN_USE',
    },
  },
  {
    id: 1012,
    iccid: '8990012050000045678',
    status: 'expired',
    qr_code_url: null,
    activation_code: null,
    smdp_address: null,
    pin: null,
    puk: null,
    apn: null,
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    package_name: 'UAE 3 GB · 30 days',
    package_volume_bytes: 3 * GB,
    package_duration_days: 30,
  },
];

const DEMO_ORDERS: EnrichedOrder[] = [
  {
    id: 1042,
    status: 'completed',
    order_type: 'web',
    country_code: 'TR',
    country_name: 'Turkey',
    package_code: 'CKH267',
    package_name: 'Turkey 5 GB · 30 days',
    currency: 'AZN',
    sell_price: '6.85',
    transaction_id: 'TX-2026-1042',
    provider_order_no: 'ESM-1042',
    created_at: daysAgo(12),
  },
  {
    id: 1038,
    status: 'completed',
    order_type: 'web',
    country_code: 'GE',
    country_name: 'Georgia',
    package_code: 'CKH511',
    package_name: 'Georgia 1 GB · 7 days',
    currency: 'AZN',
    sell_price: '2.57',
    transaction_id: 'TX-2026-1038',
    provider_order_no: 'ESM-1038',
    created_at: daysAgo(4),
  },
  {
    id: 1012,
    status: 'completed',
    order_type: 'web',
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    package_code: 'CKH333',
    package_name: 'UAE 3 GB · 30 days',
    currency: 'AZN',
    sell_price: '12.30',
    transaction_id: 'TX-2026-1012',
    provider_order_no: 'ESM-1012',
    created_at: daysAgo(45),
  },
  {
    id: 998,
    status: 'refunded',
    order_type: 'web',
    country_code: 'US',
    country_name: 'United States',
    package_code: 'CKH899',
    package_name: 'USA 5 GB · 30 days',
    currency: 'AZN',
    sell_price: '14.20',
    transaction_id: 'TX-2026-0998',
    provider_order_no: 'ESM-0998',
    created_at: daysAgo(92),
  },
  {
    id: 970,
    status: 'completed',
    order_type: 'web',
    country_code: 'FR',
    country_name: 'France',
    package_code: 'CKH721',
    package_name: 'France 1 GB · 7 days',
    currency: 'AZN',
    sell_price: '3.45',
    transaction_id: 'TX-2026-0970',
    provider_order_no: 'ESM-0970',
    created_at: daysAgo(140),
  },
];

export default function EsimAccountDemo() {
  return (
    <EsimAccount
      waId="994558878889"
      demoData={{ esims: DEMO_ESIMS, orders: DEMO_ORDERS }}
    />
  );
}
