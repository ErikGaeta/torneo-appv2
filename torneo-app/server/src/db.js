// SQLite integrado en Node (node:sqlite, Node 22.13+): no hay que compilar nada.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const file = process.env.DB_PATH || './data/torneo.db';
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Esquema. Se crea solo la primera vez.
// - matches.stage: 'league' (liga/grupos, cuenta para la clasificación) o 'knockout' (eliminatoria).
//   Así el formato del torneo queda abierto: usa group_name / round como etiquetas libres.
// - match_events: goles, goles en propia, tarjetas. Las estadísticas se calculan desde aquí.
db.exec(`
CREATE TABLE IF NOT EXISTS teams (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  short_name TEXT,
  logo_url   TEXT,
  group_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  number   INTEGER,
  position TEXT,
  photo_url TEXT
);

-- Fotos del slider de la portada (se muestran de la más nueva a la más antigua).
CREATE TABLE IF NOT EXISTS slides (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url  TEXT NOT NULL,
  caption    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ajustes de apariencia (nombre, logo, colores...): una fila por ajuste.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage        TEXT NOT NULL DEFAULT 'league' CHECK (stage IN ('league','knockout')),
  round        TEXT,
  group_name   TEXT,
  date         TEXT,
  venue        TEXT,
  home_score   INTEGER,
  away_score   INTEGER,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished')),
  CHECK (home_team_id <> away_team_id)
);

CREATE TABLE IF NOT EXISTS match_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id  INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id   INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  type      TEXT NOT NULL CHECK (type IN ('goal','own_goal','yellow_card','red_card')),
  minute    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_events_player ON match_events(player_id);
`);

// Migración: bases de datos creadas antes de existir la foto de jugador.
const playerCols = db.prepare('PRAGMA table_info(players)').all().map((c) => c.name);
if (!playerCols.includes('photo_url')) db.exec('ALTER TABLE players ADD COLUMN photo_url TEXT');

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export default db;