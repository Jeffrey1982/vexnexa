/**
 * Personalization engine for outreach emails.
 * Merges variables into HTML and text templates.
 */

/** HTML-escape a string to prevent injection */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface PersonalizationVars {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  website?: string;
  country?: string;
  email?: string;
  unsubscribe_url?: string;
  [key: string]: string | undefined;
}

const FALLBACKS: Record<string, string> = {
  first_name: 'there',
  last_name: '',
  company_name: '',
  website: '',
  country: '',
  email: '',
};

/**
 * Replace {{variable}} placeholders in a template string.
 * For HTML context, values are HTML-escaped.
 * For text context, values are used as-is.
 */
export function mergeVariables(
  template: string,
  vars: PersonalizationVars,
  isHtml: boolean = false
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
    const raw: string = vars[key] ?? FALLBACKS[key] ?? '';
    return isHtml ? escapeHtml(raw) : raw;
  });
}
