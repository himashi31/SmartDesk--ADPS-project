'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { isAdmin, isStaff, useAuth } from '@/lib/auth';
import { PRIORITIES, STATUSES, formatDate, label, timeAgo } from '@/lib/format';
import { Alert, PriorityBadge, RoleBadge, Spinner, StatusBadge } from '@/components/ui';

function TicketDetails() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const staff = isStaff(user);
  const admin = isAdmin(user);

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [techs, setTechs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState(params.get('created') ? 'Your ticket has been submitted. IT support will pick it up soon.' : '');

  const load = useCallback(async () => {
    try {
      const [t, c, h] = await Promise.all([api.getTicket(id), api.comments(id), api.history(id)]);
      setTicket(t); setComments(c); setHistory(h);
    } catch (e) {
      if (e.status === 404) setNotFound(true); else setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (staff) api.technicians().then(setTechs).catch(() => {});
    api.categories().then(setCategories).catch(() => {});
  }, [staff]);

  async function run(fn, success) {
    setError(''); setMsg('');
    try {
      await fn();
      if (success) setMsg(success);
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  if (notFound) {
    return (
      <div className="card">
        <h2>Ticket not found</h2>
        <p className="muted">It does not exist or you do not have access to it.</p>
        <Link href="/tickets" className="btn btn-ghost">← Back to tickets</Link>
      </div>
    );
  }
  if (!ticket) return error ? <Alert>{error}</Alert> : <Spinner />;

  const isAssignee = ticket.assignedTo?.id === user.id;
  const isOwner = ticket.createdBy?.id === user.id;
  const canManage = admin || (user.role === 'TECHNICIAN' && isAssignee);

  return (
    <>
      <div className="breadcrumb"><Link href="/tickets" className="link">← Tickets</Link></div>
      <div className="page-header">
        <div>
          <div className="muted small">Ticket #{ticket.id}</div>
          <h1>{ticket.title}</h1>
          <div className="badges-row">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.category && <span className="badge">{ticket.category.name}</span>}
          </div>
        </div>
      </div>
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="card">
            <h2 className="card-title">Description</h2>
            <p className="pre">{ticket.description}</p>
            {isOwner && !staff && ticket.status === 'OPEN' && !ticket.assignedTo && (
              <EditTicket ticket={ticket} categories={categories}
                onSave={(data) => run(() => api.updateTicket(ticket.id, data), 'Ticket updated.')} />
            )}
          </section>

          {ticket.resolution && (
            <section className="card resolution">
              <h2 className="card-title">Resolution</h2>
              <p className="pre">{ticket.resolution}</p>
              {ticket.resolvedAt && <div className="muted small">Resolved {formatDate(ticket.resolvedAt)}</div>}
            </section>
          )}

          <Comments
            comments={comments}
            staff={staff}
            closed={ticket.status === 'CLOSED'}
            onAdd={(body, internal) => run(() => api.addComment(ticket.id, body, internal))}
          />
        </div>

        <aside className="detail-side">
          <section className="card">
            <h2 className="card-title">Details</h2>
            <dl className="meta">
              <dt>Reported by</dt><dd>{ticket.createdBy?.fullName}<div className="muted small">{ticket.createdBy?.email}</div></dd>
              <dt>Technician</dt><dd>{ticket.assignedTo?.fullName || <span className="muted">Unassigned</span>}</dd>
              <dt>Created</dt><dd>{formatDate(ticket.createdAt)}</dd>
              <dt>Last update</dt><dd>{formatDate(ticket.updatedAt)}</dd>
            </dl>
          </section>

          {/* ------------- user actions ------------- */}
          {!staff && isOwner && ticket.status === 'RESOLVED' && (
            <section className="card">
              <h2 className="card-title">Is your problem solved?</h2>
              <div className="stack">
                <button className="btn btn-primary" onClick={() => run(() => api.updateStatus(ticket.id, 'CLOSED'), 'Thank you! The ticket is now closed.')}>Yes – close ticket</button>
                <button className="btn btn-ghost" onClick={() => run(() => api.updateStatus(ticket.id, 'OPEN'), 'Ticket re-opened.')}>No – re-open</button>
              </div>
            </section>
          )}
          {!staff && isOwner && ticket.status === 'CLOSED' && (
            <section className="card">
              <button className="btn btn-ghost btn-block" onClick={() => run(() => api.updateStatus(ticket.id, 'OPEN'), 'Ticket re-opened.')}>Re-open ticket</button>
            </section>
          )}

          {/* ------------- technician: take ------------- */}
          {user.role === 'TECHNICIAN' && !ticket.assignedTo && (
            <section className="card">
              <h2 className="card-title">Unassigned</h2>
              <button className="btn btn-primary btn-block" onClick={() => run(() => api.assignTicket(ticket.id, user.id), 'Ticket assigned to you.')}>Take this ticket</button>
            </section>
          )}
          {user.role === 'TECHNICIAN' && ticket.assignedTo && !isAssignee && (
            <section className="card"><p className="muted">This ticket is handled by {ticket.assignedTo.fullName}. You can read it and add comments.</p></section>
          )}

          {/* ------------- admin: assign ------------- */}
          {admin && (
            <section className="card">
              <h2 className="card-title">Assignment</h2>
              <select value={ticket.assignedTo?.id || ''} aria-label="Assign technician"
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  run(() => api.assignTicket(ticket.id, v), v ? 'Technician assigned.' : 'Ticket unassigned.');
                }}>
                <option value="">— Unassigned —</option>
                {techs.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                {ticket.assignedTo && !techs.some((t) => t.id === ticket.assignedTo.id) && (
                  <option value={ticket.assignedTo.id}>{ticket.assignedTo.fullName}</option>
                )}
              </select>
            </section>
          )}

          {/* ------------- staff: status / priority ------------- */}
          {canManage && <ManagePanel ticket={ticket} run={run} />}
          {staff && !canManage && (ticket.assignedTo == null) && (
            <section className="card">
              <h2 className="card-title">Triage priority</h2>
              <select value={ticket.priority} aria-label="Priority"
                onChange={(e) => run(() => api.updatePriority(ticket.id, e.target.value), 'Priority updated.')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
              </select>
            </section>
          )}

          {admin && (
            <section className="card danger-zone">
              <button className="btn btn-danger btn-block" onClick={async () => {
                if (!window.confirm(`Delete ticket #${ticket.id} permanently? This cannot be undone.`)) return;
                try { await api.deleteTicket(ticket.id); router.push('/tickets?scope=all'); } catch (e) { setError(e.message); }
              }}>Delete ticket</button>
            </section>
          )}

          <section className="card">
            <h2 className="card-title">History</h2>
            <ul className="timeline">
              {history.map((h) => (
                <li key={h.id}>
                  <div><strong>{h.actor?.fullName}</strong> <span className="muted">· {label(h.action)}</span></div>
                  {h.details && <div className="small">{h.details}</div>}
                  <div className="muted small" title={formatDate(h.createdAt)}>{timeAgo(h.createdAt)}</div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function ManagePanel({ ticket, run }) {
  const [status, setStatus] = useState(ticket.status);
  const [resolution, setResolution] = useState(ticket.resolution || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => { setStatus(ticket.status); setResolution(ticket.resolution || ''); }, [ticket.status, ticket.resolution]);

  async function save(e) {
    e.preventDefault();
    setLocalError('');
    if (status === 'RESOLVED' && !resolution.trim()) {
      setLocalError('Describe how the problem was solved before resolving.');
      return;
    }
    await run(() => api.updateStatus(ticket.id, status, resolution.trim() || null), `Status changed to ${label(status)}.`);
  }

  return (
    <section className="card">
      <h2 className="card-title">Manage ticket</h2>
      <form onSubmit={save} className="form">
        <label>Priority
          <select value={ticket.priority}
            onChange={(e) => run(() => api.updatePriority(ticket.id, e.target.value), 'Priority updated.')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
        </label>
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        {(status === 'RESOLVED' || status === 'CLOSED') && (
          <label>Resolution
            <textarea rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)}
              placeholder="What was done to solve the problem?" />
          </label>
        )}
        {localError && <div className="field-error">{localError}</div>}
        <button className="btn btn-primary" disabled={status === ticket.status && resolution === (ticket.resolution || '')}>
          Update status
        </button>
      </form>
    </section>
  );
}

function EditTicket({ ticket, categories, onSave }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [categoryId, setCategoryId] = useState(ticket.category?.id || '');

  if (!open) return <button className="btn btn-small btn-ghost mt" onClick={() => setOpen(true)}>Edit ticket</button>;
  return (
    <form className="form mt" onSubmit={async (e) => {
      e.preventDefault();
      const ok = await onSave({ title: title.trim(), description: description.trim(), categoryId: categoryId ? Number(categoryId) : null });
      if (ok) setOpen(false);
    }}>
      <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></label>
      <label>Category
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Description<textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} /></label>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary">Save</button>
      </div>
    </form>
  );
}

function Comments({ comments, staff, closed, onAdd }) {
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const ok = await onAdd(body.trim(), internal);
    setBusy(false);
    if (ok) { setBody(''); setInternal(false); }
  }

  return (
    <section className="card">
      <h2 className="card-title">Conversation</h2>
      {comments.length === 0 && <p className="muted">No comments yet.</p>}
      <ul className="comments">
        {comments.map((c) => (
          <li key={c.id} className={`comment ${c.internal ? 'internal' : ''}`}>
            <div className="comment-head">
              <strong>{c.author?.fullName}</strong>
              <RoleBadge role={c.author?.role} />
              {c.internal && <span className="badge internal-badge">Internal note</span>}
              <span className="muted small" title={formatDate(c.createdAt)}>{timeAgo(c.createdAt)}</span>
            </div>
            <p className="pre">{c.body}</p>
          </li>
        ))}
      </ul>
      {closed ? <p className="muted small">This ticket is closed. Re-open it to continue the conversation.</p> : (
        <form onSubmit={submit} className="form">
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" maxLength={4000} />
          <div className="form-actions between">
            {staff ? (
              <label className="checkbox">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Internal note (hidden from the user)
              </label>
            ) : <span />}
            <button className="btn btn-primary" disabled={busy || !body.trim()}>{busy ? 'Sending…' : 'Add comment'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

export default function TicketDetailsPage() {
  return <Suspense fallback={<Spinner />}><TicketDetails /></Suspense>;
}
