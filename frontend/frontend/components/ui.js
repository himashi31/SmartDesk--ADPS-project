'use client';

import Link from 'next/link';
import { label } from '@/lib/format';

export function StatusBadge({ status }) {
  return <span className={`badge status-${(status || '').toLowerCase()}`}>{label(status)}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${(priority || '').toLowerCase()}`}>{label(priority)}</span>;
}

export function RoleBadge({ role }) {
  return <span className={`badge role-${(role || '').toLowerCase()}`}>{label(role)}</span>;
}

export function Alert({ type = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onClose && <button className="alert-close" onClick={onClose} aria-label="Dismiss">×</button>}
    </div>
  );
}

export function Spinner({ text = 'Loading…' }) {
  return <div className="spinner-wrap"><div className="spinner" /> <span>{text}</span></div>;
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function StatCard({ label: l, value, hint, tone, href }) {
  const inner = (
    <>
      <div className="stat-label">{l}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </>
  );
  return href
    ? <Link href={href} className={`stat-card tone-${tone || 'default'}`}>{inner}</Link>
    : <div className={`stat-card tone-${tone || 'default'}`}>{inner}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function FieldError({ error }) {
  return error ? <div className="field-error">{error}</div> : null;
}
