import { useFetch } from '../api.js';
import { Status, StandingsTable } from '../components.jsx';

export default function Home() {
  const { data, error, loading } = useFetch('/standings');
  return (
    <>
      <h1>Clasificación</h1>
      <Status loading={loading} error={error} />
      {data && (data.length ? <StandingsTable rows={data} /> : <p className="muted">Aún no hay equipos.</p>)}
    </>
  );
}
