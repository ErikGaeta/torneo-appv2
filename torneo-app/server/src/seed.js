// Datos de ejemplo para probar. Solo se ejecuta si la base de datos está vacía: npm run seed
import db from './db.js';

if (db.prepare('SELECT COUNT(*) AS c FROM teams').get().c > 0) {
  console.log('Ya hay datos; no se hace nada.');
  process.exit(0);
}

const teamNames = ['Tigres', 'Águilas', 'Lobos', 'Halcones'];
const insTeam = db.prepare('INSERT INTO teams (name, short_name, group_name) VALUES (?, ?, ?)');
const insPlayer = db.prepare('INSERT INTO players (team_id, name, number, position) VALUES (?, ?, ?, ?)');
const insMatch = db.prepare(
  `INSERT INTO matches (home_team_id, away_team_id, stage, round, group_name, date, home_score, away_score, status)
   VALUES (?, ?, 'league', ?, 'A', ?, ?, ?, ?)`
);
const insEvent = db.prepare('INSERT INTO match_events (match_id, team_id, player_id, type, minute) VALUES (?, ?, ?, ?, ?)');

db.exec('BEGIN');
try {
  const teams = teamNames.map((n) => {
    const id = insTeam.run(n, n.slice(0, 3).toUpperCase(), 'A').lastInsertRowid;
    const players = [1, 2, 3, 4, 5].map(
      (k) => insPlayer.run(id, `${n} Jugador ${k}`, k, k === 1 ? 'Portero' : 'Campo').lastInsertRowid
    );
    return { id, players };
  });

  const results = [[2, 1], [0, 0], [1, 3], [2, 2]]; // los 4 primeros, terminados
  let i = 0;
  for (let a = 0; a < teams.length; a++) {
    for (let b = a + 1; b < teams.length; b++, i++) {
      const finished = i < results.length;
      const [hs, as] = finished ? results[i] : [null, null];
      const date = `2026-11-${String(i + 1).padStart(2, '0')}T18:00`;
      const mid = insMatch.run(teams[a].id, teams[b].id, `Jornada ${Math.floor(i / 2) + 1}`, date, hs, as, finished ? 'finished' : 'scheduled').lastInsertRowid;
      if (!finished) continue;
      for (let g = 0; g < hs; g++) insEvent.run(mid, teams[a].id, teams[a].players[(g + 1) % 5], 'goal', 10 + g * 20);
      for (let g = 0; g < as; g++) insEvent.run(mid, teams[b].id, teams[b].players[(g + 2) % 5], 'goal', 15 + g * 20);
      insEvent.run(mid, teams[a].id, teams[a].players[3], 'yellow_card', 55);
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log('Datos de ejemplo creados.');
