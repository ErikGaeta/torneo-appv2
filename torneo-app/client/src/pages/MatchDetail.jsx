import { Link, useParams } from 'react-router-dom';
import { fmtDate, useFetch } from '../api.js';
import { Status } from '../components.jsx';

export const EVENT_LABEL = {
  goal: '⚽ Gol',
  own_goal: '⚽ Gol en propia',
  yellow_card: '🟨 Amarilla',
  red_card: '🟥 Roja',
};

export default function MatchDetail() {
  const { id } = useParams();
  const { data: m, error, loading } = useFetch(`/matches/${id}`);
  if (!m) return <Status loading={loading} error={error} />;
  const played = m.home_score != null && m.away_score != null;
  return (
    <>
      <p><Link to="/partidos">← Partidos</Link></p>
      <div className="card center">
        <p className="muted small">
          {fmtDate(m.date)}{m.venue ? ` · ${m.venue}` : ''}{m.round ? ` · ${m.round}` : ''}
        </p>
        <h1>
          {m.home_name} <span className="score">{played ? `${m.home_score} - ${m.away_score}` : 'vs'}</span> {m.away_name}
        </h1>
      </div>
      <h2>Eventos</h2>
      {m.events.length ? (
        <ul className="plain">
          {m.events.map((e) => (
            <li key={e.id}>
              <span className="muted">{e.minute != null ? `${e.minute}'` : '–'}</span>{' '}
              {EVENT_LABEL[e.type]} — {e.player_name || 'Sin asignar'} <span className="muted">({e.team_name})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sin eventos registrados.</p>
      )}
    </>
  );
}
