import { Link } from 'react-router-dom';
import { fmtDate } from './api.js';

export const Status = ({ loading, error }) =>
  error ? <p className="error">Error: {error}</p> : loading ? <p className="muted">Cargando…</p> : null;

// Escudo: la imagen del equipo (logo_url) o, si no hay, un círculo con sus iniciales.
export function Crest({ name = '', logo, size = 22 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (logo) return <img className="crest" src={logo} alt="" style={style} />;
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className="crest" style={style}>{initials}</span>;
}

export function MatchRow({ m }) {
  const played = m.home_score != null && m.away_score != null;
  return (
    <Link to={`/partidos/${m.id}`} className="match">
      <span className="muted small">
        {fmtDate(m.date)}
        {m.round ? ` · ${m.round}` : ''}
        {m.status === 'live' ? ' · 🔴 En juego' : ''}
      </span>
      <span className="teams">
        <span className="home">{m.home_name} <Crest name={m.home_name} logo={m.home_logo} /></span>
        <b className="score">{played ? `${m.home_score} - ${m.away_score}` : 'vs'}</b>
        <span className="away"><Crest name={m.away_name} logo={m.away_logo} /> {m.away_name}</span>
      </span>
    </Link>
  );
}

export function StandingsTable({ rows }) {
  // Agrupa por group_name (si no hay grupos, una sola tabla).
  const groups = rows.reduce((acc, r) => {
    const k = r.group_name || '';
    (acc[k] ||= []).push(r);
    return acc;
  }, {});
  return Object.entries(groups).map(([name, list]) => (
    <div key={name} className="card">
      {name && <h3>Grupo {name}</h3>}
      <div className="scroll">
        <table>
          <thead>
            <tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr>
          </thead>
          <tbody>
            {list.map((t, i) => (
              <tr key={t.team_id}>
                <td>{i + 1}</td>
                <td className="nowrap"><Crest name={t.name} logo={t.logo_url} size={20} /> <Link to={`/equipos/${t.team_id}`}>{t.name}</Link></td>
                <td>{t.played}</td><td>{t.won}</td><td>{t.drawn}</td><td>{t.lost}</td>
                <td>{t.gf}</td><td>{t.ga}</td><td>{t.gd}</td><td><b>{t.points}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ));
}
