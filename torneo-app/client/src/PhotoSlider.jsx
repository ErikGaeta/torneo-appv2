import { useEffect, useRef, useState } from 'react';
import { useFetch } from './api.js';

// Slider de fotos bajo la cabecera. Se desliza con el dedo, con las flechas o solo cada 5 s.
// Si no hay fotos subidas, no se muestra nada.
export default function PhotoSlider() {
  const { data } = useFetch('/slides');
  const box = useRef(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = data?.length || 0;

  const go = (k) => {
    const el = box.current;
    if (!el || !n) return;
    el.scrollTo({ left: ((k + n) % n) * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => go(i + 1), 5000);
    return () => clearInterval(t);
  }, [n, paused, i]);

  if (!n) return null;

  return (
    <section
      className="slider wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="slides" ref={box} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {data.map((s) => (
          <figure key={s.id} className="slide">
            <img src={s.image_url} alt={s.caption || ''} />
            {s.caption && <figcaption>{s.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {n > 1 && (
        <>
          <button className="sl-arrow prev" aria-label="Anterior" onClick={() => go(i - 1)}>‹</button>
          <button className="sl-arrow next" aria-label="Siguiente" onClick={() => go(i + 1)}>›</button>
          <div className="dots">
            {data.map((s, k) => (
              <button key={s.id} className={k === i ? 'on' : ''} aria-label={`Foto ${k + 1}`} onClick={() => go(k)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}