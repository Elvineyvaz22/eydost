/**
 * Qiymət müqayisə skripti
 * Köhnə saytdakı qiymətləri yeni Excel qiymətləri ilə müqayisə edir
 * Nəticə: HTML hesabat
 */

const fs = require('fs');
const path = require('path');

// Köhnə sayt qiymətləri (m(cost) = cost * 1.75)
function oldPrice(cost) {
  return cost * 1.75;
}

// Əsas qiymətlər (tier-ə görə)
const basePrices = {
  gX:  [0.46, 1.39, 1.42, 2.30, 4.20, 7.00],
  gY:  [0.70, 1.70, 1.80, 2.70, 4.70, 8.20],
  gZ:  [0.90, 2.20, 2.30, 3.40, 6.10, 10.60],
  gA:  [1.10, 2.80, 3.00, 4.40, 7.60, 12.90],
  gB:  [1.50, 3.70, 3.80, 5.70, 9.90, 16.80],
  gC:  [1.80, 4.60, 4.70, 7.00, 12.20, 20.00],
  gD:  [2.30, 5.70, 5.90, 8.80, 15.20, 25.00],
  gE:  [2.90, 7.20, 7.30, 11.00, 19.00, 32.00],
  gF:  [3.60, 8.90, 9.10, 13.60, 23.00, 40.00],
  gG:  [4.60, 11.20, 11.40, 17.10, 29.00, 50.00],
  gH:  [5.70, 14.10, 14.40, 21.00, 37.00, 63.00],
  gI:  [7.10, 17.60, 17.90, 26.00, 46.00, 79.00],
  gJ:  [8.90, 21.00, 22.00, 33.00, 57.00, 98.00],
};

// Site-dəki ölkə təyinatları (tier-group → ölkələr)
const countryTierMap = {
  // Avropa
  gX: ['TR'],
  gY: ['FR','DE','GB','ES','IT','FI','NO','PL','RO','CH','UA','JE','AT','BE','BG','HR','CY','CZ','DK','EE','GR','HU','IE','LV','LT','LU','NL','PT','SK','SI','SE','IM','IS','MT'],
  gZ: ['AL','AD','BY','BA','GG','KZ','KG','LI','MC','ME','MD','RU','SM','RS','TJ','UZ','XK','FO','AX','VA','AM','US'], // US də var amma tier Z-də
  gE: ['GI','MK'],
  gD: ['AL','AD','BY','BA','GG','KZ','KG','LI','MC','ME','MD','RU','SM','RS','TJ','UZ','XK','FO','VA','AM'],
  gA: ['IM','IS','MT'],
  // Asiya
  // (yuxarıda artıq)
  // Orta Şərq
  gC: ['EG','AE','SA','QA','KW','BH','OM','JO','PS'],
  gA: ['IL'],
  gB: ['GE'],
  gD: ['AZ'],
  gE: ['LB','IQ'],
  gH: ['YE'],
  // Amerikalar
  // (yuxarıda artıq)
  // Afrika
  gA: ['MA','DZ'],
  gE: ['ZA'],
  gD: ['TN','RE'],
  gF: ['SC','MU','TZ'],
  gG: ['ZM'],
  gH: ['TD','MZ','TD','MW','ML','NE','BF','BI','BJ','BW','GA','GM','GN','GW','MR'],
  gI: ['LR','CF','CI'],
  gJ: ['SO'],
  gF: ['SN','CM'],
  gG: ['TZ','UG','RW'],
  gH: ['SD'],
  gH: ['SZ','TG'],
  gH: ['ZW'],
  gH: ['EH'],
};

// Daha düzgün ölkə tier xəritəsi
// Hər ölkə → tier array (əsas qiymət array-indeksləri: [1GB/7gün, 3GB/15gün, 3GB/30gün, 5GB/30gün, 10GB/30gün, 20GB/30gün])
// days=1 → daily unlimited paket

