/**
 * VexNexa Accessibility Assurance - Internationalization Utilities
 *
 * Translation helpers for reports and emails
 * NOTE: Professional translations needed for NL, FR, ES, PT
 */

import enMessages from '@/messages/en.json';
import nlMessages from '@/messages/nl.json';
import frMessages from '@/messages/fr.json';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

// Type-safe message access
type Messages = typeof enMessages;
type AssuranceMessages = Messages['assurance'];

const allMessages = {
  en: enMessages,
  nl: nlMessages,
  fr: frMessages,
  es: esMessages,
  pt: ptMessages,
} as const;

export type SupportedLanguage = keyof typeof allMessages;

/**
 * Get translation for a key path
 * Falls back to English if translation not found
 */
export function getAssuranceTranslation(
  language: string,
  keyPath: string,
  variables?: Record<string, string | number>
): string {
  const lang = (language as SupportedLanguage) || 'en';
  const messages = allMessages[lang] || allMessages.en;

  // Navigate the key path
  const keys = keyPath.split('.');
  let value: any = messages.assurance;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to English
      value = allMessages.en.assurance;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return keyPath; // Return key path if not found
        }
      }
      break;
    }
  }

  // Replace variables
  if (typeof value === 'string' && variables) {
    return Object.entries(variables).reduce((str, [key, val]) => {
      return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, value);
  }

  return typeof value === 'string' ? value : keyPath;
}

/**
 * Get all Assurance translations for a language
 * Falls back to English for missing translations
 */
export function getAssuranceMessages(language: string): AssuranceMessages {
  const lang = (language as SupportedLanguage) || 'en';
  const messages = allMessages[lang];

  // If language has assurance translations, return them
  if (messages?.assurance) {
    return messages.assurance as AssuranceMessages;
  }

  // Fallback to English
  return allMessages.en.assurance;
}

/**
 * Get email subject line
 */
export function getEmailSubject(
  type: 'report' | 'alert' | 'welcome',
  language: string,
  variables?: Record<string, string>
): string {
  const key = `email.${type}Subject`;
  return getAssuranceTranslation(language, key, variables);
}

/**
 * Get report title
 */
export function getReportTitle(language: string): string {
  return getAssuranceTranslation(language, 'report.title');
}

/**
 * Get report disclaimer
 */
export function getReportDisclaimer(language: string): {
  title: string;
  text: string;
  limitation: string;
} {
  return {
    title: getAssuranceTranslation(language, 'report.disclaimer.title'),
    text: getAssuranceTranslation(language, 'report.disclaimer.text'),
    limitation: getAssuranceTranslation(language, 'report.disclaimer.limitation'),
  };
}

/**
 * Get score status label
 */
export function getScoreStatus(score: number, language: string): string {
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 60) status = 'fair';
  else if (score >= 40) status = 'poor';
  else status = 'critical';

  return getAssuranceTranslation(language, `report.scoreStatus.${status}`);
}

/**
 * Get threshold status label
 */
export function getThresholdStatus(
  score: number,
  threshold: number,
  language: string
): string {
  const status = score >= threshold ? 'aboveThreshold' : 'belowThreshold';
  return getAssuranceTranslation(language, `report.thresholdStatus.${status}`);
}

/**
 * Get trend label
 */
export function getTrendLabel(
  trend: 'improving' | 'stable' | 'declining',
  language: string
): string {
  return getAssuranceTranslation(language, `domain.${trend}`);
}

/**
 * Get alert type label
 */
export function getAlertTypeLabel(
  type: 'REGRESSION' | 'SCORE_DROP' | 'CRITICAL_ISSUES' | 'SCAN_FAILED',
  language: string
): string {
  const typeMap = {
    REGRESSION: 'regression',
    SCORE_DROP: 'scoreChange',
    CRITICAL_ISSUES: 'criticalIssues',
    SCAN_FAILED: 'scanFailed',
  };

  return getAssuranceTranslation(language, `alerts.type.${typeMap[type]}`);
}

/**
 * Format date for language
 */
export function formatDate(date: Date, language: string): string {
  const locale = {
    en: 'en-US',
    nl: 'nl-NL',
    fr: 'fr-FR',
    es: 'es-ES',
    pt: 'pt-PT',
  }[language as SupportedLanguage] || 'en-US';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date and time for language
 */
export function formatDateTime(date: Date, language: string): string {
  const locale = {
    en: 'en-US',
    nl: 'nl-NL',
    fr: 'fr-FR',
    es: 'es-ES',
    pt: 'pt-PT',
  }[language as SupportedLanguage] || 'en-US';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Validate language code
 */
export function isValidLanguage(language: string): language is SupportedLanguage {
  return ['en', 'nl', 'fr', 'es', 'pt'].includes(language);
}

/**
 * Get default language
 */
export function getDefaultLanguage(): SupportedLanguage {
  return 'en';
}
