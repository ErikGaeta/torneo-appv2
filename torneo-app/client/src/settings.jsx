import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { SITE } from './config.js';

// Colores editables desde Admin → Apariencia. `def` es el valor por defecto (el de styles.css).
export const COLOR_FIELDS = [
  { key: 'color_accent', css: '--accent', label: 'Color principal (botones, enlaces)', def: '#2fe0ff' },
  { key: 'color_hero_top', css: '--hero-top', label: 'Cabecera: color de arriba', def: '#1330e6' },
  { key: 'color_hero_bottom', css: '--hero-bottom', label: 'Cabecera: color de abajo', def: '#060b78' },
  { key: 'color_bg', css: '--bg', label: 'Fondo de la página', def: '#04072f' },
  { key: 'color_card', css: '--card', label: 'Tarjetas y tablas', def: '#0b1052' },
];

// Texto oscuro o claro según lo claro que sea el color principal.
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#04072f' : '#ffffff';
}

const Ctx = createContext({ settings: {}, preview: () => {}, reload: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const reload = () => api.get('/settings').then(setSettings).catch(() => {});

  useEffect(() => { reload(); }, []);

  // Aplica los colores a toda la web y el nombre a la pestaña del navegador.
  useEffect(() => {
    const root = document.documentElement.style;
    for (const f of COLOR_FIELDS) {
      if (settings[f.key]) root.setProperty(f.css, settings[f.key]);
      else root.removeProperty(f.css);
    }
    if (settings.color_accent) root.setProperty('--on-accent', readableOn(settings.color_accent));
    else root.removeProperty('--on-accent');
    document.title = settings.site_name || SITE.name;
  }, [settings]);

  // `preview` cambia los ajustes solo en pantalla, sin guardar (vista previa en Apariencia).
  return <Ctx.Provider value={{ settings, preview: setSettings, reload }}>{children}</Ctx.Provider>;
}