/**
 * Yeni qiymət hesablama skripti
 * API qiymətlərini oxuyur, üzərinə 75% marja əlavə edir
 * və Supabase-ə yüklənə bilən pricing rules JSON yaradır.
 * 
 * Marja: api_price * 1.75 = satış qiyməti
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
const typeIdx = headers.indexOf('Type');
const planTypeIdx = headers.indexOf('Plan');

const MARGIN = 1.75; // 75% marja

console.log('=== YENİ QİYMƏT HESABLAMA (API × 1.75) ===\n');
console.log(`Marja: ${(MARGIN - 1) * 100}%`);
console.log(`Mənbə: ${csvPath}\n`);

// Bütün planları toplayırıq
const allPlans = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  const get = (idx) => (values[idx] || '').trim();

  const price = parseFloat(get(priceIdx));
  const name = get(nameIdx);
  const code = get(codeIdx);
  const gbStr = get(gbIdx);
  const days = parseInt(get(daysIdx));
  const slug = get(slugIdx);
  const type = get(typeIdx);
  const planType = get(planTypeIdx);

  if (!price || isNaN(price)) continue;

  // Satış qiyməti = API qiyməti × 1.75
  const sellPrice = parseFloat((price * MARGIN).toFixed(2));

  // 2 hərfli kod = ölkə, əks halda regional
  const isRegional = !code || code.length !== 2;

  // GB çıxar
  let gb = null;
  const gbMatch = gbStr.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
  if (gbMatch) {
    const num = parseFloat(gbMatch[1]);
    gb = gbMatch[2].toUpperCase().startsWith('M') ? num / 1000 : num;
  }

  allPlans.push({
    api_price: price,
    sell_price: sellPrice,
    margin_applied: (MARGIN - 1) * 100,
    name,
    code: code ? code.toUpperCase() : code,
    slug,
    gb: gbStr,
    gb_num: gb,
    days,
    type,
    plan_type: planType,
    is_regional: isRegional,
    key: slug || `${code}_${gbStr}_${days}`,
  });
}

console.log(`Cəmi plan sayı: ${allPlans.length}`);

// Ölkələr üzrə qruplaşdırma
const byCountry = {};
for (const p of allPlans) {
  if (p.is_regional) continue;
  if (!byCountry[p.code]) byCountry[p.code] = [];
  byCountry[p.code].push(p);
}

// Supabase rules formatı — hər plan üçün ayrı rule
const supabaseRules = [];

for (const plan of allPlans) {
  const rule = {
    target_type: plan.is_regional ? 'regional' : 'country',
    target_id: plan.code || plan.slug,
    slug: plan.slug,
    name: plan.name,
    api_price: plan.api_price,
    sell_price: plan.sell_price,
    margin: MARGIN,
    margin_pct: (MARGIN - 1) * 100,
    gb: plan.gb,
    days: plan.days,
    plan_type: plan.plan_type,
    is_active: true,
  };
  supabaseRules.push(rule);
}

// JSON çıxışı
const rulesOut = {
  updated_at: new Date().toISOString(),
  source: 'esim-prices-2026-05-04.csv',
  margin: MARGIN,
  margin_pct: (MARGIN - 1) * 100,
  total_plans: allPlans.length,
  total_countries: Object.keys(byCountry).length,
  pricing_rules: supabaseRules,
};

const outPath = 'C:/Users/User/Desktop/project/pricing_rules_update.json';
fs.writeFileSync(outPath, JSON.stringify(rulesOut, null, 2));
console.log(`\nPricing rules faylı yaradıldı: ${outPath}`);
console.log(`Ümumi plan sayı: ${supabaseRules.length}`);
console.log(`Ölkə sayı: ${Object.keys(byCountry).length}`);

// Nümunə qiymətlər göstər
console.log('\n=== NÜMUNƏ QİYMƏTLƏR ===\n');
const samples = allPlans.slice(0, 20);
samples.forEach(p => {
  console.log(`${p.code || 'REG'} | ${p.name}: $${p.api_price} → $${p.sell_price} (+${(MARGIN-1)*100}%)`);
});

console.log('\n=== MARJA YOXLAMASI ===');
const eur = allPlans.find(p => p.code === 'DE' && p.gb_num === 5 && p.days === 30);
if (eur) {
  console.log(`Almaniya 5GB/30d: API=$${eur.api_price} → Satış=$${eur.sell_price} (${(eur.sell_price/eur.api_price).toFixed(2)}x)`);
}
const az = allPlans.find(p => p.code === 'AZ');
if (az) {
  console.log(`Azərbaycan: API=$${az.api_price} → Satış=$${az.sell_price}`);
}