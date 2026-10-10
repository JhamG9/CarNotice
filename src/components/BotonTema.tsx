import { useEffect, useState } from 'react';

type Tema = 'light' | 'dark';

const CLAVE = 'tema';
const COLOR_BARRA: Record<Tema, string> = { light: '#F7F6F2', dark: '#0F1114' };

function temaActual(): Tema {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function BotonTema() {
  const [tema, setTema] = useState<Tema>('light');

  useEffect(() => setTema(temaActual()), []);

  const alternar = () => {
    const nuevo: Tema = temaActual() === 'dark' ? 'light' : 'dark';
    if (nuevo === 'dark') document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[nuevo]);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // Sin almacenamiento disponible, el tema dura solo esta página.
    }
    setTema(nuevo);
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="enlace flex size-11 cursor-pointer items-center justify-center rounded-full text-ink"
    >
      {/* El icono lo decide el CSS según data-theme, para que no parpadee al hidratar */}
      <svg className="dark:hidden" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="hidden dark:block" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
