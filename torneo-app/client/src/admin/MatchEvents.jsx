import { useState } from 'react';
import { api, useFetch } from '../api.js';
import { EVENT_LABEL } from '../pages/MatchDetail.jsx';

// Goles y tarjetas de un partido + botón para recalcular el marcador desde los goles.
export default function MatchEvents({ match, onScoreChange }) {
  const detail = useFetch(`/matches/${match.id}`);
  const home = useFetch(`/players?team_id=${match.home_team_id}`);
  const away = useFetch(`/players?team_id=${match.away_team_id}`);
  const [f, setF] = useState({ team_id: String(match.home_team_id), player_id: '', type: 'goal', minute: '' });
  const [error, setError] = useState('');

  const players = (Number(f.team_id) === match.home_team_id ? home.data : away.data) || [];

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/events', {
        match_id: match.id,
        team_id: Number(f.team_id),
        player_id: f.player_id ? Number(f.player_id) : null,
        type: f.type,
        minute: f.minute === '' ? null : Number(f.minute),
      });
      setF({ ...f, player_id: '', minute: '' });
      detail.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api.del(`/admin/events/${id}`).catch((err) => setError(err.message));
    detail.reload();
  }

  async function recompute() {
    try {
      await api.post(`/admin/matches/${match.id}/recompute-score`);
      onScoreChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="events">
      <form onSubmit={add} className="inline">
        <select value={f.team_id} onChange={(e) => setF({ ...f, team_id: e.target.value, player_id: '' })}>
          <option value={match.home_team_id}>{match.home_name}</option>
          <option value={match.away_team_id}>{match.away_name}</option>
        </select>
        <select value={f.player_id} onChange={(e) => setF({ ...f, player_id: e.target.value })}>
          <option value="">Jugador…</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.number ? `${p.number}. ` : ''}{p.name}</option>)}
        </select>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {Object.entries(EVENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="number" min="0" placeholder="Min." value={f.minute} onChange={(e) => setF({ ...f, minute: e.target.value })} style={{ width: '5rem' }} />
        <button className="primary">Añadir</button>
      </form>
      {error && <p className="error">{error}</p>}

      <ul className="plain">
        {detail.data?.events.map((e) => (
          <li key={e.id}>
            {e.minute != null ? `${e.minute}' ` : ''}{EVENT_LABEL[e.type]} — {e.player_name || 'Sin asignar'} ({e.team_name}){' '}
            <button className="danger" onClick={() => remove(e.id)}>×</button>
          </li>
        ))}
      </ul>
      <button onClick={recompute}>Actualizar marcador desde los goles</button>
    </div>
  );
}
