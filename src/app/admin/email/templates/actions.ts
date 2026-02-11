'use server';

import { adminFetch } from '@/lib/adminFetch';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: unknown;
  created_at: string;
  updated_at: string;
}

interface TemplatesResponse {
  templates: EmailTemplate[];
  total: number;
}

interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function fetchTemplates(
  limit: number,
  offset: number
): Promise<ActionResult<TemplatesResponse>> {
  try {
    const data = await adminFetch<TemplatesResponse>(
      `/api/admin/email/templates?limit=${limit}&offset=${offset}`
    );
    return { ok: true, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch templates';
    return { ok: false, error: msg };
  }
}

export async function createTemplate(payload: {
  name: string;
  subject: string;
  html: string;
  text: string;
}): Promise<ActionResult<EmailTemplate>> {
  try {
    const data = await adminFetch<{ template: EmailTemplate }>(
      '/api/admin/email/templates',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return { ok: true, data: data.template };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create template';
    return { ok: false, error: msg };
  }
}

export async function updateTemplate(payload: {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}): Promise<ActionResult<EmailTemplate>> {
  try {
    const data = await adminFetch<{ template: EmailTemplate }>(
      '/api/admin/email/templates',
      { method: 'PUT', body: JSON.stringify(payload) }
    );
    return { ok: true, data: data.template };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update template';
    return { ok: false, error: msg };
  }
}

export async function deleteTemplate(
  id: string
): Promise<ActionResult> {
  try {
    await adminFetch<{ success: boolean }>(
      `/api/admin/email/templates?id=${id}`,
      { method: 'DELETE' }
    );
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete template';
    return { ok: false, error: msg };
  }
}
