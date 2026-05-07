const fs = require('fs');

const dataStr = fs.readFileSync('data.txt', 'utf8');
const lines = dataStr.split('\n').filter(l => l.trim().length > 0);

const multiMap = {
  'Europe': [],
  'Asia': [],
  'Middle East & Africa': [],
  'Americas': [],
  'Global': []
};

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length < 12) continue;

  const type = parts[0].trim();
  if (type !== 'Multi-Area') continue; 

  const region = parts[1].trim(); 
  const name = parts[2].trim();
  let rawPrice = parts[4].trim().replace('$', '');
  let priceNum = parseFloat(rawPrice);
  priceNum = Math.round(priceNum * 1.75 * 100) / 100;

  const code = parts[6].trim();
  const gbRaw = parts[7].trim();
  let gb = parseFloat(gbRaw);
  const days = parseInt(parts[8].trim(), 10);
  const id = parts[11].trim();

  let actualGb = gb;
  if (gb === 0) {
    if (name.includes('500MB')) actualGb = 0.5;
    else if (name.includes('100MB')) actualGb = 0.1;
    else if (name.includes('300MB')) actualGb = 0.3;
  }

  const p = {
    gb: actualGb,
    days: days,
    priceVal: priceNum,
    code: code,
    id: id
  };

  // Assign to categories based on the name from the CSV
  if (region.includes('Europe (35 areas)')) {
    multiMap['Europe'].push(p);
  } else if (region.includes('Asia (20 areas)') || region.includes('Asia-20')) {
    multiMap['Asia'].push(p);
  } else if (region.includes('Middle East & North Africa') || region.includes('Africa')) {
    multiMap['Middle East & Africa'].push(p);
  } else if (region.includes('USA & Canada') || region.includes('Caribbean')) {
    multiMap['Americas'].push(p);
  } else if (region.includes('Global (120+ areas)')) {
    multiMap['Global'].push(p);
  }
}

// Remove duplicates
for (const key in multiMap) {
  const unique = [];
  const map = new Set();
  for (const item of multiMap[key]) {
    const sig = `${item.gb}-${item.days}-${item.id}`;
    if (!map.has(sig)) {
      map.add(sig);
      unique.push(item);
    }
  }
  multiMap[key] = unique;
}

const esimPath = 'src/data/esimPackages.ts';
let esimContent = fs.readFileSync(esimPath, 'utf8');

for (const [key, plans] of Object.entries(multiMap)) {
  if (plans.length === 0) continue;

  const plansStr = `[\n` + plans.map(p => {
    return `      { gb: ${p.gb}, days: ${p.days}, price: m(${p.priceVal}), code: '${p.code}', id: '${p.id}' }`;
  }).join(',\n') + `\n    ]`;

  const regex = new RegExp(`name:\\s*'${key}'([\\s\\S]+?)plans:\\s*\\[[\\s\\S]*?\\]`, 'g');
  esimContent = esimContent.replace(regex, (match, middle) => {
    return `name: '${key}'${middle}plans: ${plansStr}`;
  });
}

fs.writeFileSync(esimPath, esimContent, 'utf8');
console.log('Multi-Area packages updated in esimPackages.ts');
