/* eslint-disable no-console */
/** Dump every unique country code present in src/data/esimPackages.ts and
 *  print which ones are missing from the sync script's COUNTRIES list. */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dataSrc = await readFile(
  path.join(projectRoot, 'src', 'data', 'esimPackages.ts'),
  'utf8'
);

const re =
  /countryCode:\s*'([a-z]{2})'\s*,\s*country:\s*'([^']+)'\s*,\s*slug:\s*'([^']+)'/g;
const allCountries = new Map();
let m;
while ((m = re.exec(dataSrc)) !== null) {
  const code = m[1].toUpperCase();
  if (!allCountries.has(code)) allCountries.set(code, m[2]);
}

const syncSrc = await readFile(
  path.join(projectRoot, 'api', 'sync-esim-packages.ts'),
  'utf8'
);
const syncListMatch = syncSrc.match(/const COUNTRIES = \[([\s\S]*?)\]/);
const syncCodes = new Set(
  [...syncListMatch[1].matchAll(/'([A-Z]{2})'/g)].map((m) => m[1])
);

console.log(`esimPackages.ts countries:    ${allCountries.size}`);
console.log(`sync-esim-packages COUNTRIES: ${syncCodes.size}`);

const missing = [...allCountries.entries()].filter(([code]) => !syncCodes.has(code));
const extra = [...syncCodes].filter((code) => !allCountries.has(code));

console.log(`\nMissing from sync (${missing.length}):`);
console.log(missing.map(([c, n]) => `  ${c} ${n}`).join('\n'));

console.log(`\nIn sync but not in data file (${extra.length}):`);
console.log(extra.map((c) => `  ${c}`).join('\n'));

console.log('\nSuggested replacement COUNTRIES list (sorted, unique):');
const merged = new Set([...allCountries.keys(), ...syncCodes]);
const sorted = [...merged].sort();
const groups = [];
for (let i = 0; i < sorted.length; i += 10) groups.push(sorted.slice(i, i + 10));
console.log(
  groups
    .map((g) => '  ' + g.map((c) => `'${c}'`).join(', ') + ',')
    .join('\n')
);
