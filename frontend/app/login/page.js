'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui';

const DEMO = [
  ['User', 'user1@smartdesk.local'],
  ['Technician', 'tech1@smartdesk.local'],
  ['Admin', 'admin@smartdesk.local'],
];

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('expired') ? 'Your session has expired. Please log in again.' : '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
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
            <h1>SmartDesk</h1>
            <p className="muted">IT Help Desk &amp; Ticket Management</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="form" noValidate>
          <Alert onClose={error ? () => setError('') : null}>{error}</Alert>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        </form>
        <p className="auth-switch">No account yet? <Link href="/register">Create one</Link></p>
        <div className="demo-box">
          <div className="demo-title">Demo accounts (password <code>Password123!</code>)</div>
          <div className="demo-buttons">
            {DEMO.map(([role, mail]) => (
              <button key={mail} type="button" className="btn btn-small btn-ghost"
                onClick={() => { setEmail(mail); setPassword('Password123!'); }}>
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
