import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkLogin, sign, requireAdmin } from '../auth.js';

const r = Router();

// Máximo 20 intentos de login cada 15 min por IP.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Prueba más tarde.' },
});

r.post('/login', limiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!(await checkLogin(username, password))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  res.json({ token: sign(username) });
});

r.get('/me', requireAdmin, (req, res) => res.json({ admin: true, user: req.admin.sub }));

export default r;
