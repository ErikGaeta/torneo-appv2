import { useState } from 'react';
import { useFetch } from '../api.js';
import { Status, MatchRow } from '../components.jsx';

const FILTERS = [
  ['', 'Todos'],
  ['scheduled', 'Próximos'],
  ['live', 'En juego'],
  ['finished', 'Terminados'],
];

export default function Matches() {
  const [status, setStatus] = useState('');
  const { data, error, loading } = useFetch(`/matches${status ? `?status=${status}` : ''}`);
  return (
    <>
      <h1>Partidos</h1>
      <div className="tabs">
        {FILTERS.map(([v, label]) => (
          <button key={v} className={status === v ? 'active' : ''} onClick={() => setStatus(v)}>{label}</button>
        ))}
      </div>
      <Status loading={loading} error={error} />
      {data && (data.length ? data.map((m) => <MatchRow key={m.id} m={m} />) : <p className="muted">No hay partidos.</p>)}
    </>
  );
}
