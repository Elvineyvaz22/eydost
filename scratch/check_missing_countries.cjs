
const fs = require('fs');

const pricingRules = JSON.parse(fs.readFileSync('pricing_rules_update.json', 'utf8')).pricing_rules;
const pricingCountryCodes = new Set(pricingRules.map(r => r.target_id).filter(id => id && id.length === 2));

const packagesContent = fs.readFileSync('src/data/esimPackages.ts', 'utf8');
const packageCodesMatch = packagesContent.match(/countryCode: '([a-z]{2})'/g);
const packageCountryCodes = new Set(packageCodesMatch ? packageCodesMatch.map(m => m.match(/'([a-z]{2})'/)[1].toUpperCase()) : []);

const missing = [];
for (const code of pricingCountryCodes) {
    if (!packageCountryCodes.has(code)) {
        missing.push(code);
    }
}

console.log('Missing codes in esimPackages.ts (' + missing.length + '):');
console.log(missing.join(', '));
