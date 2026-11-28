'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Alert, FieldError } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', department: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register({
        fullName: form.fullName.trim(), email: form.email.trim(),
        department: form.department.trim(), password: form.password,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.fields) setErrors(err.fields);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark lg">SD</span>
          <div>
            <h1>Create account</h1>
            <p className="muted">Report and track your IT issues</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="form" noValidate>
          <Alert>{error}</Alert>
          <label>Full name
            <input value={form.fullName} onChange={set('fullName')} autoComplete="name" />
            <FieldError error={errors.fullName} />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            <FieldError error={errors.email} />
          </label>
          <label>Department / study programme <span className="muted">(optional)</span>
            <input value={form.department} onChange={set('department')} />
          </label>
          <div className="grid-2">
            <label>Password
              <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
              <FieldError error={errors.password} />
            </label>
            <label>Confirm password
              <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              <FieldError error={errors.confirm} />
            </label>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already registered? <Link href="/login">Log in</Link></p>
      </div>
    </div>
  );
}
