import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import ImportClient from './ImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach/import'); }
  return <ImportClient />;
}
