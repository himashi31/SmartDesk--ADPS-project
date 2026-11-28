'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { label } from '@/lib/format';
import TicketTable from '@/components/TicketTable';
import { Alert, PageHeader, Spinner, StatCard } from '@/components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'TECHNICIAN') return <TechnicianDashboard user={user} />;
  return <UserDashboard user={user} />;
}

const ACTIVE = ['OPEN', 'IN_PROGRESS', 'ON_HOLD'];

/* ---------------------------------------------------------------- USER */
function UserDashboard({ user }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTickets({ scope: 'mine' }).then(setTickets).catch((e) => setError(e.message));
  }, []);

  const count = (pred) => (tickets ? tickets.filter(pred).length : null);
  return (
    <>
      <PageHeader
        title={`Hello, ${user.fullName.split(' ')[0]}`}
        subtitle="Report a problem and follow its progress here."
        actions={<Link href="/tickets/new" className="btn btn-primary">+ Create Ticket</Link>}
      />
      <Alert>{error}</Alert>
      <div className="stats-grid">
        <StatCard label="Open" value={count((t) => t.status === 'OPEN')} tone="blue" href="/tickets?status=OPEN" />
        <StatCard label="In progress / on hold" value={count((t) => t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD')} tone="amber" />
        <StatCard label="Resolved" value={count((t) => t.status === 'RESOLVED')} tone="green" hint="Confirm and close them" href="/tickets?status=RESOLVED" />
        <StatCard label="Total requests" value={tickets?.length} />
      </div>
      <section className="card">
        <div className="card-head">
          <h2>Recent tickets</h2>
          <Link href="/tickets" className="link">View all →</Link>
        </div>
        {tickets ? <TicketTable tickets={tickets.slice(0, 6)} emptyText="You have not reported any problems yet." /> : <Spinner />}
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- TECHNICIAN */
function TechnicianDashboard({ user }) {
  const [assigned, setAssigned] = useState(null);
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    Promise.all([api.listTickets({ scope: 'assigned' }), api.listTickets({ scope: 'unassigned' })])
      .then(([a, u]) => { setAssigned(a); setQueue(u.filter((t) => ACTIVE.includes(t.status))); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function take(id) {
    setError(''); setMsg('');
    try {
      await api.assignTicket(id, user.id);
      setMsg(`Ticket #${id} assigned to you.`);
      load();
    } catch (e) { setError(e.message); }
  }

  const active = assigned?.filter((t) => ACTIVE.includes(t.status));
  return (
    <>
      <PageHeader title="Technician dashboard" subtitle="Your queue and new incoming requests." />
      <Alert>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
      <div className="stats-grid">
        <StatCard label="My active tickets" value={active?.length} tone="blue" href="/tickets?scope=assigned" />
        <StatCard label="Urgent / high (mine)" value={active?.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length} tone="red" />
        <StatCard label="Unassigned queue" value={queue?.length} tone="amber" href="/tickets?scope=unassigned" />
        <StatCard label="Resolved by me" value={assigned?.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length} tone="green" />
      </div>
      <section className="card">
        <div className="card-head"><h2>My active tickets</h2><Link href="/tickets?scope=assigned" className="link">View all →</Link></div>
        {active ? <TicketTable tickets={active} showCreator showAssignee={false} emptyText="Nothing assigned to you right now." /> : <Spinner />}
      </section>
      <section className="card">
        <div className="card-head"><h2>Unassigned queue</h2></div>
        {queue ? (
          queue.length === 0 ? <p className="muted">The queue is empty. 🎉</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Title</th><th>Priority</th><th className="hide-sm">Category</th><th className="hide-sm">Reported by</th><th></th></tr></thead>
                <tbody>
                  {queue.map((t) => (
                    <tr key={t.id}>
                      <td className="muted">#{t.id}</td>
                      <td><Link href={`/tickets/${t.id}`} className="ticket-link">{t.title}</Link></td>
                      <td><span className={`badge priority-${t.priority.toLowerCase()}`}>{label(t.priority)}</span></td>
                      <td className="hide-sm">{t.category?.name || '—'}</td>
                      <td className="hide-sm">{t.createdBy?.fullName}</td>
                      <td className="right"><button className="btn btn-small btn-primary" onClick={() => take(t.id)}>Take ticket</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : <Spinner />}
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- ADMIN */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState(null);
  const [techs, setTechs] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    Promise.all([api.stats(), api.listTickets({ scope: 'unassigned' }), api.technicians()])
      .then(([s, q, t]) => { setStats(s); setQueue(q.filter((x) => ACTIVE.includes(x.status))); setTechs(t); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function assign(ticketId, techId) {
    if (!techId) return;
    setError(''); setMsg('');
    try {
      const t = await api.assignTicket(ticketId, Number(techId));
      setMsg(`Ticket #${ticketId} assigned to ${t.assignedTo.fullName}.`);
      load();
    } catch (e) { setError(e.message); }
  }

  if (!stats && !error) return <Spinner />;
  return (
    <>
      <PageHeader title="Administrator dashboard" subtitle="Support activity, workload and resolution statistics." />
      <Alert>{error}</Alert>
      <Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
      {stats && (
        <>
          <div className="stats-grid">
            <StatCard label="Total tickets" value={stats.totalTickets} href="/tickets?scope=all" />
            <StatCard label="Open (not resolved)" value={stats.openTickets} tone="blue" />
            <StatCard label="Unassigned" value={stats.unassignedTickets} tone="amber" href="/tickets?scope=unassigned" />
            <StatCard label="Resolved / closed" value={stats.resolvedTickets} tone="green" />
            <StatCard label="Avg. resolution time" value={stats.averageResolutionHours != null ? `${stats.averageResolutionHours} h` : '—'} />
            <StatCard label="Users / technicians" value={`${stats.totalUsers} / ${stats.totalTechnicians}`} href="/admin/users" />
          </div>
          <div className="grid-3">
            <Breakdown title="By status" data={stats.byStatus} prefix="status" />
            <Breakdown title="By priority" data={stats.byPriority} prefix="priority" />
            <Breakdown title="By category" data={stats.byCategory} />
          </div>
          <section className="card">
            <div className="card-head"><h2>Technician workload</h2></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Technician</th><th>Active tickets</th><th>Total assigned</th><th className="hide-sm">Load</th></tr></thead>
                <tbody>
                  {stats.technicianWorkload.map((w) => (
                    <tr key={w.technicianId}>
                      <td>{w.fullName}</td>
                      <td>{w.activeTickets}</td>
                      <td>{w.totalAssigned}</td>
                      <td className="hide-sm"><div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, w.activeTickets * 20)}%` }} /></div></td>
                    </tr>
                  ))}
                  {stats.technicianWorkload.length === 0 && <tr><td colSpan={4} className="muted">No technicians yet – add them in Users.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <section className="card">
        <div className="card-head"><h2>Unassigned tickets</h2></div>
        {!queue ? <Spinner /> : queue.length === 0 ? <p className="muted">All tickets are assigned.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Title</th><th>Priority</th><th className="hide-sm">Reported by</th><th>Assign to</th></tr></thead>
              <tbody>
                {queue.map((t) => (
                  <tr key={t.id}>
                    <td className="muted">#{t.id}</td>
                    <td><Link href={`/tickets/${t.id}`} className="ticket-link">{t.title}</Link></td>
                    <td><span className={`badge priority-${t.priority.toLowerCase()}`}>{label(t.priority)}</span></td>
                    <td className="hide-sm">{t.createdBy?.fullName}</td>
                    <td>
                      <select defaultValue="" onChange={(e) => assign(t.id, e.target.value)} aria-label={`Assign ticket ${t.id}`}>
                        <option value="" disabled>Choose technician…</option>
                        {techs.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>
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

function Breakdown({ title, data, prefix }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <div className="breakdown">
        {entries.map(([k, v]) => (
          <div key={k} className="breakdown-row">
            <span className="breakdown-label">{prefix ? label(k) : k}</span>
            <div className="bar"><div className={`bar-fill ${prefix ? `${prefix}-${k.toLowerCase()}` : ''}`} style={{ width: `${(v / max) * 100}%` }} /></div>
            <span className="breakdown-value">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
