export interface EuropeNetwork {
  name: string;
  speed: '3G' | '4G' | '5G';
}

export interface EuropeCountryCoverage {
  country: string;
  code: string;
  networks: EuropeNetwork[];
}

/** Networks included in the Europe regional eSIM (EU-35). */
export const EUROPE_COVERAGE: EuropeCountryCoverage[] = [
  { country: 'Austria', code: 'AT', networks: [{ name: 'A1.net', speed: '5G' }, { name: '3', speed: '5G' }] },
  { country: 'Belgium', code: 'BE', networks: [{ name: 'Proximus', speed: '5G' }, { name: 'Orange', speed: '4G' }, { name: 'Base', speed: '4G' }] },
  { country: 'Bulgaria', code: 'BG', networks: [{ name: 'A1', speed: '4G' }, { name: 'Vivacom', speed: '4G' }, { name: 'Telenor', speed: '4G' }] },
  { country: 'Croatia', code: 'HR', networks: [{ name: 'Tele2', speed: '5G' }, { name: 'A1', speed: '4G' }] },
  { country: 'Cyprus', code: 'CY', networks: [{ name: 'PrimeTel', speed: '4G' }, { name: 'Epic', speed: '5G' }] },
  { country: 'Czech Republic', code: 'CZ', networks: [{ name: 'O2', speed: '5G' }, { name: 'Vodafone', speed: '5G' }] },
  { country: 'Denmark', code: 'DK', networks: [{ name: 'TDC', speed: '5G' }, { name: '3', speed: '5G' }] },
  { country: 'Estonia', code: 'EE', networks: [{ name: 'Tele2', speed: '5G' }, { name: 'Telia', speed: '5G' }] },
  { country: 'Finland', code: 'FI', networks: [{ name: 'DNA', speed: '5G' }] },
  { country: 'Germany', code: 'DE', networks: [{ name: 'O2', speed: '5G' }, { name: 'Vodafone', speed: '5G' }] },
  { country: 'Greece', code: 'GR', networks: [{ name: 'Wind', speed: '5G' }, { name: 'Vodafone', speed: '5G' }] },
  { country: 'Hungary', code: 'HU', networks: [{ name: 'Telenor Hungary', speed: '5G' }, { name: 'Vodafone', speed: '5G' }] },
  { country: 'Iceland', code: 'IS', networks: [{ name: 'Nova', speed: '5G' }, { name: 'Síminn', speed: '5G' }] },
  { country: 'Ireland', code: 'IE', networks: [{ name: 'Eir', speed: '5G' }] },
  { country: 'Italy', code: 'IT', networks: [{ name: 'TIM', speed: '5G' }, { name: 'Iliad', speed: '5G' }, { name: 'Wind', speed: '5G' }] },
  { country: 'Latvia', code: 'LV', networks: [{ name: 'Tele2', speed: '5G' }, { name: 'LMT', speed: '5G' }] },
  { country: 'Liechtenstein', code: 'LI', networks: [{ name: '7acht', speed: '4G' }, { name: 'FL1', speed: '5G' }] },
  { country: 'Lithuania', code: 'LT', networks: [{ name: 'Telia', speed: '5G' }, { name: 'Tele2', speed: '5G' }] },
  { country: 'Luxembourg', code: 'LU', networks: [{ name: 'Tango', speed: '5G' }, { name: 'Orange', speed: '5G' }, { name: 'POST', speed: '5G' }] },
  { country: 'Malta', code: 'MT', networks: [{ name: 'Vodafone', speed: '5G' }, { name: 'GO', speed: '5G' }] },
  { country: 'Moldova', code: 'MD', networks: [{ name: 'Orange', speed: '5G' }] },
  { country: 'Netherlands', code: 'NL', networks: [{ name: 'KPN', speed: '5G' }, { name: 'Vodafone', speed: '5G' }] },
  { country: 'Norway', code: 'NO', networks: [{ name: 'Telia', speed: '5G' }, { name: 'Telenor', speed: '5G' }] },
  { country: 'Poland', code: 'PL', networks: [{ name: 'Play', speed: '5G' }, { name: 'Orange', speed: '4G' }] },
  { country: 'Portugal', code: 'PT', networks: [{ name: 'Vodafone', speed: '5G' }, { name: 'NOS', speed: '5G' }] },
  { country: 'Romania', code: 'RO', networks: [{ name: 'Vodafone', speed: '4G' }, { name: 'Orange', speed: '5G' }] },
  { country: 'San Marino', code: 'SM', networks: [{ name: 'TIM', speed: '5G' }, { name: 'Wind', speed: '5G' }, { name: 'TIM maritime', speed: '3G' }, { name: 'Iliad', speed: '5G' }] },
  { country: 'Slovakia', code: 'SK', networks: [{ name: 'Orange', speed: '5G' }, { name: 'O2', speed: '5G' }] },
  { country: 'Slovenia', code: 'SI', networks: [{ name: 'Telemach', speed: '5G' }, { name: 'Mobitel', speed: '5G' }] },
  { country: 'Spain', code: 'ES', networks: [{ name: 'Orange', speed: '5G' }, { name: 'Movistar', speed: '5G' }] },
  { country: 'Sweden', code: 'SE', networks: [{ name: '3', speed: '5G' }, { name: 'Telia', speed: '5G' }, { name: 'Telenor', speed: '5G' }] },
  { country: 'Switzerland', code: 'CH', networks: [{ name: 'Sunrise', speed: '5G' }, { name: 'Salt', speed: '5G' }] },
  { country: 'Ukraine', code: 'UA', networks: [{ name: 'Vodafone', speed: '4G' }, { name: 'Kyivstar', speed: '4G' }, { name: 'lifecell', speed: '4G' }] },
  { country: 'United Kingdom', code: 'GB', networks: [{ name: 'T-Mobile UK', speed: '5G' }, { name: '3', speed: '4G' }, { name: 'O2', speed: '5G' }, { name: 'O2', speed: '4G' }] },
  { country: 'Vatican City', code: 'VA', networks: [] },
];

export const EUROPE_COVERAGE_COUNT = EUROPE_COVERAGE.length;
