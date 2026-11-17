import { Router } from 'express';
import db, { getSettings } from '../db.js';

const r = Router();

// Nombre, logo, colores... (los edita el administrador en la pestaña "Apariencia").
r.get('/settings', (req, res) => res.json(getSettings()));

// Fotos del slider: las 15 más recientes.
r.get('/slides', (req, res) => {
  res.json(db.prepare('SELECT * FROM slides ORDER BY id DESC LIMIT 15').all());
});

const MATCH_SELECT = `
  SELECT m.*, h.name AS home_name, h.short_name AS home_short, h.logo_url AS home_logo,
         a.name AS away_name, a.short_name AS away_short, a.logo_url AS away_logo
  FROM matches m
  JOIN teams h ON h.id = m.home_team_id
  JOIN teams a ON a.id = m.away_team_id`;

r.get('/teams', (req, res) => {
  res.json(db.prepare('SELECT * FROM teams ORDER BY name').all());
});

r.get('/teams/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });
  const players = db
    .prepare('SELECT * FROM players WHERE team_id = ? ORDER BY number IS NULL, number, name')
    .all(team.id);
  res.json({ ...team, players });
});

r.get('/players', (req, res) => {
  const where = req.query.team_id ? 'WHERE p.team_id = ?' : '';
  const args = req.query.team_id ? [req.query.team_id] : [];
  res.json(
    db
      .prepare(
        `SELECT p.*, t.name AS team_name FROM players p JOIN teams t ON t.id = p.team_id
         ${where} ORDER BY t.name, p.number IS NULL, p.number, p.name`
      )
      .all(...args)
  );
});

r.get('/matches', (req, res) => {
  const conds = [];
  const args = [];
  if (req.query.status) { conds.push('m.status = ?'); args.push(req.query.status); }
  if (req.query.stage) { conds.push('m.stage = ?'); args.push(req.query.stage); }
  if (req.query.team_id) {
    conds.push('(m.home_team_id = ? OR m.away_team_id = ?)');
    args.push(req.query.team_id, req.query.team_id);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  res.json(db.prepare(`${MATCH_SELECT} ${where} ORDER BY m.date IS NULL, m.date, m.id`).all(...args));
});

r.get('/matches/:id', (req, res) => {
  const match = db.prepare(`${MATCH_SELECT} WHERE m.id = ?`).get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
  const events = db
    .prepare(
      `SELECT e.*, p.name AS player_name, t.name AS team_name
       FROM match_events e
       LEFT JOIN players p ON p.id = e.player_id
       JOIN teams t ON t.id = e.team_id
       WHERE e.match_id = ? ORDER BY e.minute IS NULL, e.minute, e.id`
    )
    .all(match.id);
  res.json({ ...match, events });
});

// Clasificación: 3 puntos victoria, 1 empate. Solo partidos de liga/grupos terminados.
r.get('/standings', (req, res) => {
  const teams = db.prepare('SELECT id, name, short_name, group_name, logo_url FROM teams').all();
  const rows = new Map(
    teams.map((t) => [
      t.id,
      { team_id: t.id, name: t.name, group_name: t.group_name, logo_url: t.logo_url, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
    ])
  );
  const matches = db
    .prepare(
      `SELECT * FROM matches WHERE status = 'finished' AND stage = 'league'
       AND home_score IS NOT NULL AND away_score IS NOT NULL`
    )
    .all();

  for (const m of matches) {
    const h = rows.get(m.home_team_id);
    const a = rows.get(m.away_team_id);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.won++; a.lost++; h.points += 3; }
    else if (m.home_score < m.away_score) { a.won++; h.lost++; a.points += 3; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }

  let table = [...rows.values()].map((t) => ({ ...t, gd: t.gf - t.ga }));
  if (req.query.group) table = table.filter((t) => t.group_name === req.query.group);
  table.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name));
  res.json(table);
});

r.get('/stats/scorers', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT p.id AS player_id, p.name, p.photo_url, t.name AS team_name, COUNT(*) AS goals
         FROM match_events e
         JOIN players p ON p.id = e.player_id
         JOIN teams t ON t.id = p.team_id
         WHERE e.type = 'goal'
         GROUP BY p.id ORDER BY goals DESC, p.name LIMIT 50`
      )
      .all()
  );
});

r.get('/stats/cards', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT p.id AS player_id, p.name, p.photo_url, t.name AS team_name,
                SUM(e.type = 'yellow_card') AS yellow, SUM(e.type = 'red_card') AS red
         FROM match_events e
         JOIN players p ON p.id = e.player_id
         JOIN teams t ON t.id = p.team_id
         WHERE e.type IN ('yellow_card','red_card')
         GROUP BY p.id ORDER BY red DESC, yellow DESC, p.name LIMIT 50`
      )
      .all()
  );
});

export default r;