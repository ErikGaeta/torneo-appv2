import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../api.js';
import { Status, MatchRow, Crest } from '../components.jsx';

export default function TeamDetail() {
  const { id } = useParams();
  const { data: team, error, loading } = useFetch(`/teams/${id}`);
  const { data: matches } = useFetch(`/matches?team_id=${id}`);
  if (!team) return <Status loading={loading} error={error} />;
  return (
    <>
      <p><Link to="/equipos">← Equipos</Link></p>
      <h1 className="titlerow"><Crest name={team.name} logo={team.logo_url} size={56} /> {team.name}</h1>
      <h2>Plantilla</h2>
      {team.players.length ? (
        <table>
          <thead><tr><th>Nº</th><th>Nombre</th><th>Posición</th></tr></thead>
          <tbody>
            {team.players.map((p) => (
              <tr key={p.id}><td>{p.number ?? '–'}</td><td className="nowrap"><Crest name={p.name} logo={p.photo_url} size={30} /> {p.name}</td><td>{p.position ?? '–'}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">Sin jugadores todavía.</p>
      )}
      <h2>Partidos</h2>
      {matches?.map((m) => <MatchRow key={m.id} m={m} />)}
    </>
  );
}