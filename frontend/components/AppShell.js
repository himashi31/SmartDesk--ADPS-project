'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { RoleBadge, Spinner } from './ui';

const NAV = {
  USER: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tickets/new', label: 'Create Ticket' },
    { href: '/tickets', label: 'My Tickets' },
  ],
  TECHNICIAN: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tickets?scope=assigned', label: 'Assigned to Me' },
    { href: '/tickets?scope=unassigned', label: 'Unassigned Queue' },
    { href: '/tickets?scope=all', label: 'All Tickets' },
    { href: '/tickets/new', label: 'Create Ticket' },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tickets?scope=all', label: 'All Tickets' },
    { href: '/tickets?scope=unassigned', label: 'Unassigned' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/categories', label: 'Categories' },
  ],
};

/** Layout for every logged-in page: sidebar + top bar. Redirects to /login when not authenticated. */
export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) return <div className="center-page"><Spinner /></div>;

  const items = NAV[user.role] || NAV.USER;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">SD</span>
          <span>SmartDesk</span>
        </Link>
        <Suspense fallback={<nav />}>
        <nav>
          {items.map((it) => (
            <NavLink key={it.href} href={it.href} pathname={pathname}>{it.label}</NavLink>
          ))}
          <NavLink href="/profile" pathname={pathname}>My Profile</NavLink>
        </nav>
        </Suspense>
        <div className="sidebar-foot muted">IT Help Desk &amp; Ticket Management</div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">☰</button>
          <div className="topbar-user">
            <div className="user-meta">
              <strong>{user.fullName}</strong>
              <RoleBadge role={user.role} />
            </div>
            <button className="btn btn-ghost" onClick={logout}>Log out</button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, pathname, children }) {
  const searchParams = useSearchParams();
  const [path, query] = href.split('?');
  const currentScope = searchParams.get('scope');
  const linkScope = query ? new URLSearchParams(query).get('scope') : null;
  const active = pathname === path && (path !== '/tickets' || currentScope === linkScope);
  return (
    <Link href={href} className={`nav-link ${active ? 'active' : ''}`}>
      {children}
    </Link>
  );
}
