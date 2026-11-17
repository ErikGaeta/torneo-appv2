import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, fmtDate, getToken, setToken, useFetch } from '../api.js';
import Resource from './Resource.jsx';
import MatchEvents from './MatchEvents.jsx';
import Appearance from './Appearance.jsx';
import { Crest } from '../components.jsx';

export default function Admin() {
  const [ok, setOk] = useState(getToken() ? null : false);
  const [tab, setTab] = useState('matches');
  const teams = useFetch('/teams');
  const players = useFetch('/players');
  const matches = useFetch('/matches');
  const slides = useFetch('/slides');

  // Comprueba con el servidor que el token sigue siendo válido.
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then(() => setOk(true)).catch(() => setOk(false));
  }, []);

  if (ok === null) return <p className="muted">Cargando…</p>;
  if (!ok) return <Navigate to="/admin/login" replace />;

  const teamOptions = (teams.data || []).map((t) => ({ value: t.id, label: t.name }));

  return (
    <>
      <div className="row">
        <h1>Administración</h1>
        <button onClick={() => { setToken(null); setOk(false); }}>Cerrar sesión</button>
      </div>
      <div className="tabs">
        {[['matches', 'Partidos'], ['teams', 'Equipos'], ['players', 'Jugadores'], ['slides', 'Fotos'], ['look', 'Apariencia']].map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'teams' && (
        <Resource
          path="/teams"
          rows={teams.data || []}
          reload={teams.reload}
          fields={[
            { key: 'name', label: 'Nombre', required: true },
            { key: 'short_name', label: 'Abreviatura' },
            { key: 'group_name', label: 'Grupo' },
            { key: 'logo_url', label: 'Escudo', type: 'image', maxSide: 400 },
          ]}
          columns={[
            { label: 'Escudo', render: (r) => <Crest name={r.name} logo={r.logo_url} size={28} /> },
            { label: 'Nombre', render: (r) => r.name },
            { label: 'Abrev.', render: (r) => r.short_name },
            { label: 'Grupo', render: (r) => r.group_name },
          ]}
        />
      )}

      {tab === 'players' && (
        <Resource
          path="/players"
          rows={players.data || []}
          reload={players.reload}
          fields={[
            { key: 'name', label: 'Nombre', required: true },
            { key: 'team_id', label: 'Equipo', type: 'select', numeric: true, required: true, options: teamOptions },
            { key: 'number', label: 'Dorsal', type: 'number' },
            { key: 'position', label: 'Posición' },
            { key: 'photo_url', label: 'Foto', type: 'image', maxSide: 600, round: true },
          ]}
          columns={[
            { label: 'Foto', render: (r) => <Crest name={r.name} logo={r.photo_url} size={32} /> },
            { label: 'Nombre', render: (r) => r.name },
            { label: 'Equipo', render: (r) => r.team_name },
            { label: 'Dorsal', render: (r) => r.number },
            { label: 'Posición', render: (r) => r.position },
          ]}
        />
      )}

      {tab === 'slides' && (
        <Resource
          path="/slides"
          rows={slides.data || []}
          reload={slides.reload}
          fields={[
            { key: 'image_url', label: 'Foto', type: 'image', maxSide: 1600, required: true },
            { key: 'caption', label: 'Texto (opcional)' },
          ]}
          columns={[
            { label: 'Foto', render: (r) => <img src={r.image_url} alt="" className="thumb" /> },
            { label: 'Texto', render: (r) => r.caption },
            { label: 'Subida el', render: (r) => r.created_at?.slice(0, 10) },
          ]}
        />
      )}

      {tab === 'look' && <Appearance />}

      {tab === 'matches' && (
        <Resource
          path="/matches"
          rows={matches.data || []}
          reload={matches.reload}
          fields={[
            { key: 'home_team_id', label: 'Local', type: 'select', numeric: true, required: true, options: teamOptions },
            { key: 'away_team_id', label: 'Visitante', type: 'select', numeric: true, required: true, options: teamOptions },
            { key: 'date', label: 'Fecha y hora', type: 'datetime-local' },
            { key: 'venue', label: 'Campo' },
            { key: 'stage', label: 'Fase', type: 'select', options: [{ value: 'league', label: 'Liga / grupos' }, { value: 'knockout', label: 'Eliminatoria' }] },
            { key: 'round', label: 'Jornada / ronda' },
            { key: 'group_name', label: 'Grupo' },
            { key: 'home_score', label: 'Goles local', type: 'number' },
            { key: 'away_score', label: 'Goles visitante', type: 'number' },
            { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'scheduled', label: 'Programado' }, { value: 'live', label: 'En juego' }, { value: 'finished', label: 'Terminado' }] },
          ]}
          columns={[
            { label: 'Fecha', render: (r) => fmtDate(r.date) },
            { label: 'Partido', render: (r) => `${r.home_name} vs ${r.away_name}` },
            { label: 'Resultado', render: (r) => (r.home_score != null ? `${r.home_score} - ${r.away_score}` : '–') },
            { label: 'Estado', render: (r) => r.status },
          ]}
          expand={(m) => <MatchEvents match={m} onScoreChange={matches.reload} />}
        />
      )}
    </>
  );
}