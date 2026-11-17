import { useFetch } from '../api.js';
import { Status } from '../components.jsx';

export default function Stats() {
  const scorers = useFetch('/stats/scorers');
  const cards = useFetch('/stats/cards');
  return (
    <>
      <h1>Estadísticas</h1>
      <h2>Goleadores</h2>
      <Status loading={scorers.loading} error={scorers.error} />
      {scorers.data &&
        (scorers.data.length ? (
          <table>
            <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead>
            <tbody>
              {scorers.data.map((s, i) => (
                <tr key={s.player_id}><td>{i + 1}</td><td>{s.name}</td><td>{s.team_name}</td><td><b>{s.goals}</b></td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Sin goles registrados.</p>
        ))}

      <h2>Tarjetas</h2>
      <Status loading={cards.loading} error={cards.error} />
      {cards.data &&
        (cards.data.length ? (
          <table>
            <thead><tr><th>Jugador</th><th>Equipo</th><th>🟨</th><th>🟥</th></tr></thead>
            <tbody>
              {cards.data.map((c) => (
                <tr key={c.player_id}><td>{c.name}</td><td>{c.team_name}</td><td>{c.yellow}</td><td>{c.red}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Sin tarjetas registradas.</p>
        ))}
    </>
  );
}
