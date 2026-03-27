/**
 * Generates horizontal VexNexa logo lockups (PNG, transparent).
 * Uses the V mark at public/brand/vexnexa-v-mark.png and Satoshi (Fontshare) with Inter fallback.
 *
 * Run: node scripts/generate-logo-lockups.mjs
 * Requires: npx playwright install chromium (if not already)
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const markPath = path.join(root, 'public', 'brand', 'vexnexa-v-mark.png')
const outDir = path.join(root, 'public', 'brand')

/** CSS px height of the V mark; cap height of "VexNexa" is matched to this. */
const MARK_HEIGHT_CSS = 420
/**
 * font-size ≈ markHeight / capHeightRatio (OpenType cap height / UPEM for Satoshi-like grotesks ~0.72–0.74).
 */
/** Tuned vs Satoshi/Inter cap height (H ≈ fontSize × ratio). Increase if wordmark looks taller than the V. */
const CAP_HEIGHT_RATIO = 0.82
/** Gap between mark and wordmark as fraction of scaled mark width */
const GAP_FRAC = 0.225

const LIGHT = '#0A2540'
const DARK = '#FFFFFF'

function assertMarkExists() {
  if (!fs.existsSync(markPath)) {
    console.error('Missing V mark:', markPath)
    process.exit(1)
  }
}

async function getNaturalSize(page, dataUrl) {
  return page.evaluate(async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () =>
        resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => reject(new Error('Failed to load mark image'))
      img.src = url
    })
  }, dataUrl)
}

function buildHtml({ markUrl, gapPx, fontSizePx, color }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin />
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap" rel="stylesheet" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: transparent;
    }
    #lockup {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: ${gapPx}px;
      background: transparent;
      padding: 24px;
      box-sizing: border-box;
    }
    #mark {
      height: ${MARK_HEIGHT_CSS}px;
      width: auto;
      display: block;
      flex-shrink: 0;
    }
    #word {
      font-family: "Satoshi", "Satoshi Variable", Inter, system-ui, sans-serif;
      font-weight: 600;
      font-size: ${fontSizePx}px;
      line-height: 1;
      letter-spacing: -0.02em;
      color: ${color};
      white-space: nowrap;
      /* Tighten vertical metrics so flex center tracks cap area */
      padding-bottom: 0.04em;
    }
  </style>
</head>
<body>
  <div id="lockup">
    <img id="mark" src="${markUrl}" alt="" />
    <span id="word">VexNexa</span>
  </div>
</body>
</html>`
}

async function renderLockup(color, filename) {
  /** Trim checkerboard padding so glyph height matches CSS height (cap-height alignment). */
  const pngBuf = await sharp(markPath)
    .trim({ threshold: 12 })
    .png()
    .toBuffer()
  const markDataUrl = `data:image/png;base64,${pngBuf.toString('base64')}`

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    deviceScaleFactor: 3,
    viewport: { width: 2400, height: 800 },
  })

  const { w, h } = await getNaturalSize(page, markDataUrl)
  const scaledW = (w * MARK_HEIGHT_CSS) / h
  const gapPx = Math.round(scaledW * GAP_FRAC)
  const fontSizePx = MARK_HEIGHT_CSS / CAP_HEIGHT_RATIO

  await page.setContent(
    buildHtml({ markUrl: markDataUrl, gapPx, fontSizePx, color }),
    { waitUntil: 'networkidle' }
  )

  const outPath = path.join(outDir, filename)
  await page.locator('#lockup').screenshot({
    path: outPath,
    type: 'png',
    omitBackground: true,
  })

  await browser.close()
  console.log('Wrote', outPath)
}

async function main() {
  assertMarkExists()
  await renderLockup(LIGHT, 'vexnexa-logo-lockup-light.png')
  await renderLockup(DARK, 'vexnexa-logo-lockup-dark.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
