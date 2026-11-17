import { useEffect, useState } from 'react';

const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

async function request(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error(data?.error || res.statusText);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b = {}) => request(p, 'POST', b),
  put: (p, b) => request(p, 'PUT', b),
  del: (p) => request(p, 'DELETE'),
};

// Reduce fotos grandes (las del móvil pesan varios MB) antes de subirlas.
async function shrink(file, maxSide) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file; // gif y otros: tal cual
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 1.5e6) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'; // png conserva la transparencia
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
}

// Sube una foto y devuelve su URL (por ejemplo "/uploads/xxxx.jpg").
export async function uploadImage(file, maxSide = 800) {
  let body;
  try {
    body = await shrink(file, maxSide);
  } catch {
    throw new Error('No se pudo leer la imagen');
  }
  const res = await fetch(`${BASE}/admin/upload`, {
    method: 'POST',
    headers: { 'Content-Type': body.type || 'application/octet-stream', Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error(data?.error || 'No se pudo subir la imagen');
  }
  return data.url;
}

// Hook: carga datos de la API. `reload()` vuelve a pedirlos.
export function useFetch(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setError(null);
    api
      .get(path)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [path, n]);

  return { data, error, loading: !data && !error, reload: () => setN((x) => x + 1) };
}

export const fmtShort = (s) =>
  s ? new Date(s).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Por definir';

export const fmtDate = (s) =>
  s ? new Date(s).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Por definir';