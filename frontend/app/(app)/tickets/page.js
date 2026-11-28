'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { isStaff, useAuth } from '@/lib/auth';
import { PRIORITIES, STATUSES, label } from '@/lib/format';
import TicketTable from '@/components/TicketTable';
import { Alert, PageHeader, Spinner } from '@/components/ui';

const SCOPE_TITLES = {
  all: 'All Tickets',
  assigned: 'Assigned to Me',
  unassigned: 'Unassigned Tickets',
  mine: 'My Tickets',
};

function TicketsInner() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const scope = staff ? params.get('scope') || 'all' : 'mine';
  const status = params.get('status') || '';
  const priority = params.get('priority') || '';
  const categoryId = params.get('categoryId') || '';
  const assignedToId = params.get('assignedToId') || '';
  const q = params.get('q') || '';

  const [tickets, setTickets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [techs, setTechs] = useState([]);
  const [search, setSearch] = useState(q);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    if (staff) api.technicians().then(setTechs).catch(() => {});
  }, [staff]);

  useEffect(() => {
    setTickets(null);
    setError('');
    api.listTickets({ scope, status, priority, categoryId, assignedToId, q })
      .then(setTickets)
      .catch((e) => { setError(e.message); setTickets([]); });
  }, [scope, status, priority, categoryId, assignedToId, q]);

  useEffect(() => setSearch(q), [q]);

  function setParam(key, value) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  function clearFilters() {
    router.push(staff ? `${pathname}?scope=${scope}` : pathname);
  }

  const hasFilters = status || priority || categoryId || assignedToId || q;

  return (
    <>
      <PageHeader
        title={SCOPE_TITLES[scope] || 'Tickets'}
        subtitle={staff ? 'Filter, open and manage support requests.' : 'Everything you have reported to IT support.'}
        actions={<Link href="/tickets/new" className="btn btn-primary">+ Create Ticket</Link>}
      />
      {staff && (
        <div className="tabs">
          {['all', 'assigned', 'unassigned'].map((s) => (
            <button key={s} className={`tab ${scope === s ? 'active' : ''}`} onClick={() => setParam('scope', s)}>
              {SCOPE_TITLES[s]}
            </button>
          ))}
        </div>
      )}
      <div className="filters card">
        <form onSubmit={(e) => { e.preventDefault(); setParam('q', search.trim()); }} className="filter-search">
          <input placeholder="Search title or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost">Search</button>
        </form>
        <select value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={priority} onChange={(e) => setParam('priority', e.target.value)} aria-label="Priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
        </select>
        <select value={categoryId} onChange={(e) => setParam('categoryId', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {staff && scope === 'all' && (
          <select value={assignedToId} onChange={(e) => setParam('assignedToId', e.target.value)} aria-label="Technician">
            <option value="">Any technician</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        )}
        {hasFilters && <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>}
      </div>
      <Alert>{error}</Alert>
      <section className="card">
        {tickets ? (
          <>
            <div className="muted small mb">{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</div>
            <TicketTable tickets={tickets} showCreator={staff} showAssignee={scope !== 'assigned'} />
          </>
        ) : <Spinner />}
      </section>
    </>
  );
}

export default function TicketsPage() {
  return <Suspense fallback={<Spinner />}><TicketsInner /></Suspense>;
}