const countryToTier = {
  // EUROPE
  'TR': 'gX', 'Turkey': 'gX',
  'FR': 'gY', 'France': 'gY',
  'DE': 'gY', 'Germany': 'gY',
  'GB': 'gY', 'United Kingdom': 'gY',
  'ES': 'gY', 'Spain': 'gY',
  'IT': 'gY', 'Italy': 'gY',
  'FI': 'gY', 'Finland': 'gY',
  'NO': 'gY', 'Norway': 'gY',
  'PL': 'gY', 'Poland': 'gY',
  'RO': 'gY', 'Romania': 'gY',
  'CH': 'gY', 'Switzerland': 'gY',
  'UA': 'gY', 'Ukraine': 'gY',
  'JE': 'gY', 'Jersey': 'gY',
  'AT': 'gZ', 'Austria': 'gZ',
  'BE': 'gZ', 'Belgium': 'gZ',
  'BG': 'gZ', 'Bulgaria': 'gZ',
  'HR': 'gZ', 'Croatia': 'gZ',
  'CY': 'gZ', 'Cyprus': 'gZ',
  'CZ': 'gZ', 'Czech Republic': 'gZ',
  'DK': 'gZ', 'Denmark': 'gZ',
  'EE': 'gZ', 'Estonia': 'gZ',
  'GR': 'gZ', 'Greece': 'gZ',
  'HU': 'gZ', 'Hungary': 'gZ',
  'IE': 'gZ', 'Ireland': 'gZ',
  'LV': 'gZ', 'Latvia': 'gZ',
  'LT': 'gZ', 'Lithuania': 'gZ',
  'LU': 'gZ', 'Luxembourg': 'gZ',
  'NL': 'gZ', 'Netherlands': 'gZ',
  'PT': 'gZ', 'Portugal': 'gZ',
  'SK': 'gZ', 'Slovakia': 'gZ',
  'SI': 'gZ', 'Slovenia': 'gZ',
  'SE': 'gZ', 'Sweden': 'gZ',
  'US': 'gZ', 'United States': 'gZ',
  'IM': 'gA', 'Isle of Man': 'gA',
  'IS': 'gA', 'Iceland': 'gA',
  'MT': 'gA', 'Malta': 'gA',
  'GI': 'gE', 'Gibraltar': 'gE',
  'MK': 'gE', 'North Macedonia': 'gE',
  'AL': 'gD', 'Albania': 'gD',
  'AD': 'gD', 'Andorra': 'gD',
  'BY': 'gD', 'Belarus': 'gD',
  'BA': 'gD', 'Bosnia and Herzegovina': 'gD',
  'GG': 'gD', 'Guernsey': 'gD',
  'KZ': 'gD', 'Kazakhstan': 'gD',
  'KG': 'gD', 'Kyrgyzstan': 'gD',
  'LI': 'gD', 'Liechtenstein': 'gD',
  'MC': 'gD', 'Monaco': 'gD',
  'ME': 'gD', 'Montenegro': 'gD',
  'MD': 'gD', 'Moldova': 'gD',
  'RU': 'gD', 'Russia': 'gD',
  'SM': 'gD', 'San Marino': 'gD',
  'RS': 'gD', 'Serbia': 'gD',
  'TJ': 'gE', 'Tajikistan': 'gE',
  'UZ': 'gE', 'Uzbekistan': 'gE',
  'XK': 'gD', 'Kosovo': 'gD',
  'FO': 'gD', 'Faroe Islands': 'gD',
  'AX': 'gZ', 'Aland Islands': 'gZ',
  'VA': 'gD', 'Vatican': 'gD',
  'AM': 'gD', 'Armenia': 'gD',
  // ASIA
  'JP': 'gY', 'Japan': 'gY',
  'TH': 'gY', 'Thailand': 'gY',
  'CN': 'gY', 'China': 'gY',
  'KR': 'gY', 'South Korea': 'gY',
  'ID': 'gY', 'Indonesia': 'gY',
  'SG': 'gY', 'Singapore': 'gY',
  'MY': 'gY', 'Malaysia': 'gY',
  'AU': 'gY', 'Australia': 'gY',
  'HK': 'gY', 'Hong Kong': 'gY',
  'MO': 'gY', 'Macao': 'gY',
  'TW': 'gZ', 'Taiwan': 'gZ',
  'NZ': 'gZ', 'New Zealand': 'gZ',
  'PH': 'gC', 'Philippines': 'gC',
  'KH': 'gD', 'Cambodia': 'gD',
  'IN': 'gD', 'India': 'gD',
  'BN': 'gG', 'Brunei': 'gG',
  'VN': 'gC', 'Vietnam': 'gC',
  'BD': 'gE', 'Bangladesh': 'gE',
  'LA': 'gE', 'Laos': 'gE',
  'MM': 'gF', 'Myanmar': 'gF',
  'MN': 'gE', 'Mongolia': 'gE',
  'NP': 'gF', 'Nepal': 'gF',
  'PK': 'gE', 'Pakistan': 'gE',
  'LK': 'gE', 'Sri Lanka': 'gE',
  'MV': 'gF', 'Maldives': 'gF',
  'FJ': 'gG', 'Fiji': 'gG',
  'PG': 'gH', 'Papua New Guinea': 'gH',
  'SB': 'gI', 'Solomon Islands': 'gI',
  'PW': 'gH', 'Palau': 'gH',
  'KI': 'gI', 'Kiribati': 'gI',
  'NR': 'gI', 'Nauru': 'gI',
  'WS': 'gH', 'Samoa': 'gH',
  'TO': 'gH', 'Tonga': 'gH',
  'TV': 'gI', 'Tuvalu': 'gI',
  'VU': 'gH', 'Vanuatu': 'gH',
  'NC': 'gF', 'New Caledonia': 'gF',
  'PF': 'gF', 'French Polynesia': 'gF',
  'GU': 'gE', 'Guam': 'gE',
  'AS': 'gF', 'American Samoa': 'gF',
  'AF': 'gH', 'Afghanistan': 'gH',
  // MIDDLE EAST
  'EG': 'gC', 'Egypt': 'gC',
  'IL': 'gA', 'Israel': 'gA',
  'GE': 'gB', 'Georgia': 'gB',
  'AZ': 'gD', 'Azerbaijan': 'gD',
  'AE': 'gC', 'United Arab Emirates': 'gC',
  'SA': 'gC', 'Saudi Arabia': 'gC',
  'QA': 'gC', 'Qatar': 'gC',
  'KW': 'gC', 'Kuwait': 'gC',
  'BH': 'gC', 'Bahrain': 'gC',
  'OM': 'gD', 'Oman': 'gD',
  'JO': 'gD', 'Jordan': 'gD',
  'LB': 'gE', 'Lebanon': 'gE',
  'IQ': 'gE', 'Iraq': 'gE',
  'PS': 'gE', 'Palestine': 'gE',
  'YE': 'gH', 'Yemen': 'gH',
  // AMERICAS
  'CA': 'gB', 'Canada': 'gB',
  'MX': 'gE', 'Mexico': 'gE',
  'BR': 'gD', 'Brazil': 'gD',
  'AR': 'gD', 'Argentina': 'gD',
  'CL': 'gD', 'Chile': 'gD',
  'CO': 'gD', 'Colombia': 'gD',
  'PE': 'gD', 'Peru': 'gD',
  'EC': 'gD', 'Ecuador': 'gD',
  'BO': 'gE', 'Bolivia': 'gE',
  'PY': 'gE', 'Paraguay': 'gE',
  'UY': 'gD', 'Uruguay': 'gD',
  'VE': 'gE', 'Venezuela': 'gE',
  'GY': 'gF', 'Guyana': 'gF',
  'SR': 'gF', 'Suriname': 'gF',
  'GF': 'gE', 'French Guiana': 'gE',
  'PR': 'gE', 'Puerto Rico': 'gE',
  'GP': 'gE', 'Guadeloupe': 'gE',
  'MQ': 'gE', 'Martinique': 'gE',
  'JM': 'gJ', 'Jamaica': 'gJ',
  'DO': 'gE', 'Dominican Republic': 'gE',
  'DM': 'gF', 'Dominica': 'gF',
  'TT': 'gF', 'Trinidad and Tobago': 'gF',
  'BB': 'gF', 'Barbados': 'gF',
  'BS': 'gF', 'Bahamas': 'gF',
  'BZ': 'gF', 'Belize': 'gF',
  'CR': 'gD', 'Costa Rica': 'gD',
  'PA': 'gD', 'Panama': 'gD',
  'GT': 'gE', 'Guatemala': 'gE',
  'HN': 'gE', 'Honduras': 'gE',
  'SV': 'gE', 'El Salvador': 'gE',
  'NI': 'gE', 'Nicaragua': 'gE',
  'HT': 'gG', 'Haiti': 'gG',
  'CU': 'gG', 'Cuba': 'gG',
  'AG': 'gF', 'Antigua and Barbuda': 'gF',
  'AI': 'gG', 'Anguilla': 'gG',
  'BM': 'gF', 'Bermuda': 'gF',
  'VG': 'gG', 'Virgin Islands- British': 'gG',
  'KY': 'gF', 'Cayman Islands': 'gF',
  'GD': 'gF', 'Grenada': 'gF',
  'KN': 'gG', 'Saint Kitts and Nevis': 'gG',
  'LC': 'gG', 'Saint Lucia': 'gG',
  'VC': 'gG', 'Saint Vincent and the Grenadines': 'gG',
  'MS': 'gH', 'Montserrat': 'gH',
  'TC': 'gG', 'Turks and Caicos Islands': 'gG',
  'CV': 'gG', 'Cape Verde': 'gG',
  // AFRICA
  'MA': 'gA', 'Morocco': 'gA',
  'KE': 'gI', 'Kenya': 'gI',
  'ZA': 'gE', 'South Africa': 'gE',
  'NG': 'gF', 'Nigeria': 'gF',
  'DZ': 'gA', 'Algeria': 'gA',
  'TN': 'gD', 'Tunisia': 'gD',
  'RE': 'gE', 'Reunion': 'gE',
  'SC': 'gF', 'Seychelles': 'gF',
  'ZM': 'gG', 'Zambia': 'gG',
  'TD': 'gH', 'Chad': 'gH',
  'MZ': 'gH', 'Mozambique': 'gH',
  'CG': 'gH', 'Republic of the Congo': 'gH',
  'CF': 'gI', 'Central African Republic': 'gI',
  'LR': 'gI', 'Liberia': 'gI',
  'CI': 'gJ', "Cote d'Ivoire": 'gJ',
  'GH': 'gF', 'Ghana': 'gF',
  'SN': 'gG', 'Senegal': 'gG',
  'CM': 'gG', 'Cameroon': 'gG',
  'TZ': 'gG', 'Tanzania': 'gG',
  'UG': 'gG', 'Uganda': 'gG',
  'ET': 'gH', 'Ethiopia': 'gH',
  'RW': 'gG', 'Rwanda': 'gG',
  'MG': 'gH', 'Madagascar': 'gH',
  'MW': 'gH', 'Malawi': 'gH',
  'ML': 'gI', 'Mali': 'gI',
  'NE': 'gI', 'Niger': 'gI',
  'BF': 'gI', 'Burkina Faso': 'gI',
  'BI': 'gI', 'Burundi': 'gI',
  'BJ': 'gH', 'Benin': 'gH',
  'BW': 'gG', 'Botswana': 'gG',
  'GA': 'gH', 'Gabon': 'gH',
  'GM': 'gI', 'Gambia': 'gI',
  'GN': 'gI', 'Guinea': 'gI',
  'GW': 'gJ', 'Guinea-Bissau': 'gJ',
  'MR': 'gI', 'Mauritania': 'gI',
  'MU': 'gF', 'Mauritius': 'gF',
  'YT': 'gF', 'Mayotte': 'gF',
  'NA': 'gG', 'Namibia': 'gG',
  'SL': 'gI', 'Sierra Leone': 'gI',
  'SO': 'gJ', 'Somalia': 'gJ',
  'SD': 'gI', 'Sudan': 'gI',
  'SZ': 'gH', 'Eswatini': 'gH',
  'TG': 'gI', 'Togo': 'gI',
  'ZW': 'gH', 'Zimbabwe': 'gH',
  'EH': 'gH', 'Western Sahara': 'gH',
  // CD (DRC)
  'CD': 'gH', 'Democratic Republic of the Congo': 'gH',
  'AO': 'gH', 'Angola': 'gH',
  'LY': 'gH', 'Libya': 'gH',
  'BT': 'gH', 'Bhutan': 'gH',
  // CW - Curaçao
  'CW': 'gH', 'Curaçao': 'gH',
};

