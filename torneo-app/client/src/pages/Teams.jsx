import { Link } from 'react-router-dom';
import { useFetch } from '../api.js';
import { Status, Crest } from '../components.jsx';

export default function Teams() {
  const { data, error, loading } = useFetch('/teams');
  return (
    <>
      <h1>Equipos</h1>
      <Status loading={loading} error={error} />
      <div className="grid">
        {data?.map((t) => (
          <Link key={t.id} to={`/equipos/${t.id}`} className="card teamcard">
            <Crest name={t.name} logo={t.logo_url} size={44} />
            <b>{t.name}</b>
            {t.group_name && <span className="muted small"> · Grupo {t.group_name}</span>}
          </Link>
        ))}
      </div>
      {data?.length === 0 && <p className="muted">Aún no hay equipos.</p>}
    </>
  );
}