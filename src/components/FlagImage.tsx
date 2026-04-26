interface FlagImageProps {
  flag?: string;        // emoji flag e.g. "🇦🇿"
  countryCode?: string; // ISO-2 e.g. "az"
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function emojiToCode(flag: string): string {
  const pts = [...flag].map(c => c.codePointAt(0) ?? 0);
  return pts.map(cp => String.fromCharCode(cp - 0x1F1E6 + 65)).join('').toLowerCase();
}

const sizeClass = {
  sm: 'w-7 h-5',
  md: 'w-10 h-7',
  lg: 'w-16 h-11',
  xl: 'w-28 h-20',
};

export default function FlagImage({ flag, countryCode, size = 'md', className = '' }: FlagImageProps) {
  const code = countryCode?.toLowerCase() || (flag ? emojiToCode(flag) : '');
  if (!code || code.length !== 2) return null;

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={code.toUpperCase()}
      className={`${sizeClass[size]} object-cover rounded-sm shadow-sm inline-block ${className}`}
      loading="lazy"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