// Plan tipi → əsas qiymət indeksi
// Plan: 1GB/7days = idx 0, 3GB/15days = idx 1, 3GB/30days = idx 2, 5GB/30days = idx 3, 10GB/30days = idx 4, 20GB/30days = idx 5
// Days=1 (Daily): bəzi ölkələrdə xüsusi qiymət yoxdur, ancaq 5GB/30days yaxud digər plan ilə müqayisə olunmalıdır

function getOldPriceForPlan(countryCode, dataType, gb, days) {
  const tier = countryToTier[countryCode] || 'gY';
  const bases = basePrices[tier];
  if (!bases) return null;
  
  // GB/30Days variantları
  if (days === 30 && gb === 1) return oldPrice(bases[0]);  // 1GB 30 Days (və ya 7 days ilə eyni)
  if (days === 30 && gb === 3) return oldPrice(bases[2]); // 3GB 30 Days
  if (days === 30 && gb === 5) return oldPrice(bases[3]); // 5GB 30 Days
  if (days === 30 && gb === 10) return oldPrice(bases[4]); // 10GB 30 Days
  if (days === 30 && gb === 20) return oldPrice(bases[5]); // 20GB 30 Days
  
  // 7 Days paketlər
  if (days === 7 && gb === 1) return oldPrice(bases[0]);
  if (days === 7 && gb === 3) return oldPrice(bases[1]); // 3GB 15 days yox, 7 days yox, amma ən yaxın
  if (days === 7 && gb === 5) return oldPrice(bases[3]);
  
  // 15 Days paketlər
  if (days === 15 && gb === 3) return oldPrice(bases[1]);
  
  // Default: ən yaxın plan
  return null;
}

