'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkKeyedRateLimit } from '@/lib/rate-limit';
import { sendPilotPartnerApplicationEmail } from '@/lib/email';
import type { Prisma } from '@prisma/client';

const SERVICE_VALUES = [
  'web_development',
  'digital_marketing',
  'seo',
  'accessibility_consulting',
  'other'
] as const;

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

const PartnerApplySchema = z.object({
  pilot_partner_application: z.literal('1'),
  hp_website: z.string().max(200).optional(),
  fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
  companyName: z
    .string()
    .trim()
    .min(2, 'Please enter your agency or company name')
    .max(200),
  email: z.string().trim().email('Please enter a valid work email').max(254),
  phone: z.string().trim().max(40).optional(),
  agencyWebsite: z
    .string()
    .trim()
    .min(1, 'Please enter your agency website')
    .max(500)
    .transform(normalizeWebsiteUrl)
    .pipe(z.string().url('Please enter a valid website URL')),
  clientSites: z.enum(CLIENT_SITE_VALUES, {
    message: 'Please select how many client websites you manage'
  }),
  motivation: z
    .string()
    .trim()
    .min(20, 'Please share a bit more (2–3 sentences)')
    .max(2000, 'Please shorten your answer'),
  services: z
    .array(z.enum(SERVICE_VALUES))
    .min(1, 'Select at least one service you offer')
    .max(SERVICE_VALUES.length)
});

export type PartnerApplyState =
  | { ok: true }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string>;
    };

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

  const rate = checkKeyedRateLimit(`partner-apply:${ip}`, 3, 60 * 60 * 1000);
  if (!rate.success) {
    return {
      ok: false,
      error: 'Too many applications from this network. Please try again in an hour or email info@vexnexa.com.'
    };
  }

  const servicesRaw = formData.getAll('services').filter((v): v is string => typeof v === 'string');

  const raw = {
    pilot_partner_application: formData.get('pilot_partner_application'),
    hp_website: formData.get('hp_website') ?? undefined,
    fullName: formData.get('fullName'),
    companyName: formData.get('companyName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    agencyWebsite: formData.get('agencyWebsite'),
    clientSites: formData.get('clientSites'),
    motivation: formData.get('motivation'),
    services: servicesRaw
  };

  const parsed = PartnerApplySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string' && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return {
      ok: false,
      error: 'Please fix the highlighted fields and try again.',
      fieldErrors
    };
  }

  const d = parsed.data;
  const phoneVal = d.phone?.trim() ? d.phone.trim() : null;

  try {
    await prisma.partnerApplication.create({
      data: {
        fullName: d.fullName,
        companyName: d.companyName,
        email: d.email,
        phone: phoneVal,
        website: d.agencyWebsite,
        clientSites: d.clientSites,
        services: d.services as unknown as Prisma.InputJsonValue,
        motivation: d.motivation,
        status: 'new'
      }
    });
  } catch (e) {
    console.error('Partner application DB error:', e);
    return {
      ok: false,
      error: 'We could not save your application. Please try again or email info@vexnexa.com.'
    };
  }

  try {
    await sendPilotPartnerApplicationEmail({
      fullName: d.fullName,
      companyName: d.companyName,
      email: d.email,
      phone: phoneVal,
      website: d.agencyWebsite,
      clientSites: d.clientSites,
      services: [...d.services],
      motivation: d.motivation
    });
  } catch (e) {
    console.error('Partner application email error:', e);
  }

  return { ok: true };
}
