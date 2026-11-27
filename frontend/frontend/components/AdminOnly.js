'use client';

import { useAuth } from '@/lib/auth';
import { Empty } from './ui';

export default function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Empty title="Access denied">This page is only available to administrators.</Empty>;
  return children;
}
