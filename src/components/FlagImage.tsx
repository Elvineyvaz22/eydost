import { useState } from 'react';

interface FlagImageProps {
  flag?: string;        // emoji flag e.g. "🇦🇿"
  countryCode?: string; // ISO-2 e.g. "az"
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

function emojiToCode(flag: string): string {
  if (!flag) return '';
  try {
    const pts = [...flag].map(c => c.codePointAt(0) ?? 0);
    // Regional Indicator Symbols start at 0x1F1E6
    const code = pts
      .filter(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)
      .map(cp => String.fromCharCode(cp - 0x1F1E6 + 65))
      .join('')
      .toLowerCase();
    return code;
  } catch {
    return '';
  }
}

const sizeClass = {
  sm: 'w-7 h-5 text-sm',
  md: 'w-10 h-7 text-xl',
  lg: 'w-16 h-11 text-4xl',
  xl: 'w-28 h-20 text-6xl',
  full: 'w-full h-full text-5xl',
};

export default function FlagImage({ flag, countryCode, size = 'md', className = '' }: FlagImageProps) {
  const [error, setError] = useState(false);
  const code = countryCode?.toLowerCase() || (flag ? emojiToCode(flag) : '');
  
  // Use emoji fallback if no code, or if there's an error loading the image
  if (!code || code.length !== 2 || error) {
    return flag ? (
      <div className={`${sizeClass[size]} flex items-center justify-center bg-gray-50 rounded-sm ${className}`}>
        <span className="leading-none">{flag}</span>
      </div>
    ) : null;
  }

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={code.toUpperCase()}
      className={`${sizeClass[size]} object-cover shadow-sm inline-block ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
