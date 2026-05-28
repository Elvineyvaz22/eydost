import { useEffect, useRef } from 'react';

const SORO_EMBED_ID =
  import.meta.env.VITE_SORO_EMBED_ID || '385a123b-3ab7-4bae-abd2-a8015bcee8d9';
const SCRIPT_SRC = `https://app.trysoro.com/api/embed/${SORO_EMBED_ID}`;
const SCRIPT_DOM_ID = `soro-embed-script-${SORO_EMBED_ID}`;

export default function SoroBlogEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    document.getElementById(SCRIPT_DOM_ID)?.remove();

    const script = document.createElement('script');
    script.id = SCRIPT_DOM_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-soro-embed', SORO_EMBED_ID);
    document.body.appendChild(script);

    return () => {
      container.innerHTML = '';
      document.getElementById(SCRIPT_DOM_ID)?.remove();
    };
  }, []);

  return <div id="soro-blog" ref={containerRef} className="min-h-[480px] w-full" />;
}