// GB/30Days → köhnə qiymət (əsas plan 5GB/30Days ilə)
function getOldPrice30Day(countryCode, gb) {
  const tier = countryToTier[countryCode] || 'gY';
  const bases = basePrices[tier] || [1,3,3,5,10,20];
  
  if (gb <= 1) return oldPrice(bases[0]);
  if (gb <= 3) return oldPrice(bases[2]); // 3GB 30 days
  if (gb <= 5) return oldPrice(bases[3]); // 5GB 30 days
  if (gb <= 10) return oldPrice(bases[4]); // 10GB 30 days
  return oldPrice(bases[5]); // 20GB 30 days
}

// Regional paketlərin köhnə qiymətləri
const regionalOldPrices = {
  'Europe': [oldPrice(1.40), oldPrice(3.50), oldPrice(5.50), oldPrice(9.00), oldPrice(16.00)],
  'Asia': [oldPrice(1.50), oldPrice(4.00), oldPrice(6.00), oldPrice(10.00), oldPrice(18.00)],
  'Middle East & Africa': [oldPrice(2.50), oldPrice(6.00), oldPrice(9.00), oldPrice(16.00), oldPrice(28.00)],
  'Americas': [oldPrice(2.00), oldPrice(5.00), oldPrice(8.00), oldPrice(14.00), oldPrice(24.00)],
  'Global': [oldPrice(3.00), oldPrice(7.50), oldPrice(11.00), oldPrice(19.00), oldPrice(34.00)],
};

