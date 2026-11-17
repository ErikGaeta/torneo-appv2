import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { SITE } from './config.js';
import { getToken } from './api.js';
import { useSettings } from './settings.jsx';
import MatchStrip from './MatchStrip.jsx';
import PhotoSlider from './PhotoSlider.jsx';
import Home from './pages/Home.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import Matches from './pages/Matches.jsx';
import MatchDetail from './pages/MatchDetail.jsx';
import Stats from './pages/Stats.jsx';
import Login from './admin/Login.jsx';
import Admin from './admin/Admin.jsx';

export default function App() {
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const { settings } = useSettings();
  const name = settings.site_name || SITE.name;
  const hero = settings.hero_image ? { '--hero-image': `url(${JSON.stringify(settings.hero_image)})` } : undefined;
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>{settings.tagline || SITE.tagline}</span>
          <NavLink to="/admin" className="login">{getToken() ? 'Panel de administración' : 'Iniciar sesión'} 👤</NavLink>
        </div>
      </div>

      <div className="brandbar">
        <div className="wrap">
          <Link to="/" className="brand">
            {settings.logo_url && <img src={settings.logo_url} alt="" className="brand-logo" />}
            {name}
          </Link>
        </div>
      </div>

      <div className="navbar">
        <nav>
          <NavLink to="/partidos">Partidos</NavLink>
          <NavLink to="/" end>Clasificación</NavLink>
          <NavLink to="/equipos">Equipos</NavLink>
          <NavLink to="/estadisticas">Estadísticas</NavLink>
        </nav>
      </div>

      {!inAdmin && (
        <header className={`hero${hero ? ' has-image' : ''}`} style={hero}>
          <div className="wrap">
            <MatchStrip />
          </div>
        </header>
      )}

      {!inAdmin && <PhotoSlider />}

      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/partidos" element={<Matches />} />
          <Route path="/partidos/:id" element={<MatchDetail />} />
          <Route path="/equipos" element={<Teams />} />
          <Route path="/equipos/:id" element={<TeamDetail />} />
          <Route path="/estadisticas" element={<Stats />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<p>Página no encontrada.</p>} />
        </Routes>
      </main>
    </>
  );
}