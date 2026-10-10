import { useState } from 'react';

interface Props {
  titulo: string;
  url: string;
}

const CLASE_BOTON =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface px-4 text-[15px] font-bold text-ink transition-colors duration-150 hover:border-accent hover:text-accent';

export default function Compartir({ titulo, url }: Props) {
  const [copiado, setCopiado] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);

  const redes = [
    { nombre: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
    { nombre: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { nombre: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <ul className="flex flex-wrap gap-2">
      {redes.map((red) => (
        <li key={red.nombre}>
          <a
            href={red.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${red.nombre} (abre una pestaña nueva)`}
            className={CLASE_BOTON}
          >
            {red.nombre}
          </a>
        </li>
      ))}
      <li>
        <button type="button" onClick={copiar} className={CLASE_BOTON}>
          <span aria-live="polite">{copiado ? 'Enlace copiado' : 'Copiar enlace'}</span>
        </button>
      </li>
    </ul>
  );
}
