import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import NewCampaignClient from './NewCampaignClient';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach/campaigns/new'); }
  return <NewCampaignClient />;
}
