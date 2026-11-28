'use client';

import Link from 'next/link';
import { PriorityBadge, StatusBadge, Empty } from './ui';
import { timeAgo } from '@/lib/format';

export default function TicketTable({ tickets, showCreator = false, showAssignee = true, emptyText = 'No tickets found.' }) {
  if (!tickets || tickets.length === 0) return <Empty title={emptyText} />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th className="hide-sm">Category</th>
            {showCreator && <th className="hide-sm">Reported by</th>}
            {showAssignee && <th className="hide-sm">Technician</th>}
            <th className="hide-sm">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className="muted">#{t.id}</td>
              <td><Link href={`/tickets/${t.id}`} className="ticket-link">{t.title}</Link></td>
              <td><StatusBadge status={t.status} /></td>
              <td><PriorityBadge priority={t.priority} /></td>
              <td className="hide-sm">{t.category?.name || <span className="muted">—</span>}</td>
              {showCreator && <td className="hide-sm">{t.createdBy?.fullName}</td>}
              {showAssignee && <td className="hide-sm">{t.assignedTo?.fullName || <span className="muted">Unassigned</span>}</td>}
              <td className="hide-sm muted" title={t.createdAt}>{timeAgo(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
