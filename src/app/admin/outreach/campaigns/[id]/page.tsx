import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import CampaignDetailClient from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  try { await requireAdmin(); } catch { redirect('/auth/login'); }
  const { id } = await params;
  return <CampaignDetailClient campaignId={id} />;
}
