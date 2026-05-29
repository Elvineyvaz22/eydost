import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AppLanguage } from '../utils/languagePreference';
import { DEFAULT_LOCALE, localizePathname, parseLocaleFromPath } from '../utils/localePaths';

function parseBodyLinks(text: string, linkLocale: AppLanguage): ReactNode[] {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const label = match[1];
    const href = match[2];
    try {
      const url = new URL(href);
      if (url.hostname === 'eydost.com' || url.hostname === 'www.eydost.com') {
        nodes.push(
          <Link
            key={match.index}
            to={`${localizePathname(url.pathname, linkLocale)}${url.search}`}
            className="text-blue-600 hover:underline"
          >
            {label}
          </Link>,
        );
      } else {
        nodes.push(
          <a key={match.index} href={href} className="text-blue-600 hover:underline" rel="noopener noreferrer">
            {label}
          </a>,
        );
      }
    } catch {
      nodes.push(label);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length > 0 ? nodes : [text];
}

export default function BlogArticleBody({ body }: { body: string }) {
  const location = useLocation();
  const linkLocale = parseLocaleFromPath(location.pathname) ?? DEFAULT_LOCALE;
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim());

  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
          {parseBodyLinks(para, linkLocale)}
        </p>
      ))}
    </>
  );
}