// İndi CSV-ni oxu
const csvPath = 'C:/Users/User/Downloads/esim-prices-2026-05-04 (1).csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

console.log(`CSV headers (count ${headers.length}): ${headers.join(' | ')}`);

// Sütun indeksləri (CSV-yə görə)
// 0: , 1: Type, 2: Plan, 3: Location, 4: Plan Name, 5: Price, 6: History, 7: GBs, 8: Days, 9: $/GB, 10: Size, 11: SMS, 12: Top, 13: Act, 14: IP, 15: Code, 16: Slug, 17: PlanId
const dataIdx = headers.indexOf('Price');       // 5
const nameIdx = headers.indexOf('Plan Name');  // 4
const codeIdx = headers.indexOf('Code');        // 15
const gbIdx = headers.indexOf('GBs');           // 7
const daysIdx = headers.indexOf('Days');        // 8
const typeIdx = headers.indexOf('Type');        // 1
const regionIdx = headers.indexOf('Location');  // 3
const slugIdx = headers.indexOf('Slug');        // 16

console.log(`CSV headers: ${headers.join(', ')}`);

// Parse CSV manually (handle commas inside quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

const rows = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const fields = parseCSVLine(lines[i]);
  rows.push(fields);
}

console.log(`Cəmi ${rows.length} sətir oxundu`);

