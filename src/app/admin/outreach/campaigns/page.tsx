import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import CampaignsClient from './CampaignsClient';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach/campaigns'); }
  return <CampaignsClient />;
}
