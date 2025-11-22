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
  'footer_newsletter': 'our website',
  'homepage_newsletter': 'our homepage',
  'contact_newsletter': 'the contact form',
  'pricing_newsletter': 'the pricing page',
  'features_newsletter': 'the features page',
  'blog_newsletter': 'our blog',
  'about_newsletter': 'the about us page',

  // Pop-ups and modals
  'popup_newsletter': 'a popup on our website',
  'modal_newsletter': 'a signup form',
  'exit_intent': 'an exit-intent popup',

  // Campaign sources
  'social_newsletter': 'social media',
  'email_newsletter': 'an email campaign',
  'referral_newsletter': 'a referral',
  'direct_newsletter': 'direct access',

  // Default fallback
  'newsletter': 'our website',
  'unknown': 'our website',

  // Testing
  'test': 'a test',
  'test_compliance': 'a compliance test',
  'test_gdpr': 'a GDPR test'
} as const

export function getSourceDisplayName(source?: string): string {
  if (!source) return 'our website'

  // Check if we have a mapping for this source
  const mappedName = SOURCE_NAMES[source as keyof typeof SOURCE_NAMES]
  if (mappedName) return mappedName

  // If it's a technical name with underscore, try to make it friendly
  if (source.includes('_')) {
    const parts = source.split('_')
    if (parts[1] === 'newsletter') {
      switch (parts[0]) {
        case 'footer': return 'our website'
        case 'homepage': return 'our homepage'
        case 'contact': return 'the contact form'
        case 'pricing': return 'the pricing page'
        case 'features': return 'the features page'
        case 'blog': return 'our blog'
        case 'about': return 'the about us page'
        default: return 'our website'
      }
    }
  }

  // Fallback to generic description
  return 'our website'
}

export type SourceKey = keyof typeof SOURCE_NAMES