import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import ContactsClient from './ContactsClient';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  try { await requireAdmin(); } catch { redirect('/auth/login?redirect=/admin/outreach/contacts'); }
  return <ContactsClient />;
}
