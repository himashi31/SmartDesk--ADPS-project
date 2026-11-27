'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ROLES, formatDate, label } from '@/lib/format';
import AdminOnly from '@/components/AdminOnly';
import { Alert, FieldError, PageHeader, RoleBadge, Spinner } from '@/components/ui';

const EMPTY = { fullName: '', email: '', password: '', role: 'TECHNICIAN', department: '' };

function UsersInner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const load = useCallback(() => api.users().then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function act(fn, success) {
    setError(''); setMsg('');
    try { await fn(); setMsg(success); await load(); return true; } catch (e) { setError(e.message); return false; }
  }

  async function createUser(e) {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await act(() => api.createUser({ ...form, fullName: form.fullName.trim(), email: form.email.trim() }),
      `Account for ${form.email} created.`);
    if (ok) { setForm(EMPTY); setShowForm(false); }
  }

  const shown = (users || []).filter((u) => !filter || u.role === filter);

  return (
    <>
      <PageHeader title="User management" subtitle="Create technician and administrator accounts, change roles and deactivate users."
        actions={<button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ New user'}</button>} />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>

      {showForm && (
        <form className="card form" onSubmit={createUser} noValidate>
          <h2 className="card-title">New account</h2>
          <div className="grid-2">
            <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /><FieldError error={errors.fullName} /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><FieldError error={errors.email} /></label>
            <label>Temporary password<input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" /><FieldError error={errors.password} /></label>
            <label>Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
              </select>
            </label>
            <label>Department<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
          </div>
          <div className="form-actions"><button className="btn btn-primary">Create account</button></div>
        </form>
      )}

      <div className="tabs">
        {['', ...ROLES].map((r) => (
          <button key={r || 'all'} className={`tab ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>
            {r ? label(r) + 's' : 'All'}
          </button>
        ))}
      </div>

      <section className="card">
        {!users ? <Spinner /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th className="hide-sm">Email</th><th>Role</th><th>Status</th><th className="hide-sm">Joined</th><th></th></tr></thead>
              <tbody>
                {shown.map((u) => {
                  const self = u.id === me.id;
                  return (
                    <tr key={u.id} className={u.active ? '' : 'inactive'}>
                      <td>{u.fullName}{self && <span className="muted small"> (you)</span>}<div className="muted small">{u.department}</div></td>
                      <td className="hide-sm">{u.email}</td>
                      <td>
                        {self ? <RoleBadge role={u.role} /> : (
                          <select value={u.role} aria-label={`Role of ${u.fullName}`}
                            onChange={(e) => act(() => api.updateUser(u.id, { role: e.target.value }), `${u.fullName} is now ${label(e.target.value)}.`)}>
                            {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
                          </select>
                        )}
                      </td>
                      <td>{u.active ? <span className="badge status-resolved">Active</span> : <span className="badge status-closed">Inactive</span>}</td>
                      <td className="hide-sm muted small">{formatDate(u.createdAt)}</td>
                      <td className="right nowrap">
                        {!self && (
                          <>
                            <button className="btn btn-small btn-ghost" onClick={() => act(() => api.updateUser(u.id, { active: !u.active }), `${u.fullName} ${u.active ? 'deactivated' : 'activated'}.`)}>
                              {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-small btn-ghost" onClick={() => {
                              const pw = window.prompt(`New password for ${u.fullName} (min. 8 characters):`);
                              if (pw) act(() => api.resetPassword(u.id, pw), 'Password reset.');
                            }}>Reset password</button>
                            <button className="btn btn-small btn-danger-ghost" onClick={() => {
                              if (window.confirm(`Delete ${u.fullName}? This cannot be undone. Users with tickets can only be deactivated.`)) {
                                act(() => api.deleteUser(u.id), 'User deleted.');
                              }
                            }}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default function UsersPage() {
  return <AdminOnly><UsersInner /></AdminOnly>;
}
