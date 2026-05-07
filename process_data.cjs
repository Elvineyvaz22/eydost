const fs = require('fs');

const dataStr = fs.readFileSync('data.txt', 'utf8');
const lines = dataStr.split('\n').filter(l => l.trim().length > 0);

const headers = lines[0].split(',');
// 0: Type, 1: Region, 2: Name, 3: Data Type, 4: Price(USD), 5: Variant Price, 6: Code, 7: GBs, 8: Validity(Days), 9: Slug, 10: Coverage, 11: ID

const countryMap = {};

for (let i = 1; i < lines.length; i++) {
  // Use regex to properly split CSV just in case there are quotes, though simple split is usually okay for this data
  const parts = lines[i].split(',');
  if (parts.length < 12) continue;

  const type = parts[0].trim();
  if (type !== 'Single') continue; // Only process Single countries for now

  const region = parts[1].trim(); // Country name
  let rawPrice = parts[4].trim(); // Price(USD)
  rawPrice = rawPrice.replace('$', '');
  let priceNum = parseFloat(rawPrice);
  // Add 75% margin and round to 2 decimal places
  priceNum = Math.round(priceNum * 1.75 * 100) / 100;

  const code = parts[6].trim();
  const gbRaw = parts[7].trim();
  let gb = parseFloat(gbRaw);
  const days = parseInt(parts[8].trim(), 10);
  const id = parts[11].trim();

  // "0" GBs usually means something like 500MB or 100MB. Let's look at the name to find out.
  const name = parts[2].trim();
  let actualGb = gb;
  if (gb === 0) {
    if (name.includes('500MB')) actualGb = 0.5;
    else if (name.includes('100MB')) actualGb = 0.1;
    else if (name.includes('300MB')) actualGb = 0.3;
  }
  
  const key = code.toLowerCase();
  if (!countryMap[key]) {
    countryMap[key] = [];
  }
  
  countryMap[key].push({
    gb: actualGb,
    days: days,
    priceVal: priceNum,
    code: code,
    id: id,
    name: name,
    dataType: parts[3].trim()
  });
}

// Now read esimPackages.ts
const esimPath = 'src/data/esimPackages.ts';
let esimContent = fs.readFileSync(esimPath, 'utf8');

// We need to replace the generic plans (gA, gB, gX, etc.) with specific plans for each country
// Actually, it's safer to generate a map of countryCode to new plans string, and replace the `plans: ...` in the file.

let outputLogs = [];

let modifiedEsimContent = esimContent;

for (const [code, plans] of Object.entries(countryMap)) {
  // generate plans array string
  const plansStr = `[\n` + plans.map(p => {
    return `      { gb: ${p.gb}, days: ${p.days}, price: m(${p.priceVal}), code: '${p.code}', id: '${p.id}' }`;
  }).join(',\n') + `\n    ]`;

  // Regex to find countryCode: 'code' and replace its plans: ...
  // Format typically: countryCode: 'tr', country: 'Turkey', slug: 'turkey-esim', region: 'europe', featured: true, plans: gX
  // We can use a regex to replace `plans: gX` or `plans: [ ... ]`
  const regex = new RegExp(`countryCode:\\s*'${code}'([^}]+?)plans:\\s*[a-zA-Z0-9\\[\\]\\{\\}\\s,.:'"()$]*\\s*}`, 'gs');
  
  modifiedEsimContent = modifiedEsimContent.replace(regex, (match, middle) => {
    return `countryCode: '${code}'${middle}plans: ${plansStr} }`;
  });
}

fs.writeFileSync(esimPath, modifiedEsimContent, 'utf8');
console.log('esimPackages.ts updated.');

// Now generate planCodeMap.ts
let planCodeOutput = `// Avtomatik yaradılmışdır.\nexport interface PlanCodeEntry {\n  code: string;\n  id: string;\n}\n\nexport const planCodeMap: Record<string, PlanCodeEntry[]> = {\n`;

for (const [code, plans] of Object.entries(countryMap)) {
  planCodeOutput += `  '${code}': [\n`;
  for (const p of plans) {
    planCodeOutput += `    { code: '${p.code}', id: '${p.id}' },\n`;
  }
  planCodeOutput += `  ],\n`;
}

planCodeOutput += `};\n\nexport function getPlanCode(countryCode: string, planIndex: number): PlanCodeEntry | undefined {\n  const entries = planCodeMap[countryCode.toLowerCase()];\n  return entries?.[planIndex];\n}\n`;

fs.writeFileSync('src/data/planCodeMap.ts', planCodeOutput, 'utf8');
console.log('planCodeMap.ts updated.');
