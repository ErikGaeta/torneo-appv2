import fs from 'node:fs';
import path from 'node:path';

// Las fotos subidas se guardan aquí (junto a la base de datos, en server/data/uploads).
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Detecta el tipo real por los primeros bytes: no nos fiamos del nombre ni del Content-Type.
// SVG queda fuera a propósito (puede llevar scripts).
export function imageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}