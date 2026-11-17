import { Fragment, useState } from 'react';
import { api } from '../api.js';
import ImageField from './ImageField.jsx';

// Formulario + tabla genéricos para crear / editar / borrar registros.
//  path:    '/teams' → escribe en /api/admin/teams
//  rows:    lista a mostrar (viene de la API pública)
//  fields:  [{ key, label, type: 'text'|'number'|'datetime-local'|'select'|'image', options, numeric, required }]
//  columns: [{ label, render(row) }]
//  expand:  (row) => JSX opcional que se despliega bajo la fila
export default function Resource({ path, rows, reload, fields, columns, expand }) {
  const blank = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [values, setValues] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const missing = fields.find((f) => f.type === 'image' && f.required && !values[f.key]);
    if (missing) return setError(`Falta: ${missing.label}`);
    const body = {};
    for (const f of fields) {
      const v = values[f.key];
      body[f.key] = (f.type === 'number' || f.numeric) && v !== '' ? Number(v) : v;
    }
    try {
      if (editId) await api.put(`/admin${path}/${editId}`, body);
      else await api.post(`/admin${path}`, body);
      setValues(blank);
      setEditId(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(row) {
    setEditId(row.id);
    setValues(Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ''])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(row) {
    if (!window.confirm('¿Borrar este registro? No se puede deshacer.')) return;
    try {
      await api.del(`/admin${path}/${row.id}`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="card form">
        {fields.map((f) => f.type === 'image' ? (
          <ImageField key={f.key} label={f.label} value={values[f.key]} onChange={(v) => set(f.key, v)} maxSide={f.maxSide} round={f.round} />
        ) : (
          <label key={f.key}>
            {f.label}
            {f.type === 'select' ? (
              <select value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} required={f.required}>
                <option value="">—</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                required={f.required}
                min={f.type === 'number' ? 0 : undefined}
              />
            )}
          </label>
        ))}
        <div className="actions">
          <button className="primary">{editId ? 'Guardar cambios' : 'Añadir'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setValues(blank); }}>Cancelar</button>}
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="scroll">
        <table>
          <thead>
            <tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th></th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr>
                  {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                  <td className="nowrap">
                    {expand && <button onClick={() => setOpenId(openId === row.id ? null : row.id)}>Eventos</button>}{' '}
                    <button onClick={() => startEdit(row)}>Editar</button>{' '}
                    <button className="danger" onClick={() => remove(row)}>Borrar</button>
                  </td>
                </tr>
                {expand && openId === row.id && (
                  <tr><td colSpan={columns.length + 1}>{expand(row)}</td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="muted">Todavía no hay registros.</p>}
    </>
  );
}