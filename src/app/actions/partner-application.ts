'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkKeyedRateLimitDistributed } from '@/lib/rate-limit';
import { sendPilotPartnerApplicationEmail, sendPilotPartnerConfirmationEmail } from '@/lib/email';
import { getMaxPilotSpots } from '@/lib/pilot-partner';
import type { Prisma } from '@prisma/client';

const CLIENT_SITE_VALUES = ['1-5', '6-20', '21-50', '50+'] as const;

function normalizeWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function getClientIp(h: Headers): string {
  const forwarded = h.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown';
}

// Kept deliberately short: agency name, website, email, client sites.
// Everything else is asked during the review call, not on the form.
const PartnerApplySchema = z.object({
  pilot_partner_application: z.literal('1'),
  hp_website: z.string().max(200).optional(),
  companyName: z
    .string()
    .trim()
    .min(2, 'Please enter your agency or company name')
    .max(200),
  email: z.string().trim().email('Please enter a valid work email').max(254),
  agencyWebsite: z
    .string()
    .trim()
    .min(1, 'Please enter your agency website')
    .max(500)
    .transform(normalizeWebsiteUrl)
    .pipe(z.string().url('Please enter a valid website URL')),
  clientSites: z.enum(CLIENT_SITE_VALUES, {
    message: 'Please select how many client websites you manage'
  })
});

/**
 * Errors are returned as key names within the `partnerApply.errors` i18n
 * namespace so the client renders them in the visitor's language.
 */
export type PartnerApplyState =
  | { ok: true }
  | {
      ok: false;
      errorKey?: string;
      /** Field name → error key within partnerApply.errors */
      fieldErrors?: Record<string, string>;
      /** True when capacity (approved partners) has been reached */
      programFull?: boolean;
    };

function assertResendDelivered(result: unknown, label: string) {
  if (!result || typeof result !== 'object') {
    throw new Error(`${label} was not sent: Resend returned no result`);
  }

  const response = result as { data?: { id?: string | null } | null; error?: unknown };
  if (response.error) {
    throw new Error(`${label} was not sent: ${JSON.stringify(response.error)}`);
  }

  if (!response.data?.id) {
    throw new Error(`${label} was not sent: Resend returned no message id`);
  }
}

export async function submitPartnerApplication(
  _prev: PartnerApplyState,
  formData: FormData
): Promise<PartnerApplyState> {
  const h = await headers();
  const ip = getClientIp(h);

  const hp = (formData.get('hp_website') as string | null) ?? '';
  if (hp.trim().length > 0) {
    return { ok: true };
  }

  const rate = await checkKeyedRateLimitDistributed(`partner-apply:${ip}`, 3, 60 * 60 * 1000);
  if (!rate.success) {
    return { ok: false, errorKey: 'rateLimited' };
  }

  const raw = {
    pilot_partner_application: formData.get('pilot_partner_application'),
    hp_website: formData.get('hp_website') ?? undefined,
    companyName: formData.get('companyName'),
    email: formData.get('email'),
    agencyWebsite: formData.get('agencyWebsite'),
    clientSites: formData.get('clientSites')
  };

  const parsed = PartnerApplySchema.safeParse(raw);
  if (!parsed.success) {
    // Field name doubles as the error key in partnerApply.errors — every
    // field has exactly one user-facing validation message.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string' && !fieldErrors[path]) {
        fieldErrors[path] = path;
      }
    }
    return { ok: false, errorKey: 'fixFields', fieldErrors };
  }

  const d = parsed.data;

  const maxSpots = getMaxPilotSpots();
  let approvedCount = 0;
  try {
    approvedCount = await prisma.partnerApplication.count({
      where: { status: 'APPROVED' },
    });
  } catch (e) {
    console.error('Partner application capacity check failed:', e);
  }
  if (approvedCount >= maxSpots) {
    return { ok: false, errorKey: 'programFull', programFull: true };
  }

  try {
    // The shortened form no longer collects these; the DB columns are
    // required, so store explicit empty values until a migration drops them.
    await prisma.partnerApplication.create({
      data: {
        fullName: d.companyName,
        companyName: d.companyName,
        email: d.email,
        phone: null,
        website: d.agencyWebsite,
        clientSites: d.clientSites,
        services: [] as unknown as Prisma.InputJsonValue,
        motivation: '',
        status: 'PENDING',
      },
    });
  } catch (e) {
    console.error('Partner application DB error:', e);
    return { ok: false, errorKey: 'saveFailed' };
  }

  let adminEmailError: unknown = null;
  let confirmationEmailError: unknown = null;

  try {
    const adminEmail = await sendPilotPartnerApplicationEmail({
      fullName: d.companyName,
      companyName: d.companyName,
      email: d.email,
      phone: null,
      website: d.agencyWebsite,
      clientSites: d.clientSites,
      services: [],
      motivation: ''
    });

    assertResendDelivered(adminEmail, 'Pilot partner admin notification');
  } catch (e) {
    console.error('Partner application email error:', e);
    adminEmailError = e;
  }

  try {
    const confirmationEmail = await sendPilotPartnerConfirmationEmail({
      email: d.email,
      companyName: d.companyName
    });

    assertResendDelivered(confirmationEmail, 'Pilot partner confirmation email');
  } catch (e) {
    console.error('Partner application confirmation email error:', e);
    confirmationEmailError = e;
  }

  if (confirmationEmailError) {
    return { ok: false, errorKey: 'confirmationFailed' };
  }

  if (adminEmailError) {
    return { ok: false, errorKey: 'adminNotifyFailed' };
  }

  revalidatePath('/partner-apply');
  return { ok: true };
}
