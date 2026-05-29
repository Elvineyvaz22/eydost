/** Per-article featured images (card + article header). URLs verified to return HTTP 200. */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

export const BLOG_POST_IMAGES: Record<string, string> = {
  'what-is-a-global-esim-data-plan':
    'https://afocirmbqdxnkyescnev.supabase.co/storage/v1/object/public/featured-images/bed09705-6fd6-410a-b885-26654f3074a8/d268e6a0-8ffe-407b-af7a-6e481531856e-1779997517287.webp',
  'what-is-esim-complete-guide': U('1556656793-08538906a9f8'),
  'how-to-install-esim-iphone': U('1695048133142-1a20484d2569'),
  'how-to-install-esim-android': U('1511707171634-5f897ff02aa9'),
  'best-europe-esim-2026': U('1467269204594-9661b134dd2b'),
  'stay-connected-europe-without-roaming': U('1488646953014-85cb44e25828'),
  'esim-vs-roaming-cost-comparison': U('1579621970563-ebec7560ff3e'),
  'best-esim-germany-2026': U('1467269204594-9661b134dd2b'),
  'how-to-use-esim-france': U('1502602898657-3e91760cbb34'),
  'book-taxi-europe-whatsapp': U('1682018272449-0a4216a8be57'),
  'airport-transfer-europe-guide': U('1436491865332-7a61a109cc05'),
  'best-esim-turkey-2026': U('1502602898657-3e91760cbb34'),
};
