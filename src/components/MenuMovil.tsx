import { useEffect, useId, useRef, useState } from 'react';

interface Enlace {
  nombre: string;
  href: string;
}

interface Props {
  enlaces: Enlace[];
}

export default function MenuMovil({ enlaces }: Props) {
  const [abierto, setAbierto] = useState(false);
  const idPanel = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    const alHacerClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };

    document.addEventListener('keydown', alPresionar);
    document.addEventListener('mousedown', alHacerClic);
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.removeEventListener('mousedown', alHacerClic);
    };
  }, [abierto]);

  return (
    <div ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="t-menu flex min-h-11 cursor-pointer items-center gap-2 text-ink"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto(!abierto)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {abierto ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M2 5h16M2 10h16M2 15h16" />}
        </svg>
        {abierto ? 'Cerrar' : 'Menú'}
      </button>

      <nav
        id={idPanel}
        aria-label="Categorías"
        hidden={!abierto}
        className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface"
      >
        <ul className="mx-auto max-w-pagina px-4 py-2">
          {enlaces.map((enlace) => (
            <li key={enlace.href} className="border-b border-border last:border-b-0">
              <a href={enlace.href} className="t-menu enlace flex min-h-12 items-center text-ink">
                {enlace.nombre}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
