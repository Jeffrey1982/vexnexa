/**
 * VexNexa Email Template System
 * Consistent, accessible, professional email templates
 */

const currentYear = new Date().getFullYear()

export interface BaseEmailTemplate {
  preheaderText: string
  headline: string
  bodyText: string
  userEmail?: string
  actionUrl?: string
  ctaButtonText?: string
  sectionHeadline?: string
  listItems?: string[]
  includeNewsletterOptIn?: boolean
  includeMonitoringBadge?: boolean
  includeUnsubscribe?: boolean
  preferencesUrl?: string
  unsubscribeUrl?: string
}

/**
 * Master email template with all sections
 */
function getMasterTemplate(data: BaseEmailTemplate): string {
  const {
    preheaderText,
    headline,
    bodyText,
    userEmail = '',
    actionUrl,
    ctaButtonText = 'Continue',
    sectionHeadline,
    listItems = [],
    includeNewsletterOptIn = false,
    includeMonitoringBadge = false,
    includeUnsubscribe = false,
    preferencesUrl,
    unsubscribeUrl
  } = data

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>VexNexa</title>
    <!--[if mso]>
    <style>* { font-family: sans-serif !important; }</style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #F8F9FA;">
    <div style="display: none; max-height: 0px; overflow: hidden;">${preheaderText}</div>
    <div role="article" style="background-color: #F8F9FA;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 40px 0 0 0;"></td></tr>
        </table>
        <table role="presentation" align="center" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
            <tr>
                <td style="padding: 0 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(30, 30, 30, 0.08);">
                        <tr>
                            <td style="padding: 40px 32px 0 32px; text-align: center;">
                                <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1E1E1E; letter-spacing: -0.01em;">VexNexa</h1>
                                <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A;">Accessibility Monitoring Platform</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 32px 0 32px;">
                                <h2 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1E1E1E; line-height: 1.3; text-align: center;">${headline}</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1E1E1E; line-height: 1.6;">${bodyText}</p>
                            </td>
                        </tr>
                        ${actionUrl ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px; text-align: center;">
                                <table role="presentation" align="center" style="margin: 0 auto; border-collapse: collapse;">
                                    <tr>
                                        <td style="border-radius: 6px; background-color: #D45A00; background-image: linear-gradient(135deg, #D45A00 0%, #FF8A5B 100%);">
                                            <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 13px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 500; color: #ffffff; text-decoration: none;">${ctaButtonText}</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 18px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5; text-align: center;">If the button does not work, copy this link:<br><a href="${actionUrl}" style="color: #0F5C5C; text-decoration: none; word-break: break-all;">${actionUrl}</a></p>
                            </td>
                        </tr>
                        ` : ''}
                        ${sectionHeadline && listItems.length > 0 ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <h3 style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1E1E1E; text-align: center;">${sectionHeadline}</h3>
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    ${listItems.map(item => `
                                    <tr>
                                        <td style="padding: 0 0 10px 0;">
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1E1E1E; line-height: 1.5;"><span style="color: #0F5C5C; font-weight: 500;">•</span> ${item}</p>
                                        </td>
                                    </tr>
                                    `).join('')}
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        ${includeNewsletterOptIn ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F8F9FA; border-radius: 6px; padding: 20px;">
                                    <tr>
                                        <td>
                                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #1E1E1E;">Stay informed about accessibility</p>
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5;">You may choose to receive occasional updates from VexNexa, including accessibility insights, product updates, and best practices. Subscription is entirely optional and you can unsubscribe at any time.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        ${includeMonitoringBadge ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F8F9FA; border-radius: 6px; padding: 20px;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 500; color: #1E1E1E;">Accessibility monitored by VexNexa</p>
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A; line-height: 1.5;">Some organizations choose to display an "Accessibility monitored by VexNexa" badge to communicate transparency and ongoing monitoring. This indicates automated monitoring is active and does not constitute formal WCAG audit or compliance certification.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 32px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="border-top: 1px solid #C0C3C7;"></td></tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5; text-align: center;">This email was sent to <span style="color: #1E1E1E;">${userEmail}</span> because you have an account with VexNexa or requested this communication.</p>
                            </td>
                        </tr>
                        ${includeUnsubscribe && (preferencesUrl || unsubscribeUrl) ? `
                        <tr>
                            <td style="padding: 16px 32px 32px 32px; text-align: center;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A;">
                                    ${preferencesUrl ? `<a href="${preferencesUrl}" style="color: #5A5A5A; text-decoration: underline;">Email preferences</a>` : ''}
                                    ${preferencesUrl && unsubscribeUrl ? '<span style="color: #C0C3C7; margin: 0 8px;">|</span>' : ''}
                                    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: #5A5A5A; text-decoration: underline;">Unsubscribe</a>` : ''}
                                </p>
                            </td>
                        </tr>
                        ` : `
                        <tr><td style="padding: 0 0 32px 0;"></td></tr>
                        `}
                    </table>
                </td>
            </tr>
        </table>
        <table role="presentation" align="center" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
            <tr>
                <td style="padding: 24px 20px 40px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A;">VexNexa provides automated accessibility monitoring.</p>
                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #5A5A5A; line-height: 1.5;">Monitoring is automated and does not constitute a formal WCAG audit or legal compliance certification.</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #5A5A5A;">© ${currentYear} VexNexa. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`
}

/**
 * Email verification template
 */
export function getEmailVerificationTemplate(email: string, verifyUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Verify your email address to access VexNexa',
    headline: 'Verify your email address',
    bodyText: 'Thank you for creating a VexNexa account. To complete your registration and access your accessibility monitoring dashboard, please verify your email address.',
    userEmail: email,
    actionUrl: verifyUrl,
    ctaButtonText: 'Verify email address',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Welcome/onboarding template
 */
export function getWelcomeTemplate(
  email: string,
  dashboardUrl: string,
  includeNewsletterOption: boolean = true
): string {
  return getMasterTemplate({
    preheaderText: 'Welcome to VexNexa - Get started with monitoring',
    headline: 'Welcome to VexNexa',
    bodyText: "We're pleased to have you here. VexNexa provides automated accessibility monitoring to help you maintain inclusive digital experiences. Your dashboard is ready.",
    userEmail: email,
    actionUrl: dashboardUrl,
    ctaButtonText: 'Access your dashboard',
    sectionHeadline: 'Get started',
    listItems: [
      'Connect your first website or application',
      'Configure monitoring schedules and parameters',
      'Review automated accessibility reports'
    ],
    includeNewsletterOptIn: includeNewsletterOption,
    includeMonitoringBadge: false,
    includeUnsubscribe: true,
    preferencesUrl: '{{preferences_url}}',
    unsubscribeUrl: '{{unsubscribe_url}}'
  })
}

/**
 * Newsletter confirmation template
 */
export function getNewsletterConfirmationTemplate(email: string, confirmUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Confirm your VexNexa newsletter subscription',
    headline: 'Confirm your subscription',
    bodyText: 'Thank you for your interest in VexNexa updates. To complete your newsletter subscription and receive accessibility insights, product updates, and best practices, please confirm your email address.',
    userEmail: email,
    actionUrl: confirmUrl,
    ctaButtonText: 'Confirm subscription',
    sectionHeadline: 'What to expect',
    listItems: [
      'Accessibility insights and industry trends',
      'Product updates and new monitoring features',
      'Best practices for inclusive digital experiences'
    ],
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: true,
    preferencesUrl: '{{preferences_url}}',
    unsubscribeUrl: '{{unsubscribe_url}}'
  })
}

