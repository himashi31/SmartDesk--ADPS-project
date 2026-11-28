'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PRIORITIES, label } from '@/lib/format';
import { Alert, FieldError, PageHeader } from '@/components/ui';

const HELP = {
  LOW: 'Minor issue, a workaround exists',
  MEDIUM: 'Affects my work, but I can continue',
  HIGH: 'I cannot work properly',
  URGENT: 'Many people affected / critical system down',
};

export default function CreateTicketPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', categoryId: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.categories().then(setCategories).catch((e) => setError(e.message)); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    const title = form.title.trim();
    const desc = form.description.trim();
    if (title.length < 5) e.title = 'Title must be at least 5 characters';
    if (title.length > 150) e.title = 'Title must be at most 150 characters';
    if (desc.length < 10) e.description = 'Please describe the problem (at least 10 characters)';
    if (desc.length > 4000) e.description = 'Description is too long (max 4000 characters)';
    if (!form.categoryId) e.categoryId = 'Please choose a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const t = await api.createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        categoryId: Number(form.categoryId),
      });
      router.push(`/tickets/${t.id}?created=1`);
    } catch (err) {
      setError(err.message);
      if (err.fields) setErrors(err.fields);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Create Ticket" subtitle="Describe your problem – IT support will pick it up." />
      <form className="card form narrow" onSubmit={onSubmit} noValidate>
        <Alert>{error}</Alert>
        <label>Title
          <input value={form.title} onChange={set('title')} maxLength={150} placeholder="e.g. Cannot connect to the Wi-Fi in Building B" />
          <FieldError error={errors.title} />
        </label>
        <div className="grid-2">
          <label>Category
            <select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError error={errors.categoryId} />
          </label>
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
            </select>
            <span className="hint">{HELP[form.priority]}</span>
          </label>
        </div>
        <label>Description
          <textarea rows={7} value={form.description} onChange={set('description')} maxLength={4000}
            placeholder="What happened? When did it start? Any error message? Which device / room?" />
          <span className="hint right">{form.description.length}/4000</span>
          <FieldError error={errors.description} />
        </label>
        <div className="form-actions">
          <Link href="/tickets" className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit ticket'}</button>
        </div>
      </form>
    </>
  );
}
