/**
 * One-off script: ensure every locale file has the full set of keys
 * the components reference. Missing keys are filled with English text
 * as a fallback (better than showing raw keys to users).
 *
 * Safe to re-run: uses ??= semantics (only writes when missing).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const LOCALES = ['en', 'nl', 'de', 'fr', 'es', 'pt'];

/**
 * English fallback values for every key that may be missing from any locale.
 * Nested paths use dot notation.
 */
const REQUIRED_KEYS = {
  // /sample-report page keys (flat under sampleReport)
  'sampleReport.badge': 'Sample report',
  'sampleReport.title': 'Sample Accessibility',
  'sampleReport.titleHighlight': 'Report',
  'sampleReport.subtitle':
    'See what a comprehensive WCAG 2.2 accessibility report looks like. Download the PDF or view the online demo.',
  'sampleReport.ctaPrimary': 'Start your free scan',
  'sampleReport.ctaSecondary': 'Learn about white-label reports',
  'sampleReport.downloadTitle': 'Download Sample Reports',
  'sampleReport.downloadSubtitle':
    "Get the same quality reports you'll receive with VexNexa, completely free.",
  'sampleReport.downloadBranded': 'Request branded PDF sample',
  'sampleReport.downloadWhiteLabel': 'Request white-label PDF sample',
  'sampleReport.downloadNote':
    "We'll send you a personalized sample report within 1 business day.",
  'sampleReport.reportLabel': 'Accessibility Report',
  'sampleReport.scannedInfo':
    'Scanned: March 24, 2025 · WCAG 2.2 AA · axe-core engine',
  'sampleReport.severity.critical': 'Critical',
  'sampleReport.severity.serious': 'Serious',
  'sampleReport.severity.moderate': 'Moderate',
  'sampleReport.severity.minor': 'Minor',
  'sampleReport.executiveSummary': 'Executive Summary',
  'sampleReport.checkHeading': 'Heading hierarchy correct',
  'sampleReport.checkAria': 'ARIA landmarks present',
  'sampleReport.checkKeyboard': 'Keyboard navigation incomplete',
  'sampleReport.topPriority': 'Top Priority Issues',
  'sampleReport.fullReportTitle': 'Full reports also include',
  'sampleReport.fullReportItems.matrix':
    'WCAG compliance matrix (pass/fail per criterion)',
  'sampleReport.fullReportItems.charts': 'Severity breakdown charts',
  'sampleReport.fullReportItems.complete':
    'Complete issue list with all affected elements',
  'sampleReport.fullReportItems.guidance':
    'Remediation guidance with code examples',
  'sampleReport.fullReportItems.config':
    'Scan configuration and methodology',
  'sampleReport.fullReportItems.eaa': 'EAA 2025 readiness indicator',
  'sampleReport.exportTitle': 'Export with your own branding',
  'sampleReport.exportSubtitle':
    'Business and Enterprise plans include white-label PDF and Word reports. Add your logo, brand colours, and company details to every export.',
  'sampleReport.exportLearnMore': 'Learn about white-label reports',
  'sampleReport.ctaTitle': "See your own site's report",
  'sampleReport.ctaSubtitle':
    'Create a free account and scan your website. Get your own accessibility report in minutes.',
  'sampleReport.ctaButton': 'Start your free scan',
  'sampleReport.ctaPricing': 'View pricing',

  // Features page
  'features.finalCTA.ctaContact': 'Contact us',

  // Footer additions
  'footer.brand.twitter': 'Visit VexNexa on Twitter',
  'footer.product.dashboard': 'Dashboard',
  'footer.solutions.title': 'Solutions',
  'footer.solutions.forAgencies': 'For Agencies',
  'footer.solutions.eaaMonitoring': 'EAA Monitoring',
  'footer.solutions.whiteLabelReports': 'White-Label Reports',
  'footer.solutions.sampleReport': 'Sample Report',
  'footer.solutions.wcagScanner': 'WCAG Scanner',
  'footer.solutions.pilotPartner': 'Pilot Partner Program',
  'footer.solutions.agencyMonitoring': 'Agency Monitoring',
  'footer.support.about': 'About',
  'footer.support.blog': 'Blog',
  'footer.disclaimer': 'Public content scanning • No storage of personal data',
  'footer.brand.newsletter.confirmTitle': 'Confirmation email sent!',
  'footer.brand.newsletter.confirmDescription':
    'Check your inbox and click the link to complete your subscription.',
  'footer.brand.newsletter.successTitle': 'Thanks for subscribing!',
  'footer.brand.newsletter.successDescription':
    "We'll keep you updated with new features and tips.",
  'footer.brand.newsletter.alreadyTitle':
    'This email address is already subscribed',
  'footer.brand.newsletter.alreadyDescription': 'Thanks for your interest!',
  'footer.brand.newsletter.errorTitle': 'Something went wrong',
  'footer.brand.newsletter.errorDescription': 'Please try again later.',

  // Registration wizard step titles + descriptions
  'auth.register.steps.account.title': 'Account',
  'auth.register.steps.account.description': 'Create your login credentials',
  'auth.register.steps.personal.title': 'Personal',
  'auth.register.steps.personal.description': 'Tell us a bit about yourself',
  'auth.register.steps.contact.title': 'Contact',
  'auth.register.steps.contact.description': 'How we can reach you',
  'auth.register.steps.preferences.title': 'Preferences',
  'auth.register.steps.preferences.description': 'Customize your experience',

  // Registration success screen (shown after successful sign-up)
  'auth.register.success.title': 'Account created successfully!',
  'auth.register.success.accountCreated':
    'Please check your email to verify your account.',
  'auth.register.success.checkInbox': 'We sent a confirmation link to:',
  'auth.register.success.spamHint':
    "Don't see it? Check your spam folder, or resend the email below.",
  'auth.register.success.resendEmail': 'Resend confirmation email',
  'auth.register.success.resendCooldown': 'Resend available in {countdown}',
  'auth.register.success.resendSent':
    'Confirmation email sent. Please check your inbox.',
  'auth.register.success.resendError':
    "We couldn't resend the email right now. Please try again in a moment.",
  'auth.register.success.backToLogin': 'Back to sign in',

  // AgencyCTAStrip
  'agencyCTAStrip.badge': 'For agencies',
  'agencyCTAStrip.title': 'Managing multiple client sites?',
  'agencyCTAStrip.subtitle':
    'Use VexNexa for repeatable scans, branded reports, and ongoing accessibility monitoring.',
  'agencyCTAStrip.trust1': 'White-label report workflows',
  'agencyCTAStrip.trust2': 'Ongoing monitoring support',
  'agencyCTAStrip.trust3': 'Clear issue prioritisation',
  'agencyCTAStrip.trust4': 'Built for agencies and EU-facing teams',
  'agencyCTAStrip.ctaPrimary': 'Start your free scan',
  'agencyCTAStrip.ctaSecondary': 'Contact us about agency use',
};

/** Set nested value only if missing. Returns true if it wrote. */
function setIfMissing(obj, dotPath, value) {
  const keys = dotPath.split('.');
  const last = keys.pop();
  let node = obj;
  for (const k of keys) {
    if (node[k] == null || typeof node[k] !== 'object') node[k] = {};
    node = node[k];
  }
  if (node[last] === undefined) {
    node[last] = value;
    return true;
  }
  return false;
}

let totalWritten = 0;
for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const src = fs.readFileSync(filePath, 'utf8');
  const j = JSON.parse(src);
  let written = 0;
  for (const [dotPath, fallback] of Object.entries(REQUIRED_KEYS)) {
    if (setIfMissing(j, dotPath, fallback)) written++;
  }
  if (written > 0) {
    fs.writeFileSync(filePath, JSON.stringify(j, null, 2) + '\n');
    console.log(`${locale}: added ${written} missing keys`);
    totalWritten += written;
  } else {
    console.log(`${locale}: already complete`);
  }
}
console.log(`\nTotal keys added: ${totalWritten}`);
