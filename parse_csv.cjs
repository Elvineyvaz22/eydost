const fs = require('fs');

const csvPath = 'C:\\Users\\User\\Downloads\\esim-prices-2026-05-04 (1).csv';
const csvContent = fs.readFileSync(csvPath, 'utf8').trim();

const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

// Column indices
const priceIdx = headers.indexOf('Price');
const nameIdx = headers.indexOf('Plan Name');
const codeIdx = headers.indexOf('Code');
const gbIdx = headers.indexOf('GBs');
const daysIdx = headers.indexOf('Days');
const typeIdx = headers.indexOf('Type');
const locationIdx = headers.indexOf('Location');
const slugIdx = headers.indexOf('Slug');

// Single-area packages by code + plan size → lowest price finder
const priceMap = {}; // code → planKey → price

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

  // Only single-country packages (2-letter code)
  if (!code || code.length !== 2) continue;

  const gbMatch = gbStr.match(/(\d+)\s*GB/);
  if (!gbMatch) continue;
  const gb = parseInt(gbMatch[1]);

  const planKey = `${gb}GB_${days}d`;
  const key = `${code.toUpperCase()}_${planKey}`;

  // Keep lowest price
  if (!priceMap[key] || price < priceMap[key].price) {
    priceMap[key] = { price, name, code: code.toUpperCase(), gb, days, slug };
  }
}

// Build pricing rules
// Format: each rule is for a country with a specific plan size → fixed_price
// We'll generate fixed_price rules for each country/plan combination

const rules = [];

// Group by country code
const byCountry = {};
for (const [key, val] of Object.entries(priceMap)) {
  const code = val.code;
  if (!byCountry[code]) byCountry[code] = {};
  byCountry[code][val.gb + 'GB_' + val.days + 'd'] = val;
}

// Generate fixed_price rules for 5GB/30days as main anchor
for (const [code, plans] of Object.entries(byCountry)) {
  const key5 = '5GB_30d';
  if (plans[key5]) {
    rules.push({
      target_type: 'country',
      target_id: code,
      margin: 1.75,
      fixed_price: null,
      is_active: true,
      _note: `${plans[key5].name} — $${plans[key5].price}`
    });
  }
}

console.log('Sample rules (first 20):');
rules.slice(0, 20).forEach(r => {
  console.log(`  ${r.target_id}: margin=1.75 ($${r._note.split(' — ')[1]})`);
});

console.log(`\nTotal country rules generated: ${rules.length}`);

// Now let's also output the actual new prices for comparison
console.log('\n=== New prices (5GB/30days) from CSV ===');
const newPrices = [];
for (const [key, val] of Object.entries(priceMap)) {
  if (key.endsWith('5GB_30d')) {
    newPrices.push(val);
  }
}
newPrices.sort((a, b) => a.code.localeCompare(b.code));
newPrices.forEach(p => {
  console.log(`${p.code} ${p.name}: $${p.price}`);
});
