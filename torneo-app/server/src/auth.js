import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { JWT_SECRET, ADMIN_USER, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH } = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('Falta JWT_SECRET (mínimo 16 caracteres) en server/.env');
  process.exit(1);
}
if (!ADMIN_USER || (!ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH)) {
  console.error('Faltan ADMIN_USER y ADMIN_PASSWORD (o ADMIN_PASSWORD_HASH) en server/.env');
  process.exit(1);
}

// Solo existe un administrador, definido en .env (no hay registro público).
const passwordHash = ADMIN_PASSWORD_HASH || bcrypt.hashSync(ADMIN_PASSWORD, 10);

export async function checkLogin(username, password) {
  // Siempre se ejecuta bcrypt, exista o no el usuario, para no filtrar información por tiempos.
  const okPass = await bcrypt.compare(String(password ?? ''), passwordHash);
  return okPass && username === ADMIN_USER;
}

export const sign = (username) =>
  jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('rol');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión no válida o caducada' });
  }
}
