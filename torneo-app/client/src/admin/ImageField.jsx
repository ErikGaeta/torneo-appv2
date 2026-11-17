import { useState } from 'react';
import { uploadImage } from '../api.js';

// Campo para elegir una foto del ordenador. `onChange` recibe la URL ('' si se quita).
export default function ImageField({ label, value, onChange, maxSide = 800, round = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file, maxSide));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="imgfield">
      <span className="lbl">{label}</span>
      <div className="imgrow">
        {value ? <img src={value} alt="" className={`thumb${round ? ' round' : ''}`} /> : <span className={`thumb empty${round ? ' round' : ''}`}>Sin foto</span>}
        <label className="filebtn">
          {busy ? 'Subiendo…' : value ? 'Cambiar' : 'Elegir foto'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pick} disabled={busy} hidden />
        </label>
        {value && <button type="button" onClick={() => onChange('')}>Quitar</button>}
      </div>
      {error && <span className="error small">{error}</span>}
    </div>
  );
}