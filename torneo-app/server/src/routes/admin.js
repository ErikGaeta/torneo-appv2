import express, { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import db, { getSettings } from '../db.js';
import { requireAdmin } from '../auth.js';
import { UPLOAD_DIR, imageExt } from '../uploads.js';

const r = Router();
r.use(requireAdmin); // TODO lo de este fichero exige token de administrador

// Subida de fotos: el navegador envía el fichero tal cual en el cuerpo de la petición.
r.post('/upload', express.raw({ type: () => true, limit: '8mb' }), (req, res) => {
  const ext = Buffer.isBuffer(req.body) ? imageExt(req.body) : null;
  if (!ext) return res.status(400).json({ error: 'Solo imágenes PNG, JPG, GIF o WEBP (máx. 8 MB)' });
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  res.status(201).json({ url: `/uploads/${name}` });
});

// Ajustes de apariencia. Valor vacío/null = volver al valor por defecto.
const TEXT_SETTINGS = ['site_name', 'tagline', 'logo_url', 'hero_image'];
const COLOR_SETTINGS = ['color_accent', 'color_hero_top', 'color_hero_bottom', 'color_bg', 'color_card'];
r.put('/settings', (req, res) => {
  const body = req.body || {};
  for (const k of COLOR_SETTINGS) {
    if (body[k] && !/^#[0-9a-fA-F]{6}$/.test(body[k])) return res.status(400).json({ error: 'Color no válido' });
  }
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const remove = db.prepare('DELETE FROM settings WHERE key = ?');
  for (const k of [...TEXT_SETTINGS, ...COLOR_SETTINGS]) {
    if (!(k in body)) continue;
    if (body[k] == null || body[k] === '') remove.run(k);
    else upsert.run(k, String(body[k]).slice(0, 300));
  }
  res.json(getSettings());
});

// Solo se copian los campos permitidos; '' pasa a null.
const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k] === '' ? null : obj[k];
  return out;
};

// CRUD genérico. `table` y `fields` salen del código, nunca del usuario.
function crud(table, fields, required = [], validate = () => null) {
  const router = Router();
  const get = (id) => db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);

  router.post('/', (req, res) => {
    const data = pick(req.body || {}, fields);
    for (const f of required) {
      if (data[f] == null) return res.status(400).json({ error: `Falta el campo "${f}"` });
    }
    const err = validate(data);
    if (err) return res.status(400).json({ error: err });
    const cols = Object.keys(data);
    const info = db
      .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => '@' + c).join(', ')})`)
      .run(data);
    res.status(201).json(get(info.lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const current = get(req.params.id);
    if (!current) return res.status(404).json({ error: 'No encontrado' });
    const data = pick(req.body || {}, fields);
    for (const f of required) {
      if (f in data && data[f] == null) return res.status(400).json({ error: `Falta el campo "${f}"` });
    }
    const err = validate({ ...current, ...data });
    if (err) return res.status(400).json({ error: err });
    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: 'Nada que actualizar' });
    db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`).run({
      ...data,
      id: current.id,
    });
    res.json(get(current.id));
  });

  router.delete('/:id', (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  });

  return router;
}

const validScore = (v) => v == null || (Number.isInteger(Number(v)) && Number(v) >= 0);

r.use('/slides', crud('slides', ['image_url', 'caption'], ['image_url']));

r.use('/teams', crud('teams', ['name', 'short_name', 'logo_url', 'group_name'], ['name']));

r.use('/players', crud('players', ['team_id', 'name', 'number', 'position', 'photo_url'], ['team_id', 'name']));

// Recalcula el marcador a partir de los goles registrados (goal + own_goal del rival).
r.post('/matches/:id/recompute-score', (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'No encontrado' });
  const count = (teamId, type) =>
    db.prepare('SELECT COUNT(*) AS c FROM match_events WHERE match_id = ? AND team_id = ? AND type = ?').get(m.id, teamId, type).c;
  const home = count(m.home_team_id, 'goal') + count(m.away_team_id, 'own_goal');
  const away = count(m.away_team_id, 'goal') + count(m.home_team_id, 'own_goal');
  db.prepare('UPDATE matches SET home_score = ?, away_score = ? WHERE id = ?').run(home, away, m.id);
  res.json(db.prepare('SELECT * FROM matches WHERE id = ?').get(m.id));
});

r.use(
  '/matches',
  crud(
    'matches',
    ['home_team_id', 'away_team_id', 'stage', 'round', 'group_name', 'date', 'venue', 'home_score', 'away_score', 'status'],
    ['home_team_id', 'away_team_id'],
    (d) => {
      if (Number(d.home_team_id) === Number(d.away_team_id)) return 'Un equipo no puede jugar contra sí mismo';
      if (!validScore(d.home_score) || !validScore(d.away_score)) return 'Marcador no válido';
      return null;
    }
  )
);

r.use('/events', crud('match_events', ['match_id', 'team_id', 'player_id', 'type', 'minute'], ['match_id', 'team_id', 'type']));

export default r;