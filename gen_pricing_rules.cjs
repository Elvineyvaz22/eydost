/**
 * Tam qiymət yeniləmə skripti
 * CSV-dəki yeni qiymətləri oxuyur, köhnə sayt qiymətləri ilə müqayisə edir
 * və Supabase-ə yüklənə bilən pricing rules JSON faylı yaradır.
 */

const fs = require('fs');

const csvPath = 'C:\\Users\\User\\Downloads\\esim-prices-2026-05-04 (1).csv';
const csvContent = fs.readFileSync(csvPath, 'utf8').trim();

const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

// Sütun indeksləri
const priceIdx = headers.indexOf('Price');
const nameIdx = headers.indexOf('Plan Name');
const codeIdx = headers.indexOf('Code');
const gbIdx = headers.indexOf('GBs');
const daysIdx = headers.indexOf('Days');
const slugIdx = headers.indexOf('Slug');

// Köhnə sayt qiymətləri (API baza × 1.75)
function oldPrice(cost) { return cost * 1.75; }

// Köhnə tier qiymətləri (baza dəyərlər)
const basePrices = {
  gX: [0.46, 1.39, 1.42, 2.30, 4.20, 7.00],
  gY: [0.70, 1.70, 1.80, 2.70, 4.70, 8.20],
  gZ: [0.90, 2.20, 2.30, 3.40, 6.10, 10.60],
  gA: [1.10, 2.80, 3.00, 4.40, 7.60, 12.90],
  gB: [1.50, 3.70, 3.80, 5.70, 9.90, 16.80],
  gC: [1.80, 4.60, 4.70, 7.00, 12.20, 20.00],
  gD: [2.30, 5.70, 5.90, 8.80, 15.20, 25.00],
  gE: [2.90, 7.20, 7.30, 11.00, 19.00, 32.00],
  gF: [3.60, 8.90, 9.10, 13.60, 23.00, 40.00],
  gG: [4.60, 11.20, 11.40, 17.10, 29.00, 50.00],
  gH: [5.70, 14.10, 14.40, 21.00, 37.00, 63.00],
};

