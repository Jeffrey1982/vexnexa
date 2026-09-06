import { describe, expect, it } from 'vitest';
import { getAssuranceAlertEmailTemplate, getAssuranceReportEmailTemplate, getAssuranceWelcomeTemplate,
  getEmailVerificationTemplate, getNewsletterConfirmationTemplate, getPasswordResetTemplate, getPlainTextVersion,
  getTeamInvitationTemplate, getWelcomeTemplate } from '../email-templates';
const address = 'recipient@example.com';
const actionUrl = 'https://example.com/action?token=opaque';

describe('transactional email templates', () => {
  it.each([
    [getEmailVerificationTemplate, 'Verify email address'], [getPasswordResetTemplate, 'Reset password'],
    [getNewsletterConfirmationTemplate, 'Confirm subscription'],
  ] as const)('provides the intended action and recipient in a complete accessible email', (render, label) => {
    const html = render(address, actionUrl);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('alt="VexNexa"');
    expect(html).toContain(address);
    expect(html).toContain(`href="${actionUrl}"`);
    expect(html).toContain(label);
    expect(html).toContain('does not constitute a formal WCAG audit or legal compliance certification');
  });
  it('does not generate a broken action button when no action URL is present', () => {
    const html = getEmailVerificationTemplate(address, '');
    expect(html).not.toContain('If the button does not work');
    expect(html).not.toContain('href=""');
  });
  it.each([true, false])('welcome newsletter information is optional (%s)', (includeNewsletter) => {
    const html = getWelcomeTemplate(address, actionUrl, includeNewsletter);
    expect(html).toContain('Connect your first website');
    expect(html.includes('Stay informed about accessibility')).toBe(includeNewsletter);
    expect(html).toContain('Email preferences');
    expect(html).toContain('Unsubscribe');
  });
  it('defaults welcome newsletter information to an optional choice, not automatic consent', () => {
    expect(getWelcomeTemplate(address, actionUrl)).toContain('Subscription is entirely optional');
  });
  it('retains invitation identity and the supplied one-time invite URL', () => {
    const html = getTeamInvitationTemplate(address, 'Colleague', 'Agency team', actionUrl);
    expect(html).toContain('Colleague has invited you');
    expect(html).toContain('Agency team');
    expect(html).toContain(`href="${actionUrl}"`);
    expect(html).not.toContain('Email preferences');
  });
  it('assurance welcome includes the actual subscribed tier and monitoring-only disclaimer', () => {
    const html = getAssuranceWelcomeTemplate(address, 'STARTER', actionUrl);
    expect(html).toContain('STARTER tier');
    expect(html).toContain('Accessibility monitored by VexNexa');
    expect(html).toContain('does not constitute formal WCAG audit or compliance certification');
  });
  it.each([[80, 'meets the configured threshold', 'Above Threshold'], [50, 'below the configured threshold', 'Below Threshold']] as const)(
    'assurance report score %s is compared to the supplied threshold', (score, message, label) => {
      const html = getAssuranceReportEmailTemplate(address, 'example.com', score, 70, actionUrl);
      expect(html).toContain(`${score}/100`);
      expect(html).toContain(message);
      expect(html).toContain(label);
    });
  it.each(['REGRESSION', 'SCORE_DROP', 'CRITICAL_ISSUES'] as const)('assurance alert %s includes recorded score values', (alertType) => {
    const html = getAssuranceAlertEmailTemplate(address, 'example.com', 50, alertType === 'CRITICAL_ISSUES' ? undefined : 80, 70, alertType, actionUrl);
    expect(html).toContain('50/100');
    if (alertType === 'SCORE_DROP') { expect(html).toContain('Previous Score: 80/100'); expect(html).toContain('Change: -30 points'); }
    if (alertType === 'REGRESSION') expect(html).toContain('Threshold: 70/100');
    if (alertType === 'CRITICAL_ISSUES') expect(html).toContain('New critical accessibility issues detected');
  });
  it.each([undefined, [], ['First', 'Second']])('plain text preserves optional evidence lists %j', (listItems) => {
    const text = getPlainTextVersion({ headline: 'Report ready', bodyText: 'Recorded results.', listItems });
    expect(text).toContain('Report ready\n\nRecorded results.');
    expect(text.includes('• First')).toBe((listItems?.length ?? 0) > 0);
    expect(text).not.toContain('Link:');
  });
  it('plain text includes the supplied action URL without introducing HTML', () => {
    const text = getPlainTextVersion({ headline: 'Report', bodyText: 'Evidence.', actionUrl, listItems: ['First'] });
    expect(text).toContain(`Link: ${actionUrl}`);
    expect(text).toContain('• First');
    expect(text).not.toContain('<a');
  });
});