// Ölkə/qrup üzrə yığcam məlumat
const countryData = {};
const regionalData = {};
const multiData = [];

let matched = 0;
let total = 0;

for (const row of rows) {
  const price = parseFloat(row[dataIdx] || row[4]);
  const name = row[nameIdx] || row[2];
  const code = row[codeIdx] || row[6];
  const gb = parseFloat(row[gbIdx] || row[7]);
  const days = parseInt(row[daysIdx] || row[8]);
  const dataType = row[typeIdx] || row[3];
  const region = row[regionIdx] || row[1];
  const slug = row[slugIdx] || row[10];
  const coverage = row[11] || '';
  
  if (!price || isNaN(price)) continue;
  
  total++;
  
  // Multi-area paketlər
  if (region === 'Multi-Area' || (code && code.includes('-'))) {
    multiData.push({ name, price, code, region, slug, gb, days, dataType, coverage });
    continue;
  }
  
  // Regional paketlər
  if (region && (region.includes('Regional') || 
    (name && (
      name.includes('Europe') || name.includes('Asia') || 
      name.includes('Global') || name.includes('Middle East') ||
      name.includes('Americas') || name.includes('Africa') ||
      name.includes('GCC') || name.includes('Caribbean') ||
      name.includes('Balkans') || name.includes('Nordic') ||
      name.includes('Arabian') || name.includes('Scandinavian')
    )))) {
    multiData.push({ name, price, code, region, slug, gb, days, dataType, coverage });
    continue;
  }
  
  // Ölkə kodu ilə
  if (code && code.length === 2) {
    const upperCode = code.toUpperCase();
    if (!countryData[upperCode]) countryData[upperCode] = [];
    countryData[upperCode].push({ name, price, gb, days, dataType, code: upperCode });
    matched++;
  }
}

// İndi saytdakı köhnə qiymətləri hesabla
// Hər ölkə üçün əsas plan (5GB/30days) ilə müqayisə
const comparisons = [];

