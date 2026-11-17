import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { SITE } from '../config.js';
import { COLOR_FIELDS, useSettings } from '../settings.jsx';
import ImageField from './ImageField.jsx';

const KEYS = ['site_name', 'tagline', 'logo_url', 'hero_image', ...COLOR_FIELDS.map((c) => c.key)];

// Pestaña "Apariencia": nombre, logo, imagen de cabecera y colores. Los cambios se ven al momento
// y solo se guardan al pulsar "Guardar".
export default function Appearance() {
  const { settings, preview, reload } = useSettings();
  const [f, setF] = useState({ ...settings });
  const [msg, setMsg] = useState('');

  // Al salir de la pestaña sin guardar, se vuelve a lo guardado.
  useEffect(() => () => reload(), []);

  const set = (patch) => {
    setF((s) => ({ ...s, ...patch }));
    preview((s) => ({ ...s, ...patch }));
    setMsg('');
  };

  async function save() {
    const body = Object.fromEntries(KEYS.map((k) => [k, f[k] || null]));
    try {
      await api.put('/admin/settings', body);
      setMsg('Guardado ✓');
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  }

  const resetColors = () => set(Object.fromEntries(COLOR_FIELDS.map((c) => [c.key, ''])));

  return (
    <div className="card">
      <div className="form">
        <label>Nombre del torneo<input value={f.site_name || ''} placeholder={SITE.name} onChange={(e) => set({ site_name: e.target.value })} /></label>
        <label>Frase de la barra superior<input value={f.tagline || ''} placeholder={SITE.tagline} onChange={(e) => set({ tagline: e.target.value })} /></label>
      </div>

      <div className="form" style={{ marginTop: '1rem' }}>
        <ImageField label="Logo (sale junto al nombre)" value={f.logo_url} onChange={(v) => set({ logo_url: v })} maxSide={600} />
        <ImageField label="Foto de fondo de la cabecera" value={f.hero_image} onChange={(v) => set({ hero_image: v })} maxSide={1920} />
      </div>

      <h3>Colores</h3>
      <div className="colors">
        {COLOR_FIELDS.map((c) => (
          <label key={c.key}>
            {c.label}
            <input type="color" value={f[c.key] || c.def} onChange={(e) => set({ [c.key]: e.target.value })} />
          </label>
        ))}
      </div>

      <div className="actions" style={{ marginTop: '1rem' }}>
        <button className="primary" onClick={save}>Guardar</button>
        <button onClick={resetColors}>Restablecer colores</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}