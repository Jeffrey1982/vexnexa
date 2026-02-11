import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import CompaniesClient from './CompaniesClient';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach/companies'); }
  return <CompaniesClient />;
}
