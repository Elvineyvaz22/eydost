/**
 * bot.eydost.az paketlerini oxuyur ve pricing_rules_update.json formatinda
 * yeni pricing rules yaradır Supabase-e upload üçün.
 */

const fs = require('fs');

const botData = JSON.parse(fs.readFileSync('bot_packages.json', 'utf-8'));

const pricingRules = [];
const margin = 1.75;

// Country name from code
const COUNTRY_NAMES = {
  TR: 'Turkey', AZ: 'Azerbaijan', RU: 'Russia', UA: 'Ukraine', GE: 'Georgia',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria', PL: 'Poland',
  PT: 'Portugal', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece',
  HR: 'Croatia', SK: 'Slovakia', SI: 'Slovenia', EE: 'Estonia', LT: 'Lithuania',
  LV: 'Latvia', IE: 'Ireland', LU: 'Luxembourg', MT: 'Malta', CY: 'Cyprus',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador',
  CN: 'China', JP: 'Japan', KR: 'South Korea', HK: 'Hong Kong', TW: 'Taiwan',
  SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand', ID: 'Indonesia', PH: 'Philippines',
  VN: 'Vietnam', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka',
  AU: 'Australia', NZ: 'New Zealand', AE: 'UAE', SA: 'Saudi Arabia', IL: 'Israel',
  JO: 'Jordan', KW: 'Kuwait', QA: 'Qatar', BH: 'Bahrain', OM: 'Oman',
  LB: 'Lebanon', EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya',
  GH: 'Ghana', TZ: 'Tanzania', ET: 'Ethiopia', MA: 'Morocco', TN: 'Tunisia',
  DZ: 'Algeria', UG: 'Uganda', MO: 'Macau', KH: 'Cambodia', KZ: 'Kazakhstan',
  UZ: 'Uzbekistan', AM: 'Armenia', IS: 'Iceland', AL: 'Albania', BA: 'Bosnia',
  MK: 'North Macedonia', RS: 'Serbia', MD: 'Moldova', MN: 'Mongolia',
  MM: 'Myanmar', NP: 'Nepal', LY: 'Libya', IQ: 'Iraq', IR: 'Iran',
  AF: 'Afghanistan', JM: 'Jamaica', TT: 'Trinidad & Tobago', PR: 'Puerto Rico',
  CR: 'Costa Rica', PA: 'Panama', GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador',
  NI: 'Nicaragua', DO: 'Dominican Republic', CU: 'Cuba', BO: 'Bolivia',
  PY: 'Paraguay', UY: 'Uruguay', GY: 'Guyana', SR: 'Suriname', BY: 'Belarus',
  MZ: 'Mozambique', ZW: 'Zimbabwe', ZM: 'Zambia', AO: 'Angola', CM: 'Cameroon',
  SN: 'Senegal', CI: 'Ivory Coast', ML: 'Mali', GL: 'Greenland',
  XK: 'Kosovo', ME: 'Montenegro',
};

function gbFromVolume(volume) {
  const v = parseInt(volume);
  if (v >= 1024 * 1024 * 1024) {
    return `${(v / (1024 * 1024 * 1024)).toFixed(0)}GB`;
  }
  return `${(v / (1024 * 1024)).toFixed(0)}MB`;
}

function planType(name) {
  if (name.includes('FUP') || name.includes('1Mbps')) return 'Unlimited FUP';
  return 'Full Speed';
}

for (const [countryCode, packages] of Object.entries(botData)) {
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  
  for (const pkg of packages) {
    const gb = gbFromVolume(pkg.volume);
    const days = pkg.duration;
    const sellPrice = parseFloat(pkg.sell_price);
    const apiPrice = (sellPrice / margin).toFixed(4);
    
    // slug format: XX_Gb_Days or XX_Gb_Daily or XX_Gb_DaysSuffix
    // e.g. TR_3_30 -> Turkey 3GB 30Days
    // e.g. TR_1_Daily -> Turkey 1GB/Day
    const slug = pkg.slug || '';
    
    // Determine target_type
    const isRegional = slug.includes('-');
    const targetType = isRegional ? 'regional' : 'country';
    const targetId = isRegional ? countryCode : countryCode;
    
    pricingRules.push({
      target_type: targetType,
      target_id: targetId,
      slug: slug,
      name: `${countryName} ${gb.replace('GB', 'GB ').replace('MB', 'MB ')}${days === 1 ? (slug.includes('Daily') ? gb + '/Day' : gb + ' ' + days + 'Day') : gb + ' ' + days + 'Days'}`.replace(/  /g, ' '),
      api_price: parseFloat(apiPrice),
      sell_price: sellPrice,
      margin: margin,
      margin_pct: 75,
      gb: gb,
      days: days,
      plan_type: planType(slug),
      is_active: true,
    });
  }
}

const output = {
  updated_at: new Date().toISOString(),
  source: 'bot.eydost.az',
  margin: margin,
  margin_pct: 75,
  total_plans: pricingRules.length,
  total_countries: Object.keys(botData).length,
  pricing_rules: pricingRules,
};

fs.writeFileSync('pricing_rules_update.json', JSON.stringify(output, null, 2), 'utf-8');
console.log(`Generated ${pricingRules.length} pricing rules for ${Object.keys(botData).length} countries`);
console.log('Saved to pricing_rules_update.json');

// Show sample
console.log('\nSample rules:');
console.log(JSON.stringify(pricingRules.slice(0, 5), null, 2));