/**
 * Password reset template
 */
export function getPasswordResetTemplate(email: string, resetUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Reset your VexNexa password',
    headline: 'Reset your password',
    bodyText: 'We received a request to reset your VexNexa password. Click the button below to create a new password. This link is valid for one hour. If you did not request this, you can safely ignore this email.',
    userEmail: email,
    actionUrl: resetUrl,
    ctaButtonText: 'Reset password',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Team invitation template
 */
export function getTeamInvitationTemplate(
  email: string,
  inviterName: string,
  teamName: string,
  inviteUrl: string
): string {
  return getMasterTemplate({
    preheaderText: `${inviterName} invited you to join ${teamName} on VexNexa`,
    headline: `You've been invited to ${teamName}`,
    bodyText: `${inviterName} has invited you to join the team "${teamName}" on VexNexa. Accept this invitation to collaborate on accessibility monitoring.`,
    userEmail: email,
    actionUrl: inviteUrl,
    ctaButtonText: 'Accept invitation',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Assurance Welcome template (multilingual)
 */
export function getAssuranceWelcomeTemplate(
  email: string,
  tier: string,
  language: string,
  dashboardUrl: string
): string {
  const translations = {
    en: {
      preheader: 'Welcome to VexNexa Accessibility Assurance',
      headline: 'Welcome to Accessibility Assurance',
      body: `Thank you for subscribing to VexNexa Accessibility Assurance (${tier} tier). Your automated monitoring service is now active. Configure your first domain to begin continuous accessibility monitoring.`,
      cta: 'Access Dashboard',
      sectionTitle: 'What happens next?',
      listItems: [
        'Add domains to monitor',
        'Configure scan frequency and thresholds',
        'Set up email recipients for reports and alerts',
        'Receive automated PDF reports in your preferred language'
      ]
    },
    nl: {
      preheader: 'Welkom bij VexNexa Accessibility Assurance',
      headline: 'Welkom bij Accessibility Assurance',
      body: `Bedankt voor uw abonnement op VexNexa Accessibility Assurance (${tier}-tier). Uw geautomatiseerde monitoringdienst is nu actief. Configureer uw eerste domein om continue toegankelijkheidsmonitoring te starten.`,
      cta: 'Naar Dashboard',
      sectionTitle: 'Wat gebeurt er nu?',
      listItems: [
        'Domeinen toevoegen om te monitoren',
        'Scanfrequentie en drempelwaarden configureren',
        'E-mailontvangers instellen voor rapporten en waarschuwingen',
        'Ontvang geautomatiseerde PDF-rapporten in uw voorkeurstaal'
      ]
    },
    fr: {
      preheader: 'Bienvenue chez VexNexa Accessibility Assurance',
      headline: 'Bienvenue chez Accessibility Assurance',
      body: `Merci de vous être abonné à VexNexa Accessibility Assurance (niveau ${tier}). Votre service de surveillance automatisée est maintenant actif. Configurez votre premier domaine pour commencer la surveillance continue de l'accessibilité.`,
      cta: 'Accéder au tableau de bord',
      sectionTitle: 'Prochaines étapes',
      listItems: [
        'Ajouter des domaines à surveiller',
        'Configurer la fréquence de scan et les seuils',
        'Configurer les destinataires email pour les rapports et alertes',
        'Recevoir des rapports PDF automatisés dans votre langue préférée'
      ]
    },
    es: {
      preheader: 'Bienvenido a VexNexa Accessibility Assurance',
      headline: 'Bienvenido a Accessibility Assurance',
      body: `Gracias por suscribirse a VexNexa Accessibility Assurance (nivel ${tier}). Su servicio de monitoreo automatizado ya está activo. Configure su primer dominio para comenzar el monitoreo continuo de accesibilidad.`,
      cta: 'Acceder al panel',
      sectionTitle: '¿Qué sigue?',
      listItems: [
        'Agregar dominios para monitorear',
        'Configurar frecuencia de escaneo y umbrales',
        'Configurar destinatarios de correo para informes y alertas',
        'Recibir informes PDF automatizados en su idioma preferido'
      ]
    },
    pt: {
      preheader: 'Bem-vindo ao VexNexa Accessibility Assurance',
      headline: 'Bem-vindo ao Accessibility Assurance',
      body: `Obrigado por subscrever o VexNexa Accessibility Assurance (nível ${tier}). O seu serviço de monitorização automatizada está agora ativo. Configure o seu primeiro domínio para iniciar a monitorização contínua de acessibilidade.`,
      cta: 'Aceder ao painel',
      sectionTitle: 'Próximos passos',
      listItems: [
        'Adicionar domínios para monitorizar',
        'Configurar frequência de digitalização e limiares',
        'Configurar destinatários de email para relatórios e alertas',
        'Receber relatórios PDF automatizados no seu idioma preferido'
      ]
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return getMasterTemplate({
    preheaderText: t.preheader,
    headline: t.headline,
    bodyText: t.body,
    userEmail: email,
    actionUrl: dashboardUrl,
    ctaButtonText: t.cta,
    sectionHeadline: t.sectionTitle,
    listItems: t.listItems,
    includeNewsletterOptIn: false,
    includeMonitoringBadge: true,
    includeUnsubscribe: false
  });
}

/**
 * Assurance Report Email template (multilingual)
 */
export function getAssuranceReportEmailTemplate(
  email: string,
  domain: string,
  score: number,
  threshold: number,
  language: string,
  reportUrl: string
): string {
  const status = score >= threshold ? 'passing' : 'below threshold';

  const translations = {
    en: {
      preheader: `Accessibility Report for ${domain} - Score: ${score}`,
      headline: `Accessibility Report: ${domain}`,
      body: `Your scheduled accessibility scan for ${domain} is complete. Current score: ${score}/100 (Threshold: ${threshold}). ${status === 'passing' ? 'Your site meets the configured threshold.' : 'Attention: Score is below the configured threshold.'}`,
      cta: 'View Full Report',
      sectionTitle: 'Report Summary',
      listItems: [
        `Current Score: ${score}/100`,
        `Threshold: ${threshold}/100`,
        `Status: ${status === 'passing' ? '✓ Above Threshold' : '⚠ Below Threshold'}`,
        'Detailed PDF report attached'
      ]
    },
    nl: {
      preheader: `Toegankelijkheidsrapport voor ${domain} - Score: ${score}`,
      headline: `Toegankelijkheidsrapport: ${domain}`,
      body: `Uw geplande toegankelijkheidsscan voor ${domain} is voltooid. Huidige score: ${score}/100 (Drempelwaarde: ${threshold}). ${status === 'passing' ? 'Uw site voldoet aan de geconfigureerde drempelwaarde.' : 'Let op: Score ligt onder de geconfigureerde drempelwaarde.'}`,
      cta: 'Volledig rapport bekijken',
      sectionTitle: 'Rapportsamenvatting',
      listItems: [
        `Huidige score: ${score}/100`,
        `Drempelwaarde: ${threshold}/100`,
        `Status: ${status === 'passing' ? '✓ Boven drempelwaarde' : '⚠ Onder drempelwaarde'}`,
        'Gedetailleerd PDF-rapport bijgevoegd'
      ]
    },
    fr: {
      preheader: `Rapport d'accessibilité pour ${domain} - Score: ${score}`,
      headline: `Rapport d'accessibilité: ${domain}`,
      body: `Votre scan d'accessibilité programmé pour ${domain} est terminé. Score actuel: ${score}/100 (Seuil: ${threshold}). ${status === 'passing' ? 'Votre site respecte le seuil configuré.' : 'Attention: Le score est inférieur au seuil configuré.'}`,
      cta: 'Voir le rapport complet',
      sectionTitle: 'Résumé du rapport',
      listItems: [
        `Score actuel: ${score}/100`,
        `Seuil: ${threshold}/100`,
        `Statut: ${status === 'passing' ? '✓ Au-dessus du seuil' : '⚠ En dessous du seuil'}`,
        'Rapport PDF détaillé joint'
      ]
    },
    es: {
      preheader: `Informe de accesibilidad para ${domain} - Puntuación: ${score}`,
      headline: `Informe de accesibilidad: ${domain}`,
      body: `Su escaneo de accesibilidad programado para ${domain} está completo. Puntuación actual: ${score}/100 (Umbral: ${threshold}). ${status === 'passing' ? 'Su sitio cumple con el umbral configurado.' : 'Atención: La puntuación está por debajo del umbral configurado.'}`,
      cta: 'Ver informe completo',
      sectionTitle: 'Resumen del informe',
      listItems: [
        `Puntuación actual: ${score}/100`,
        `Umbral: ${threshold}/100`,
        `Estado: ${status === 'passing' ? '✓ Sobre el umbral' : '⚠ Bajo el umbral'}`,
        'Informe PDF detallado adjunto'
      ]
    },
    pt: {
      preheader: `Relatório de acessibilidade para ${domain} - Pontuação: ${score}`,
      headline: `Relatório de acessibilidade: ${domain}`,
      body: `A sua digitalização de acessibilidade agendada para ${domain} está concluída. Pontuação atual: ${score}/100 (Limiar: ${threshold}). ${status === 'passing' ? 'O seu site cumpre o limiar configurado.' : 'Atenção: A pontuação está abaixo do limiar configurado.'}`,
      cta: 'Ver relatório completo',
      sectionTitle: 'Resumo do relatório',
      listItems: [
        `Pontuação atual: ${score}/100`,
        `Limiar: ${threshold}/100`,
        `Estado: ${status === 'passing' ? '✓ Acima do limiar' : '⚠ Abaixo do limiar'}`,
        'Relatório PDF detalhado anexado'
      ]
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return getMasterTemplate({
    preheaderText: t.preheader,
    headline: t.headline,
    bodyText: t.body,
    userEmail: email,
    actionUrl: reportUrl,
    ctaButtonText: t.cta,
    sectionHeadline: t.sectionTitle,
    listItems: t.listItems,
    includeNewsletterOptIn: false,
    includeMonitoringBadge: true,
    includeUnsubscribe: false
  });
}

/**
 * Assurance Alert Email template (multilingual)
 */
export function getAssuranceAlertEmailTemplate(
  email: string,
  domain: string,
  currentScore: number,
  previousScore: number | undefined,
  threshold: number,
  alertType: 'REGRESSION' | 'SCORE_DROP' | 'CRITICAL_ISSUES',
  language: string,
  dashboardUrl: string
): string {
  const scoreChange = previousScore ? currentScore - previousScore : 0;

  const translations = {
    en: {
      preheader: `Accessibility Alert for ${domain}`,
      headline: `⚠ Accessibility Alert: ${domain}`,
      body: alertType === 'REGRESSION'
        ? `Important: The accessibility score for ${domain} has dropped below your configured threshold. Current score: ${currentScore}/100 (Threshold: ${threshold}). Immediate attention recommended.`
        : alertType === 'SCORE_DROP'
        ? `The accessibility score for ${domain} has decreased significantly. Current score: ${currentScore}/100 (Previous: ${previousScore}/100, Change: ${scoreChange}). Please review recent changes.`
        : `Critical accessibility issues detected on ${domain}. Current score: ${currentScore}/100. New critical-impact violations require immediate attention.`,
      cta: 'View Details',
      sectionTitle: 'Alert Details',
      listItems: alertType === 'REGRESSION'
        ? [
            `Current Score: ${currentScore}/100`,
            `Threshold: ${threshold}/100`,
            `Status: ⚠ Below Threshold`,
            'Action required to restore compliance'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Current Score: ${currentScore}/100`,
            `Previous Score: ${previousScore}/100`,
            `Change: ${scoreChange} points`,
            'Review recent site changes'
          ]
        : [
            `Current Score: ${currentScore}/100`,
            'New critical accessibility issues detected',
            'Immediate remediation recommended',
            'Check dashboard for details'
          ]
    },
    nl: {
      preheader: `Toegankelijkheidswaarschuwing voor ${domain}`,
      headline: `⚠ Toegankelijkheidswaarschuwing: ${domain}`,
      body: alertType === 'REGRESSION'
        ? `Belangrijk: De toegankelijkheidsscore voor ${domain} is onder uw geconfigureerde drempelwaarde gedaald. Huidige score: ${currentScore}/100 (Drempelwaarde: ${threshold}). Onmiddellijke aandacht aanbevolen.`
        : alertType === 'SCORE_DROP'
        ? `De toegankelijkheidsscore voor ${domain} is aanzienlijk gedaald. Huidige score: ${currentScore}/100 (Vorige: ${previousScore}/100, Wijziging: ${scoreChange}). Controleer recente wijzigingen.`
        : `Kritieke toegankelijkheidsproblemen gedetecteerd op ${domain}. Huidige score: ${currentScore}/100. Nieuwe kritieke overtredingen vereisen onmiddellijke aandacht.`,
      cta: 'Details bekijken',
      sectionTitle: 'Waarschuwingsdetails',
      listItems: alertType === 'REGRESSION'
        ? [
            `Huidige score: ${currentScore}/100`,
            `Drempelwaarde: ${threshold}/100`,
            `Status: ⚠ Onder drempelwaarde`,
            'Actie vereist om naleving te herstellen'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Huidige score: ${currentScore}/100`,
            `Vorige score: ${previousScore}/100`,
            `Wijziging: ${scoreChange} punten`,
            'Controleer recente sitewijzigingen'
          ]
        : [
            `Huidige score: ${currentScore}/100`,
            'Nieuwe kritieke toegankelijkheidsproblemen gedetecteerd',
            'Onmiddellijke oplossing aanbevolen',
            'Controleer dashboard voor details'
          ]
    },
    fr: {
      preheader: `Alerte d'accessibilité pour ${domain}`,
      headline: `⚠ Alerte d'accessibilité: ${domain}`,
      body: alertType === 'REGRESSION'
        ? `Important: Le score d'accessibilité pour ${domain} est tombé en dessous de votre seuil configuré. Score actuel: ${currentScore}/100 (Seuil: ${threshold}). Attention immédiate recommandée.`
        : alertType === 'SCORE_DROP'
        ? `Le score d'accessibilité pour ${domain} a considérablement diminué. Score actuel: ${currentScore}/100 (Précédent: ${previousScore}/100, Changement: ${scoreChange}). Veuillez examiner les modifications récentes.`
        : `Problèmes d'accessibilité critiques détectés sur ${domain}. Score actuel: ${currentScore}/100. De nouvelles violations critiques nécessitent une attention immédiate.`,
      cta: 'Voir les détails',
      sectionTitle: "Détails de l'alerte",
      listItems: alertType === 'REGRESSION'
        ? [
            `Score actuel: ${currentScore}/100`,
            `Seuil: ${threshold}/100`,
            `Statut: ⚠ En dessous du seuil`,
            'Action requise pour restaurer la conformité'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Score actuel: ${currentScore}/100`,
            `Score précédent: ${previousScore}/100`,
            `Changement: ${scoreChange} points`,
            'Examiner les modifications récentes du site'
          ]
        : [
            `Score actuel: ${currentScore}/100`,
            "Nouveaux problèmes d'accessibilité critiques détectés",
            'Remédiation immédiate recommandée',
            'Consultez le tableau de bord pour plus de détails'
          ]
    },
    es: {
      preheader: `Alerta de accesibilidad para ${domain}`,
      headline: `⚠ Alerta de accesibilidad: ${domain}`,
      body: alertType === 'REGRESSION'
        ? `Importante: La puntuación de accesibilidad para ${domain} ha caído por debajo de su umbral configurado. Puntuación actual: ${currentScore}/100 (Umbral: ${threshold}). Se recomienda atención inmediata.`
        : alertType === 'SCORE_DROP'
        ? `La puntuación de accesibilidad para ${domain} ha disminuido significativamente. Puntuación actual: ${currentScore}/100 (Anterior: ${previousScore}/100, Cambio: ${scoreChange}). Por favor, revise los cambios recientes.`
        : `Problemas críticos de accesibilidad detectados en ${domain}. Puntuación actual: ${currentScore}/100. Las nuevas violaciones críticas requieren atención inmediata.`,
      cta: 'Ver detalles',
      sectionTitle: 'Detalles de la alerta',
      listItems: alertType === 'REGRESSION'
        ? [
            `Puntuación actual: ${currentScore}/100`,
            `Umbral: ${threshold}/100`,
            `Estado: ⚠ Bajo el umbral`,
            'Acción requerida para restaurar el cumplimiento'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Puntuación actual: ${currentScore}/100`,
            `Puntuación anterior: ${previousScore}/100`,
            `Cambio: ${scoreChange} puntos`,
            'Revisar cambios recientes del sitio'
          ]
        : [
            `Puntuación actual: ${currentScore}/100`,
            'Nuevos problemas críticos de accesibilidad detectados',
            'Remediación inmediata recomendada',
            'Consulte el panel para más detalles'
          ]
    },
    pt: {
      preheader: `Alerta de acessibilidade para ${domain}`,
      headline: `⚠ Alerta de acessibilidade: ${domain}`,
      body: alertType === 'REGRESSION'
        ? `Importante: A pontuação de acessibilidade para ${domain} caiu abaixo do seu limiar configurado. Pontuação atual: ${currentScore}/100 (Limiar: ${threshold}). Atenção imediata recomendada.`
        : alertType === 'SCORE_DROP'
        ? `A pontuação de acessibilidade para ${domain} diminuiu significativamente. Pontuação atual: ${currentScore}/100 (Anterior: ${previousScore}/100, Alteração: ${scoreChange}). Por favor, reveja as alterações recentes.`
        : `Problemas críticos de acessibilidade detectados em ${domain}. Pontuação atual: ${currentScore}/100. Novas violações críticas requerem atenção imediata.`,
      cta: 'Ver detalhes',
      sectionTitle: 'Detalhes do alerta',
      listItems: alertType === 'REGRESSION'
        ? [
            `Pontuação atual: ${currentScore}/100`,
            `Limiar: ${threshold}/100`,
            `Estado: ⚠ Abaixo do limiar`,
            'Ação necessária para restaurar a conformidade'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Pontuação atual: ${currentScore}/100`,
            `Pontuação anterior: ${previousScore}/100`,
            `Alteração: ${scoreChange} pontos`,
            'Rever alterações recentes do site'
          ]
        : [
            `Pontuação atual: ${currentScore}/100`,
            'Novos problemas críticos de acessibilidade detectados',
            'Remediação imediata recomendada',
            'Consulte o painel para mais detalhes'
          ]
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return getMasterTemplate({
    preheaderText: t.preheader,
    headline: t.headline,
    bodyText: t.body,
    userEmail: email,
    actionUrl: dashboardUrl,
    ctaButtonText: t.cta,
    sectionHeadline: t.sectionTitle,
    listItems: t.listItems,
    includeNewsletterOptIn: false,
    includeMonitoringBadge: true,
    includeUnsubscribe: false
  });
}

/**
 * Plain text version generator (for multipart emails)
 */
export function getPlainTextVersion(data: {
  headline: string
  bodyText: string
  actionUrl?: string
  listItems?: string[]
}): string {
  let text = `VEXNEXA - Accessibility Monitoring Platform\n\n`
  text += `${data.headline}\n\n`
  text += `${data.bodyText}\n\n`

  if (data.actionUrl) {
    text += `Link: ${data.actionUrl}\n\n`
  }

  if (data.listItems && data.listItems.length > 0) {
    data.listItems.forEach(item => {
      text += `• ${item}\n`
    })
    text += '\n'
  }

  text += `---\n`
  text += `VexNexa provides automated accessibility monitoring.\n`
  text += `Monitoring is automated and does not constitute a formal WCAG audit or legal compliance certification.\n\n`
  text += `© ${currentYear} VexNexa. All rights reserved.`

  return text
}
