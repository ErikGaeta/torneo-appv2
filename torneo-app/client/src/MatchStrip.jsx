import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { fmtShort, useFetch } from './api.js';
import { Crest } from './components.jsx';

// Tira horizontal con los próximos partidos (o los últimos, si ya no quedan).
export default function MatchStrip() {
  const { data } = useFetch('/matches');
  const ref = useRef(null);
  if (!data?.length) return null;

  const upcoming = data.filter((m) => m.status !== 'finished');
  const list = (upcoming.length ? upcoming : [...data].reverse()).slice(0, 12);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });

  return (
    <div className="strip">
      <button className="arrow" aria-label="Anterior" onClick={() => scroll(-1)}>‹</button>
      <div className="cards" ref={ref}>
        {list.map((m) => {
          const played = m.home_score != null && m.away_score != null;
          return (
            <Link key={m.id} to={`/partidos/${m.id}`} className="mcard">
              <span className="when">{fmtShort(m.date)}{m.status === 'live' ? ' · 🔴 En juego' : ''}</span>
              <span className="trow"><Crest name={m.home_name} logo={m.home_logo} /><span className="tname">{m.home_name}</span><b>{played ? m.home_score : ''}</b></span>
              <span className="trow"><Crest name={m.away_name} logo={m.away_logo} /><span className="tname">{m.away_name}</span><b>{played ? m.away_score : ''}</b></span>
            </Link>
          );
        })}
      </div>
      <button className="arrow" aria-label="Siguiente" onClick={() => scroll(1)}>›</button>
      <Link to="/partidos" className="ghost-btn">Ver todos los partidos</Link>
    </div>
  );
}
