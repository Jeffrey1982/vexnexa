interface UTMParameters {
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}

interface EmailHeaders {
  'List-Unsubscribe'?: string
  'List-Unsubscribe-Post'?: string
}

export function addUTMToUrl(baseUrl: string, utm: UTMParameters): string {
  const url = new URL(baseUrl)

  url.searchParams.set('utm_source', utm.source)
  url.searchParams.set('utm_medium', utm.medium)
  url.searchParams.set('utm_campaign', utm.campaign)

  if (utm.term) {
    url.searchParams.set('utm_term', utm.term)
  }

  if (utm.content) {
    url.searchParams.set('utm_content', utm.content)
  }

  return url.toString()
}

export function createListUnsubscribeHeader(unsubscribeToken: string): EmailHeaders {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

  return {
    'List-Unsubscribe': `<mailto:unsubscribe@vexnexa.com>, <${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  }
}

export function createPreheaderText(text: string, targetLength: number = 90): string {
  // Ensure preheader text is within optimal length (15-90 chars)
  if (text.length <= targetLength) {
    return text
  }

  // Truncate at word boundary
  const truncated = text.substring(0, targetLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > targetLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}

export function wrapPreheaderInHTML(preheaderText: string): string {
  return `
    <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
      ${preheaderText}
    </div>
  `.trim()
}

export interface MarketingEmailOptions {
  unsubscribeToken: string
  campaignName: string
  preheaderText: string
}

export function addMarketingEmailHeaders(
  emailOptions: any,
  marketingOptions: MarketingEmailOptions
): any {
  const headers = createListUnsubscribeHeader(marketingOptions.unsubscribeToken)

  return {
    ...emailOptions,
    headers,
    html: wrapPreheaderInHTML(marketingOptions.preheaderText) + '\n' + emailOptions.html
  }
}

// UTM preset configurations for different email campaigns
export const UTM_PRESETS = {
  newsletter_welcome: {
    source: 'newsletter',
    medium: 'email',
    campaign: 'welcome'
  },
  newsletter_confirmation: {
    source: 'newsletter',
    medium: 'email',
    campaign: 'confirmation'
  },
  newsletter_regular: {
    source: 'newsletter',
    medium: 'email',
    campaign: 'newsletter'
  },
  transactional_password_reset: {
    source: 'system',
    medium: 'email',
    campaign: 'password_reset'
  },
  transactional_account_verification: {
    source: 'system',
    medium: 'email',
    campaign: 'account_verification'
  },
  team_invitation: {
    source: 'system',
    medium: 'email',
    campaign: 'team_invitation'
  }
} as const

export type UTMPresetKey = keyof typeof UTM_PRESETS

// Source mapping for user-friendly descriptions in emails
export const SOURCE_NAMES = {
  // Website locations
  'footer_newsletter': 'onze website',
  'homepage_newsletter': 'onze homepage',
  'contact_newsletter': 'het contactformulier',
  'pricing_newsletter': 'de prijzenpagina',
  'features_newsletter': 'de features pagina',
  'blog_newsletter': 'onze blog',
  'about_newsletter': 'de over ons pagina',

  // Pop-ups and modals
  'popup_newsletter': 'een popup op onze website',
  'modal_newsletter': 'een aanmeldingsformulier',
  'exit_intent': 'een exit-intent popup',

  // Campaign sources
  'social_newsletter': 'sociale media',
  'email_newsletter': 'een email campagne',
  'referral_newsletter': 'een verwijzing',
  'direct_newsletter': 'directe toegang',

  // Default fallback
  'newsletter': 'onze website',
  'unknown': 'onze website',

  // Testing
  'test': 'een test',
  'test_compliance': 'een compliance test',
  'test_gdpr': 'een GDPR test'
} as const

export function getSourceDisplayName(source?: string): string {
  if (!source) return 'onze website'

  // Check if we have a mapping for this source
  const mappedName = SOURCE_NAMES[source as keyof typeof SOURCE_NAMES]
  if (mappedName) return mappedName

  // If it's a technical name with underscore, try to make it friendly
  if (source.includes('_')) {
    const parts = source.split('_')
    if (parts[1] === 'newsletter') {
      switch (parts[0]) {
        case 'footer': return 'onze website'
        case 'homepage': return 'onze homepage'
        case 'contact': return 'het contactformulier'
        case 'pricing': return 'de prijzenpagina'
        case 'features': return 'de features pagina'
        case 'blog': return 'onze blog'
        case 'about': return 'de over ons pagina'
        default: return 'onze website'
      }
    }
  }

  // Fallback to generic description
  return 'onze website'
}

export type SourceKey = keyof typeof SOURCE_NAMES