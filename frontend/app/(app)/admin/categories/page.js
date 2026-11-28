'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AdminOnly from '@/components/AdminOnly';
import { Alert, PageHeader, Spinner } from '@/components/ui';

function CategoriesInner() {
  const [cats, setCats] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api.categories().then(setCats).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function act(fn, success) {
    setError(''); setMsg('');
    try { await fn(); setMsg(success); await load(); return true; } catch (e) { setError(e.message); return false; }
  }

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Category name is required'); return; }
    if (await act(() => api.createCategory({ name: name.trim(), description: description.trim() }), `Category "${name.trim()}" added.`)) {
      setName(''); setDescription('');
    }
  }

  return (
    <>
      <PageHeader title="Ticket categories" subtitle="Categories help route and report on support requests." />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
      <form className="card form inline-form" onSubmit={add}>
        <input placeholder="Name (e.g. Printers)" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
        <button className="btn btn-primary">Add category</button>
      </form>
      <section className="card">
        {!cats ? <Spinner /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {cats.map((c) => editing?.id === c.id ? (
                  <tr key={c.id}>
                    <td><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></td>
                    <td><input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></td>
                    <td className="right nowrap">
                      <button className="btn btn-small btn-primary" onClick={async () => {
                        if (await act(() => api.updateCategory(c.id, { name: editing.name.trim(), description: (editing.description || '').trim() }), 'Category updated.')) setEditing(null);
                      }}>Save</button>
                      <button className="btn btn-small btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td className="muted">{c.description || '—'}</td>
                    <td className="right nowrap">
                      <button className="btn btn-small btn-ghost" onClick={() => setEditing({ ...c })}>Edit</button>
                      <button className="btn btn-small btn-danger-ghost" onClick={() => {
                        if (window.confirm(`Delete category "${c.name}"? Categories used by tickets cannot be deleted.`)) act(() => api.deleteCategory(c.id), 'Category deleted.');
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default function CategoriesPage() {
  return <AdminOnly><CategoriesInner /></AdminOnly>;
}
