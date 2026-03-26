import { NextResponse } from 'next/server'

/**
 * GET /api/auth/diagnose
 *
 * Safe diagnostic endpoint for auth configuration.
 * Returns non-sensitive configuration state to help debug auth flow issues.
 * Does NOT expose secrets, tokens, or full URLs.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '(not set)'
  const authSiteUrl = process.env.NEXT_PUBLIC_AUTH_SITE_URL || '(not set)'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '(not set)'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Build the same URLs our code builds, so we can verify in production
  const { buildAuthUrl, getSiteUrl, getAuthSiteUrl } = await import('@/lib/urls')

  const resolvedSiteUrl = getSiteUrl()
  const resolvedAuthSiteUrl = getAuthSiteUrl()

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 12) || '(not available)',

    envVars: {
      NEXT_PUBLIC_SITE_URL: siteUrl,
      NEXT_PUBLIC_AUTH_SITE_URL: authSiteUrl,
      NEXT_PUBLIC_APP_URL: appUrl,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '(not set)',
      hasAnonKey,
    },

    resolvedUrls: {
      getSiteUrl: resolvedSiteUrl,
      getAuthSiteUrl: resolvedAuthSiteUrl,
      buildAuthUrl_callback: buildAuthUrl('/auth/callback?flow=signup'),
      buildAuthUrl_reset: buildAuthUrl('/auth/reset-password'),
      buildAuthUrl_confirm: buildAuthUrl('/auth/confirm'),
    },

    emailTemplateLinkFormats: {
      signup_confirmation: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup',
      recovery: '{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery',
      invite: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite',
      email_change: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change',
      note: '{{ .SiteURL }} is set in Supabase Dashboard → Authentication → URL Configuration → Site URL',
    },

    expectedRoutes: {
      '/auth/confirm': 'Handles: signup, invite, email_change (token_hash flow)',
      '/auth/reset-password': 'Handles: recovery (token_hash flow + legacy PKCE code flow)',
      '/auth/callback': 'Handles: PKCE code exchange (legacy ConfirmationURL flow)',
      '/auth/verify-error': 'Handles: all verification failures',
      '/auth/verified': 'Handles: post-verification success',
    },

    checks: {
      authSiteUrlConfigured: authSiteUrl !== '(not set)',
      siteUrlConfigured: siteUrl !== '(not set)',
      supabaseConfigured: !!supabaseUrl && hasAnonKey,
      authSubdomainActive: authSiteUrl !== '(not set)' && authSiteUrl !== siteUrl,
    },

    actionRequired: [
      ...(authSiteUrl === '(not set)' ? ['NEXT_PUBLIC_AUTH_SITE_URL not set — buildAuthUrl falls back to NEXT_PUBLIC_SITE_URL'] : []),
      'Verify Supabase Dashboard email templates use {{ .TokenHash }} (not {{ .ConfirmationURL }})',
      'Verify Supabase Dashboard Site URL matches: ' + resolvedSiteUrl,
      'Verify Supabase Dashboard Redirect URLs include: ' + resolvedSiteUrl + '/auth/callback',
    ],
  })
}