// countryCode → tier mapping (tam)
const countryToTier = {
  // EUROPE
  'TR': 'gX', 'FR': 'gY', 'DE': 'gY', 'GB': 'gY', 'ES': 'gY', 'IT': 'gY',
  'FI': 'gY', 'NO': 'gY', 'PL': 'gY', 'RO': 'gY', 'CH': 'gY', 'UA': 'gY',
  'JE': 'gY', 'AT': 'gZ', 'BE': 'gZ', 'BG': 'gZ', 'HR': 'gZ', 'CY': 'gZ',
  'CZ': 'gZ', 'DK': 'gZ', 'EE': 'gZ', 'GR': 'gZ', 'HU': 'gZ', 'IE': 'gZ',
  'LV': 'gZ', 'LT': 'gZ', 'LU': 'gZ', 'NL': 'gZ', 'PT': 'gZ', 'SK': 'gZ',
  'SI': 'gZ', 'SE': 'gZ', 'US': 'gZ', 'IM': 'gA', 'IS': 'gA', 'MT': 'gA',
  'GI': 'gE', 'MK': 'gE', 'AL': 'gD', 'AD': 'gD', 'BY': 'gD', 'BA': 'gD',
  'GG': 'gD', 'KZ': 'gD', 'KG': 'gD', 'LI': 'gD', 'MC': 'gD', 'ME': 'gD',
  'MD': 'gD', 'RU': 'gD', 'SM': 'gD', 'RS': 'gD', 'TJ': 'gE', 'UZ': 'gE',
  'XK': 'gD', 'FO': 'gD', 'AX': 'gZ', 'VA': 'gD', 'AM': 'gD',
  // ASIA
  'JP': 'gY', 'TH': 'gY', 'CN': 'gY', 'KR': 'gY', 'ID': 'gY', 'SG': 'gY',
  'MY': 'gY', 'AU': 'gY', 'HK': 'gY', 'MO': 'gY', 'TW': 'gZ', 'NZ': 'gZ',
  'PH': 'gC', 'KH': 'gD', 'IN': 'gD', 'BN': 'gG', 'VN': 'gC', 'BD': 'gE',
  'LA': 'gE', 'MM': 'gF', 'MN': 'gE', 'NP': 'gF', 'PK': 'gE', 'LK': 'gE',
  'MV': 'gF', 'FJ': 'gG', 'PG': 'gH', 'SB': 'gI', 'PW': 'gH', 'KI': 'gI',
  'NR': 'gI', 'WS': 'gH', 'TO': 'gH', 'TV': 'gI', 'VU': 'gH', 'NC': 'gF',
  'PF': 'gF', 'GU': 'gE', 'AS': 'gF', 'AF': 'gH',
  // MIDDLE EAST
  'EG': 'gC', 'IL': 'gA', 'GE': 'gB', 'AZ': 'gD', 'AE': 'gC', 'SA': 'gC',
  'QA': 'gC', 'KW': 'gC', 'BH': 'gC', 'OM': 'gD', 'JO': 'gD', 'LB': 'gE',
  'IQ': 'gE', 'PS': 'gE', 'YE': 'gH',
  // AMERICAS
  'CA': 'gB', 'MX': 'gE', 'BR': 'gD', 'AR': 'gD', 'CL': 'gD', 'CO': 'gD',
  'PE': 'gD', 'EC': 'gD', 'BO': 'gE', 'PY': 'gE', 'UY': 'gD', 'VE': 'gE',
  'GY': 'gF', 'SR': 'gF', 'GF': 'gE', 'PR': 'gE', 'GP': 'gE', 'MQ': 'gE',
  'JM': 'gJ', 'DO': 'gE', 'DM': 'gF', 'TT': 'gF', 'BB': 'gF', 'BS': 'gF',
  'BZ': 'gF', 'CR': 'gD', 'PA': 'gD', 'GT': 'gE', 'HN': 'gE', 'SV': 'gE',
  'NI': 'gE', 'HT': 'gG', 'CU': 'gG', 'AG': 'gF', 'AI': 'gG', 'BM': 'gF',
  'VG': 'gG', 'KY': 'gF', 'GD': 'gF', 'KN': 'gG', 'LC': 'gG', 'VC': 'gG',
  'MS': 'gH', 'TC': 'gG', 'CV': 'gG',
  // AFRICA
  'MA': 'gA', 'KE': 'gI', 'ZA': 'gE', 'NG': 'gF', 'DZ': 'gA', 'TN': 'gD',
  'RE': 'gE', 'SC': 'gF', 'ZM': 'gG', 'TD': 'gH', 'MZ': 'gH', 'CG': 'gH',
  'CF': 'gI', 'LR': 'gI', 'CI': 'gJ', 'GH': 'gF', 'SN': 'gG', 'CM': 'gG',
  'TZ': 'gG', 'UG': 'gG', 'ET': 'gH', 'RW': 'gG', 'MG': 'gH', 'MW': 'gH',
  'ML': 'gI', 'NE': 'gI', 'BF': 'gI', 'BI': 'gI', 'BJ': 'gH', 'BW': 'gG',
  'GA': 'gH', 'GM': 'gI', 'GN': 'gI', 'GW': 'gJ', 'MR': 'gI', 'MU': 'gF',
  'YT': 'gF', 'NA': 'gG', 'SL': 'gI', 'SO': 'gJ', 'SD': 'gI', 'SZ': 'gH',
  'TG': 'gI', 'ZW': 'gH', 'EH': 'gH', 'CD': 'gH', 'AO': 'gH', 'LY': 'gH',
  'BT': 'gH', 'CW': 'gH',
};

// CSV-dən paketləri oxu
const priceMap = {}; // code → planKey → {price, name, slug}
const regionalPackages = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  const get = (idx) => (values[idx] || '').trim();

  const price = parseFloat(get(priceIdx));
  const name = get(nameIdx);
  const code = get(codeIdx);
  const gbStr = get(gbIdx);
  const days = parseInt(get(daysIdx));
  const slug = get(slugIdx);

  if (!price || isNaN(price)) continue;

  // Regional/multi-area paketlər
  if (!code || code.length !== 2) {
    regionalPackages.push({ price, name, code, slug });
    continue;
  }

  const gbMatch = gbStr.match(/(\d+)\s*GB/);
  if (!gbMatch) continue;
  const gb = parseInt(gbMatch[1]);

  const planKey = `${gb}GB_${days}d`;
  const key = `${code.toUpperCase()}_${planKey}`;

  if (!priceMap[key] || price < priceMap[key].price) {
    priceMap[key] = { price, name, code: code.toUpperCase(), gb, days, slug };
  }
}

