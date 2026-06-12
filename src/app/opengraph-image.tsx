import { ImageResponse } from 'next/og'

export const alt = 'VexNexa — WCAG 2.2 monitoring & audit-ready accessibility reports'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1F4A2D 100%)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: 'flex', color: '#F8FAFC', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
            VexNexa
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              color: '#F8FAFC',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            WCAG 2.2 monitoring & audit-ready reports
          </div>
          <div style={{ display: 'flex', color: '#94A3B8', fontSize: 30, lineHeight: 1.4, maxWidth: 900 }}>
            Continuous accessibility scans, AI-Vision analysis and white-label PDF exports — built for the EU.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['WCAG 2.2', 'EAA-ready', 'White-label', 'EU-hosted'].map((chip) => (
            <div
              key={chip}
              style={{
                display: 'flex',
                padding: '10px 26px',
                borderRadius: 999,
                border: '2px solid rgba(148, 163, 184, 0.4)',
                color: '#E2E8F0',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
