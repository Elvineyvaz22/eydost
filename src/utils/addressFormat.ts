/** User-facing address labels — no Plus Codes, postal codes, or country name */

const PLUS_CODE = /[23456789CFGHJMPQRVWX]{4,10}\+[23456789CFGHJMPQRVWX]{2,4}/gi;
const INLINE_POSTAL_AZ = /\bAZ[\s-]?\d{4}\b/gi;

const COUNTRY_LABELS = new Set([
  'azerbaijan',
  'azərbaycan',
  'азербайджан',
  'republic of azerbaijan',
]);

type AddressComponent = google.maps.GeocoderAddressComponent;

export function extractCountry(components?: AddressComponent[]): {
  code: string | null;
  name: string | null;
} {
  const country = components?.find((c) => c.types.includes('country'));
  return {
    code: country?.short_name?.toLowerCase() ?? null,
    name: country?.long_name ?? null,
  };
}

function getComponent(components: AddressComponent[], type: string): string | undefined {
  const c = components.find((x) => x.types.includes(type));
  return c?.long_name;
}

function collectPostalValues(components?: AddressComponent[]): string[] {
  if (!components) return [];
  const values = new Set<string>();
  for (const c of components) {
    if (!c.types.includes('postal_code')) continue;
    if (c.long_name) values.add(c.long_name.trim());
    if (c.short_name) values.add(c.short_name.trim());
  }
  return [...values];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanupSpacing(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();
}

function isPlusCodeOnly(text: string): boolean {
  const t = text.trim();
  return /^[23456789CFGHJMPQRVWX]{4,10}\+[23456789CFGHJMPQRVWX]{2,4}$/i.test(t);
}

function isPostalOnly(text: string, postalValues: string[]): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^AZ[\s-]?\d{4}$/i.test(t)) return true;
  if (postalValues.some((p) => p.toLowerCase() === t.toLowerCase())) return true;
  if (/^\d{4}$/.test(t) && postalValues.some((p) => p === t)) return true;
  return false;
}

function isCountryLabel(text: string): boolean {
  return COUNTRY_LABELS.has(text.trim().toLowerCase());
}

function stripNoiseFromText(text: string, postalValues: string[]): string {
  let out = text.replace(PLUS_CODE, '').replace(INLINE_POSTAL_AZ, '');

  for (const pc of postalValues) {
    if (!pc) continue;
    out = out.replace(new RegExp(`\\b${escapeRegex(pc)}\\b`, 'gi'), '');
    // "Bakı 1000" — postal at end of segment
    if (/^\d{4}$/.test(pc)) {
      out = out.replace(new RegExp(`\\s+${escapeRegex(pc)}\\s*$`), '');
    }
  }

  return cleanupSpacing(out);
}

function sanitizeLabel(label: string, components?: AddressComponent[]): string {
  const postalValues = collectPostalValues(components);

  const parts = label
    .split(',')
    .map((p) => stripNoiseFromText(p.trim(), postalValues))
    .filter((p) => p && !isPlusCodeOnly(p) && !isPostalOnly(p, postalValues) && !isCountryLabel(p));

  return cleanupSpacing(parts.join(', '));
}

/** Build a short street-style label from geocoder/place address_components */
export function formatAddressComponents(components: AddressComponent[]): string {
  const postalValues = collectPostalValues(components);

  const route = getComponent(components, 'route');
  const streetNumber = getComponent(components, 'street_number');
  const premise = getComponent(components, 'premise');
  const subpremise = getComponent(components, 'subpremise');
  const poi =
    getComponent(components, 'establishment') ||
    getComponent(components, 'point_of_interest');
  const neighborhood =
    getComponent(components, 'neighborhood') ||
    getComponent(components, 'sublocality') ||
    getComponent(components, 'sublocality_level_1');
  const locality =
    getComponent(components, 'locality') ||
    getComponent(components, 'administrative_area_level_2');

  const parts: string[] = [];

  const add = (value?: string) => {
    if (!value) return;
    const clean = stripNoiseFromText(value, postalValues);
    if (clean && !parts.includes(clean)) parts.push(clean);
  };

  if (poi && route && poi !== route) add(poi);

  if (route) {
    const street = streetNumber ? `${route}, ${streetNumber}` : route;
    add(street);
  } else {
    add(premise);
  }

  add(subpremise);

  if (parts.length === 0) add(neighborhood);
  add(locality);

  return sanitizeLabel(parts.join(', '), components);
}

export function formatGeocoderResult(result: google.maps.GeocoderResult): string {
  const components = result.address_components;
  if (components?.length) {
    const fromComponents = formatAddressComponents(components);
    if (fromComponents) return fromComponents;
  }
  return sanitizeLabel(result.formatted_address, components);
}

export function formatPlaceAddress(place: google.maps.places.PlaceResult): string {
  const components = place.address_components;
  const name = place.name?.trim();
  const isNamedPlace =
    place.types?.some((t) =>
      ['establishment', 'point_of_interest', 'store', 'shopping_mall', 'airport', 'transit_station'].includes(t)
    ) ?? false;

  if (components?.length) {
    const street = formatAddressComponents(components);
    if (isNamedPlace && name) {
      const label = street && !street.startsWith(name) ? `${name}, ${street}` : name;
      return sanitizeLabel(label, components);
    }
    if (street) return street;
  }

  if (isNamedPlace && name) return sanitizeLabel(name, components);

  if (place.formatted_address) {
    const cleaned = sanitizeLabel(place.formatted_address, components);
    if (cleaned) return cleaned;
  }

  return name ? sanitizeLabel(name, components) : '';
}
