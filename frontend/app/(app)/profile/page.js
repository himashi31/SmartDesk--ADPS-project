'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert, PageHeader, RoleBadge } from '@/components/ui';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user.fullName);
  const [department, setDepartment] = useState(user.department || '');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setError(''); setMsg('');
    if (!fullName.trim()) { setError('Full name is required'); return; }
    try {
      const u = await api.updateProfile({ fullName: fullName.trim(), department: department.trim() });
      refreshUser(u);
      setMsg('Profile saved.');
    } catch (err) { setError(err.message); }
  }

  async function changePassword(e) {
    e.preventDefault();
    setError(''); setMsg('');
    if (pw.next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (pw.next !== pw.confirm) { setError('New passwords do not match'); return; }
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed.');
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <PageHeader title="My profile" subtitle={<>{user.email} · <RoleBadge role={user.role} /></>} />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
      <div className="grid-2 align-start">
        <form className="card form" onSubmit={saveProfile}>
          <h2 className="card-title">Personal details</h2>
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
          <label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} /></label>
          <div className="form-actions"><button className="btn btn-primary">Save</button></div>
        </form>
        <form className="card form" onSubmit={changePassword}>
          <h2 className="card-title">Change password</h2>
          <label>Current password<input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></label>
          <label>New password<input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></label>
          <label>Confirm new password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></label>
          <div className="form-actions"><button className="btn btn-primary">Change password</button></div>
        </form>
      </div>
    </>
  );
}
