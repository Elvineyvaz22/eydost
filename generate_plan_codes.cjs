/**
 * Bu skript codes.txt ve ids.txt fayllarini oxuyub
 * src/data/planCodeMap.ts faylini yaradır.
 *
 * İstifadə:
 *   1. codes.txt — hər sətirdə bir kod (CN, TR, AF, EU-7 ...)
 *   2. ids.txt   — hər sətirdə bir ID  (P92TALXP8, PGURVYHQ1 ...)
 *   3. node generate_plan_codes.js
 */

const fs = require('fs');
const path = require('path');

// ── Faylları oxu ──────────────────────────────────────────────
if (!fs.existsSync('codes.txt') || !fs.existsSync('ids.txt')) {
  console.error('Xəta: codes.txt və ids.txt faylları tapılmadı!');
  console.error('Lütfən, hər iki faylı layihənin kök qovluğunda yaradın.');
  process.exit(1);
}

const codes = fs.readFileSync('codes.txt', 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean);

const ids = fs.readFileSync('ids.txt', 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean);

const count = Math.min(codes.length, ids.length);
if (codes.length !== ids.length) {
  console.warn(`Xeberdarliq: Uyğunsuzluq: ${codes.length} kod, ${ids.length} ID. En kiçik say (${count}) istifadə olunacaq.`);
}

console.log(`Cəmi ${count} plan tapıldı.`);

// ── Kodlara görə qruplaşdır ────────────────────────────────────
const grouped = {};

for (let i = 0; i < count; i++) {
  const rawCode = codes[i];
  const key = rawCode.toLowerCase(); // TR → tr

  if (!grouped[key]) grouped[key] = [];
  grouped[key].push({ code: rawCode, id: ids[i] });
}

const countryCount = Object.keys(grouped).length;
console.log(`Cəmi ${countryCount} unikal kod qrupu yaradıldı.`);

// ── TypeScript faylı yarat ─────────────────────────────────────
let output = `// Bu fayl generate_plan_codes.js skripti tərəfindən avtomatik yaradılmışdır.
// Əl ilə dəyişdirməyin — skripti yenidən işlədin.

export interface PlanCodeEntry {
  code: string;
  id: string;
}

export const planCodeMap: Record<string, PlanCodeEntry[]> = {\n`;

for (const [key, entries] of Object.entries(grouped)) {
  output += `  '${key}': [\n`;
  for (const entry of entries) {
    output += `    { code: '${entry.code}', id: '${entry.id}' },\n`;
  }
  output += `  ],\n`;
}

output += `};\n\n`;
output += `/**
 * Bir ölkənin müəyyən planı üçün code və id qaytarır.
 * @param countryCode - Kiçik hərflə ISO kodu (məs: 'tr', 'jp')
 * @param planIndex   - Plandakı sıra nömrəsi (0-dan başlayır)
 */
export function getPlanCode(
  countryCode: string,
  planIndex: number
): PlanCodeEntry | undefined {
  const entries = planCodeMap[countryCode.toLowerCase()];
  return entries?.[planIndex];
}\n`;

const outPath = path.join('src', 'data', 'planCodeMap.ts');
fs.writeFileSync(outPath, output, 'utf8');

console.log(`✅ ${outPath} yaradıldı (${codes.length} plan).`);
console.log('İndi npm run dev işlədin ki, dəyişiklikləri görəsiniz.');
