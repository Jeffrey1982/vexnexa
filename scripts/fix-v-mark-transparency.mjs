/**
 * Removes solid light grey / white background from vexnexa-v-mark.png (checkerboard
 * saved as opaque pixels). Uses edge flood-fill so colored V shapes stay intact.
 *
 * Run: node scripts/fix-v-mark-transparency.mjs
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const target = path.join(root, 'public', 'brand', 'vexnexa-v-mark.png')

/** True for light neutral pixels (grey / white “matte”), false for saturated logo colors */
function isBackgroundPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const avg = (r + g + b) / 3
  return max - min <= 24 && avg >= 168
}

async function main() {
  const buf = fs.readFileSync(target)
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const s = 4
  const out = Buffer.from(data)
  const visited = new Uint8Array(w * h)
  const queue = []

  for (let x = 0; x < w; x++) {
    queue.push(x, 0, x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y, w - 1, y)
  }

  let qi = 0
  while (qi < queue.length) {
    const x = queue[qi++]
    const y = queue[qi++]
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const idx = y * w + x
    if (visited[idx]) continue
    visited[idx] = 1
    const o = idx * s
    const r = out[o]
    const g = out[o + 1]
    const b = out[o + 2]
    if (!isBackgroundPixel(r, g, b)) continue
    out[o + 3] = 0
    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(target + '.tmp')
  fs.renameSync(target + '.tmp', target)
  console.log('Wrote transparent', target)

  // Tight crop to opaque pixels (keeps UI aspect ratio accurate). Sync BRAND_MARK_ASPECT in brand.ts if this changes.
  const buf2 = fs.readFileSync(target)
  const { data: d2, info: i2 } = await sharp(buf2).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w2 = i2.width
  const h2 = i2.height
  let minX = w2
  let minY = h2
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < w2; x++) {
      if (d2[(y * w2 + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  if (maxX >= minX && maxY >= minY) {
    const pad = 8
    const left = Math.max(0, minX - pad)
    const top = Math.max(0, minY - pad)
    const width = Math.min(w2 - left, maxX - minX + 1 + 2 * pad)
    const height = Math.min(h2 - top, maxY - minY + 1 + 2 * pad)
    await sharp(target).extract({ left, top, width, height }).png().toFile(target + '.tmp')
    fs.renameSync(target + '.tmp', target)
    const meta = await sharp(target).metadata()
    console.log('Cropped to', meta.width, 'x', meta.height, '— set BRAND_MARK_ASPECT =', meta.width, '/', meta.height)
  }

  // Refresh favicons derived from V mark
  const sizes = [
    [32, 'vexnexa-favicon-32.png'],
    [192, 'vexnexa-favicon-192.png'],
    [512, 'vexnexa-favicon-512.png'],
  ]
  for (const [px, name] of sizes) {
    const dest = path.join(root, 'public', 'brand', name)
    await sharp(target)
      .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(dest)
    console.log('Updated', dest)
  }

  const appIcon = path.join(root, 'src', 'app', 'icon.png')
  await sharp(target)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(appIcon)
  console.log('Updated', appIcon)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
