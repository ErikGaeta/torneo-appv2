import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { token } = await api.post('/auth/login', { username, password });
      setToken(token);
      nav('/admin');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="card narrow">
      <h1>Acceso administrador</h1>
      <label>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary">Entrar</button>
    </form>
  );
}