// Köhnə sayt qiymətini hesabla
function getOldPrice(code, gb, days) {
  const tier = countryToTier[code] || 'gY';
  const bases = basePrices[tier] || [1, 1, 1, 5, 10, 20];
  
  if (gb === 1 && days === 7) return oldPrice(bases[0]);
  if (gb === 3 && days === 15) return oldPrice(bases[1]);
  if (gb === 3 && days === 30) return oldPrice(bases[2]);
  if (gb === 5 && days === 30) return oldPrice(bases[3]);
  if (gb === 10 && days === 30) return oldPrice(bases[4]);
  if (gb === 20 && days === 30) return oldPrice(bases[5]);
  return null;
}

// Müqayisə nəticələri
const comparisons = [];

for (const [key, newPlan] of Object.entries(priceMap)) {
  const oldPriceVal = getOldPrice(newPlan.code, newPlan.gb, newPlan.days);
  if (oldPriceVal === null) continue;

  const change = ((newPlan.price - oldPriceVal) / oldPriceVal * 100);
  
  comparisons.push({
    code: newPlan.code,
    name: newPlan.name,
    gb: newPlan.gb,
    days: newPlan.days,
    oldPrice: +oldPriceVal.toFixed(2),
    newPrice: newPlan.price,
    change: +change.toFixed(1),
    direction: change > 1 ? 'up' : change < -1 ? 'down' : 'same',
  });
}

// Yalnız 5GB/30days üzrə
const main5gb = comparisons.filter(c => c.gb === 5 && c.days === 30);
main5gb.sort((a, b) => b.change - a.change);

const up5 = main5gb.filter(c => c.direction === 'up');
const down5 = main5gb.filter(c => c.direction === 'down');
const same5 = main5gb.filter(c => c.direction === 'same');

// İndi Supabase üçün pricing rules yaradırıq
// Hər ölkə üçün yeni API qiymətinə uyğun fixed_price ilə rule
// Amma yalnız fərqi 1%-dən çox olan ölkələr üçün
const changedRules = main5gb.filter(c => Math.abs(c.change) > 1);

console.log('=== QIYMƏT DƏYİŞƏN ÖLKƏLƏR (5GB/30days) ===\n');
console.log(`ARTIB: ${up5.length} | ENDİB: ${down5.length} | DƏYİŞMƏYİB: ${same5.length}`);
console.log(`CƏMİ: ${main5gb.length} ölkə\n`);

console.log('--- Qiymət ARTMIŞ (top 15) ---');
up5.slice(0, 15).forEach(c => {
  console.log(`${c.code} ${c.name}: $${c.oldPrice} → $${c.newPrice} (+${c.change}%)`);
});

console.log('\n--- Qiymət ENDİLMİŞ (top 15) ---');
down5.slice(0, 15).forEach(c => {
  console.log(`${c.code} ${c.name}: $${c.oldPrice} → $${c.newPrice} (${c.change}%)`);
});

// Supabase üçün JSON rules
const supabaseRules = changedRules.map(c => ({
  target_type: 'country',
  target_id: c.code,
  margin: 1.75,
  fixed_price: null, // null = default 1.75x margin, istəsən yeni qiyməti fixed_price edə bilərsən
  is_active: true,
  note: `${c.name}: old=$${c.oldPrice} new=$${c.newPrice} change=${c.change > 0 ? '+' : ''}${c.change}%`,
}));

// JSON faylı yaradırıq
const rulesOut = {
  updated_at: new Date().toISOString(),
  source: 'esim-prices-2026-05-04.csv',
  total_countries: main5gb.length,
  changed_countries: changedRules.length,
  summary: {
    increased: up5.length,
    decreased: down5.length,
    unchanged: same5.length,
  },
  pricing_rules: supabaseRules,
};

const outPath = 'C:/Users/User/Desktop/project/pricing_rules_update.json';
fs.writeFileSync(outPath, JSON.stringify(rulesOut, null, 2));
console.log(`\nPricing rules faylı yaradıldı: ${outPath}`);
console.log(`Dəyişən ölkə sayı: ${changedRules.length}`);
