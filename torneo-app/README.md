# Torneo de fútbol

Node + Express + SQLite (API) · React + Vite (web). Admin protegido con login (un único usuario definido en `.env`).

## Arrancar

```bash
npm run install:all                 # instala todo (Node 22.13 o superior; vale la 26)
cp server/.env.example server/.env  # edita JWT_SECRET, ADMIN_USER, ADMIN_PASSWORD
npm run seed                        # (opcional) datos de ejemplo
npm run dev                         # API :3001 + web :5173
```

- Web: http://localhost:5173 · Admin: http://localhost:5173/admin
- La base de datos se crea sola en `server/data/torneo.db` (copia ese fichero = copia de seguridad).

## Estructura

```
server/src/
  db.js            esquema SQLite (teams, players, matches, match_events)
  auth.js          login + JWT (12 h)
  routes/public.js lectura pública: equipos, jugadores, partidos, clasificación, goleadores, tarjetas
  routes/auth.js   POST /api/auth/login
  routes/admin.js  CRUD protegido (/api/admin/...) — aquí añades nuevas tablas
  seed.js          datos de ejemplo
client/src/
  pages/           vistas públicas
  admin/           login + panel (Resource.jsx = formulario/tabla genérico)
```

## Cómo está pensado

- **Formato abierto**: `matches.stage` = `league` (cuenta para la clasificación) o `knockout`; `round` y `group_name` son etiquetas libres.
- **Estadísticas** (goles, tarjetas) salen de `match_events`; el marcador puede escribirse a mano o recalcularse desde los goles.
- Clasificación: 3 pts victoria, 1 empate; desempate por diferencia de goles y goles a favor.

## Producción

`npm run build && npm start` → Express sirve la API y la web en el mismo puerto. Usa un `JWT_SECRET` largo y, mejor, `ADMIN_PASSWORD_HASH` (`npm --prefix server run hash -- "pass"`), y HTTPS.

## Ideas para siguientes pasos

Tabla de eliminatorias, generador de calendario, fotos de jugadores, minuto a minuto en directo, varios torneos/temporadas.
