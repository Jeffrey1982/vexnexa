import Script from 'next/script'

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  // Guard: Don't render if measurement ID is not configured
  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  )
}
