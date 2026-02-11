'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
    const { data, count, error } = await supabaseAdmin
      .from('email_templates')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[actions/fetchTemplates]', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: { templates: data ?? [], total: count ?? 0 } };
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
    if (!payload.name?.trim()) {
      return { ok: false, error: 'Template name is required' };
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        name: payload.name,
        subject: payload.subject ?? '',
        html: payload.html ?? '',
        text: payload.text ?? '',
        variables: [],
      })
      .select()
      .single();

    if (error) {
      console.error('[actions/createTemplate]', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
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
    if (!payload.id) {
      return { ok: false, error: 'Template id is required' };
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update({
        name: payload.name,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      console.error('[actions/updateTemplate]', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update template';
    return { ok: false, error: msg };
  }
}

export async function deleteTemplate(
  id: string
): Promise<ActionResult> {
  try {
    if (!id) {
      return { ok: false, error: 'Template id is required' };
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[actions/deleteTemplate]', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete template';
    return { ok: false, error: msg };
  }
}