for (const [code, plans] of Object.entries(countryData)) {
  const tier = countryToTier[code] || 'gY';
  const bases = basePrices[tier] || [1,1,1,5,10,20];
  
  // Əsas 5 plan: 1GB/7d, 3GB/15d, 3GB/30d, 5GB/30d, 10GB/30d, 20GB/30d
  // Amma saytdakı planlarla uyğunlaşdıraq: 1GB/7d, 3GB/15d, 3GB/30d, 5GB/30d, 10GB/30d, 20GB/30d
  
  // Saytdakı standart planlar (5GB/30days intervalinə ən yaxın)
  // EsimPackages-də plan: [gb, days, price] — 1,7 / 3,15 / 3,30 / 5,30 / 10,30 / 20,30
  const sitePlans = [
    { gb: 1, days: 7, price: oldPrice(bases[0]) },
    { gb: 3, days: 15, price: oldPrice(bases[1]) },
    { gb: 3, days: 30, price: oldPrice(bases[2]) },
    { gb: 5, days: 30, price: oldPrice(bases[3]) },
    { gb: 10, days: 30, price: oldPrice(bases[4]) },
    { gb: 20, days: 30, price: oldPrice(bases[5]) },
  ];
  
  // Yeni CSV-də uyğun plan tap
  for (const sitePlan of sitePlans) {
    // Ən yaxın planı tap
    const matchingPlan = plans.find(p => {
      const pgb = parseFloat(p.gb) || 0;
      const pdays = parseInt(p.days) || 0;
      // Eyni GB və ya yaxın gün
      if (pgb === sitePlan.gb && pdays === sitePlan.days) return true;
      if (sitePlan.gb === 1 && sitePlan.days === 7 && pgb === 1 && pdays === 7) return true;
      if (sitePlan.gb === 3 && sitePlan.days === 30 && pgb === 3 && pdays === 30) return true;
      if (sitePlan.gb === 3 && sitePlan.days === 15 && pgb === 3 && pdays === 15) return true;
      if (sitePlan.gb === 5 && sitePlan.days === 30 && pgb === 5 && pdays === 30) return true;
      if (sitePlan.gb === 10 && sitePlan.days === 30 && pgb === 10 && pdays === 30) return true;
      if (sitePlan.gb === 20 && sitePlan.days === 30 && pgb === 20 && pdays === 30) return true;
      return false;
    });
    
    if (matchingPlan) {
      const newPrice = matchingPlan.price;
      const oldP = sitePlan.price;
      const change = ((newPrice - oldP) / oldP * 100).toFixed(1);
      comparisons.push({
        code,
        name: matchingPlan.name,
        gb: sitePlan.gb,
        days: sitePlan.days,
        oldPrice: oldP.toFixed(2),
        newPrice: newPrice.toFixed(2),
        change: parseFloat(change),
        direction: newPrice > oldP ? 'up' : newPrice < oldP ? 'down' : 'same',
        tier,
      });
    }
  }
}

// Yalnız 5GB/30days plan üzrə ümumi müqayisə (əsas plan)
const mainComparisons = comparisons.filter(c => c.gb === 5 && c.days === 30);
mainComparisons.sort((a, b) => b.change - a.change);

const up = mainComparisons.filter(c => c.direction === 'up');
const down = mainComparisons.filter(c => c.direction === 'down');
const same = mainComparisons.filter(c => c.direction === 'same');

