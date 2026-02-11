import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import OutreachDashboard from './OutreachDashboard';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach'); }
  return <OutreachDashboard />;
}