const report = `
<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<title>Qiymət Müqayisə Hesabatı</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, sans-serif; background: #f8fafc; color: #1e293b; }
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  h1 { font-size: 1.75rem; margin-bottom: .5rem; }
  .subtitle { color: #64748b; margin-bottom: 2rem; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .card.up .val { color: #dc2626; }
  .card.down .val { color: #16a34a; }
  .card .label { font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
  .card .val { font-size: 2rem; font-weight: 900; }
  .card .sub { font-size: .75rem; color: #64748b; }
  .tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .tab { padding: .5rem 1rem; border-radius: .5rem; font-size: .875rem; font-weight: 600; cursor: pointer; background: white; border: 1px solid #e2e8f0; color: #64748b; }
  .tab.active { background: #0f172a; color: white; border-color: #0f172a; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  th { background: #f8fafc; padding: .75rem 1rem; text-align: left; font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9; }
  td { padding: .75rem 1rem; border-bottom: 1px solid #f8fafc; font-size: .875rem; }
  tr:hover td { background: #f8fafc; }
  .up { color: #dc2626; font-weight: 700; }
  .down { color: #16a34a; font-weight: 700; }
  .same { color: #64748b; }
  .badge { display: inline-block; padding: .125rem .5rem; border-radius: 999px; font-size: .75rem; font-weight: 700; }
  .badge.up { background: #fef2f2; color: #dc2626; }
  .badge.down { background: #f0fdf4; color: #16a34a; }
  .badge.same { background: #f8fafc; color: #64748b; }
  .section-title { font-size: 1.25rem; font-weight: 800; margin: 2rem 0 1rem; }
  .info { background: #fefce8; border: 1px solid #fde68a; border-radius: .75rem; padding: 1rem; margin-bottom: 2rem; font-size: .875rem; color: #92400e; }
</style>
</head>
<body>
<div class="container">
  <h1>Qiymət Müqayisə Hesabatı</h1>
  <p class="subtitle">Köhnə sayt qiymətləri (API × 1.75) vs Yeni Excel qiymətləri &mdash; 5GB / 30 Gün planı üzrə</p>

  <div class="info">
    <strong> Qeyd:</strong> Saytdakı köhnə qiymətlər API baza qiyməti × 1.75 marja ilə hesablanıb.
    Yeni qiymətlər Excel-dəki <em>Price(USD) sütunundan</em> götürülüb. Yalnız 5GB/30 Gün planları müqayisə olunub.
  </div>

  <div class="summary">
    <div class="card up">
      <div class="label">Qiymət ARTIB</div>
      <div class="val">${up.length}</div>
      <div class="sub">ölkə</div>
    </div>
    <div class="card down">
      <div class="label">Qiymət ENDİRİLİB</div>
      <div class="val">${down.length}</div>
      <div class="sub">ölkə</div>
    </div>
    <div class="card same">
      <div class="label">DƏYİŞMƏYİB</div>
      <div class="val">${same.length}</div>
      <div class="sub">ölkə</div>
    </div>
    <div class="card">
      <div class="label">CƏMİ MÜQAYİSƏ</div>
      <div class="val">${mainComparisons.length}</div>
      <div class="sub">ölkə/plaform</div>
    </div>
  </div>

  <h2 class="section-title">Qiymət ARTMIŞ ölkələr (ən çox artım)</h2>
  <table>
    <thead>
      <tr>
        <th>Ölkə</th><th>Tier</th><th>Köhnə ($)</th><th>Yeni ($)</th><th>Dəyişim %</th>
      </tr>
    </thead>
    <tbody>
      ${up.slice(0, 30).map(c => `
      <tr>
        <td>${c.name || c.code}</td>
        <td>${c.tier}</td>
        <td>$${c.oldPrice}</td>
        <td>$${c.newPrice}</td>
        <td class="up">+${c.change}%</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2 class="section-title">Qiymət ENDİLMİŞ ölkələr (ən çox endirim)</h2>
  <table>
    <thead>
      <tr>
        <th>Ölkə</th><th>Tier</th><th>Köhnə ($)</th><th>Yeni ($)</th><th>Dəyişim %</th>
      </tr>
    </thead>
    <tbody>
      ${down.slice(0, 30).map(c => `
      <tr>
        <td>${c.name || c.code}</td>
        <td>${c.tier}</td>
        <td>$${c.oldPrice}</td>
        <td>$${c.newPrice}</td>
        <td class="down">${c.change}%</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2 class="section-title">Dəyişməyən qiymətlər</h2>
  <table>
    <thead>
      <tr>
        <th>Ölkə</th><th>Tier</th><th>Qiymət ($)</th>
      </tr>
    </thead>
    <tbody>
      ${same.map(c => `
      <tr>
        <td>${c.name || c.code}</td>
        <td>${c.tier}</td>
        <td>$${c.oldPrice}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2 class="section-title">Bütün müqayisələr</h2>
  <table>
    <thead>
      <tr>
        <th>Ölkə</th><th>GB/Gün</th><th>Köhnə ($)</th><th>Yeni ($)</th><th>Dəyişim</th>
      </tr>
    </thead>
    <tbody>
      ${comparisons.map(c => `
      <tr>
        <td>${c.name || c.code}</td>
        <td>${c.gb}GB / ${c.days}gün</td>
        <td>$${c.oldPrice}</td>
        <td>$${c.newPrice}</td>
        <td class="${c.direction}">${c.change > 0 ? '+' : ''}${c.change}%</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div style="margin-top:2rem; font-size:.75rem; color:#94a3b8; text-align:center">
    Yaradılıb: ${new Date().toLocaleString('az-AZ')}
  </div>
</div>
</body>
</html>`;

const outPath = path.join(__dirname, 'price_comparison_report.html');
fs.writeFileSync(outPath, report);
console.log(`Hesabat yaradıldı: ${outPath}`);
console.log(`Ümumi plan: ${comparisons.length}, ARTIB: ${up.length}, ENDİB: ${down.length}, DƏYİŞMƏYİB: ${same.length}`);
