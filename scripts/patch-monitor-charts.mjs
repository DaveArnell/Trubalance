import sharp from 'sharp'
import { copyFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const srcPath =
  process.argv[2] ||
  'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/product-monitor.png'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Plot boxes inside the monitor screenshot (1536x1024). */
const left = { x: 220, y: 668, w: 480, h: 175 }
const right = { x: 800, y: 668, w: 480, h: 175 }

function trendSvg(w, h) {
  // Wavy monthly values ending ~22k; scale max 30k
  const vals = [7.2, 8.5, 9.1, 8.4, 10.8, 11.6, 10.9, 13.5, 15.2, 16.8, 18.5, 22.0]
  const max = 30
  const padL = 36
  const padR = 10
  const padT = 8
  const padB = 22
  const pw = w - padL - padR
  const ph = h - padT - padB
  const pts = vals.map((v, i) => {
    const x = padL + (i / (vals.length - 1)) * pw
    const y = padT + (1 - v / max) * ph
    return [x, y]
  })

  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const dx = (x1 - x0) / 2
    d += ` C ${(x0 + dx).toFixed(1)} ${y0.toFixed(1)}, ${(x1 - dx).toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  const area =
    d +
    ` L ${pts[pts.length - 1][0].toFixed(1)} ${(padT + ph).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(padT + ph).toFixed(1)} Z`

  const dots = pts
    .map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="#0d8f5b"/>`,
    )
    .join('')

  const yLabels = [
    [padT + 2, '£30k'],
    [padT + ph / 3, '£20k'],
    [padT + (ph * 2) / 3, '£10k'],
    [padT + ph, '£0'],
  ]
    .map(
      ([y, t]) =>
        `<text x="2" y="${(+y + 3).toFixed(1)}" font-size="9" fill="#6b7280" font-family="Segoe UI,Arial,sans-serif">${t}</text>`,
    )
    .join('')

  const xLabels = months
    .map((m, i) => {
      const x = padL + (i / (months.length - 1)) * pw
      return `<text x="${x.toFixed(1)}" y="${(h - 4).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="#6b7280" font-family="Segoe UI,Arial,sans-serif">${m}</text>`
    })
    .join('')

  const grid = [0, 1, 2, 3]
    .map((i) => {
      const y = padT + (i / 3) * ph
      return `<line x1="${padL}" y1="${y}" x2="${padL + pw}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${grid}
  <path d="${area}" fill="#0d8f5b" opacity="0.12"/>
  <path d="${d}" fill="none" stroke="#0d8f5b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  ${dots}
  ${yLabels}
  ${xLabels}
</svg>`
}

function reserveSvg(w, h) {
  const events = [
    { m: 1.6, peak: 9.8, drop: 2.4, label: 'VAT' },
    { m: 4.7, peak: 11.2, drop: 3.1, label: 'Corp tax' },
    { m: 7.2, peak: 7.4, drop: 1.8, label: 'VAT' },
    { m: 9.4, peak: 10.1, drop: 2.6, label: 'VAT' },
    { m: 11.2, peak: 6.2, drop: 1.5, label: 'Insurance' },
  ]
  const max = 12
  const buffer = 1.2
  const padL = 36
  const padR = 10
  const padT = 18
  const padB = 22
  const pw = w - padL - padR
  const ph = h - padT - padB
  const xAt = (m) => padL + (m / 11) * pw
  const yAt = (v) => padT + (1 - v / max) * ph

  const climbRates = [0.55, 0.72, 0.48, 0.65, 0.4, 0.58]
  const pts = []
  let bal = 2.0
  let eventIdx = 0
  let rateIdx = 0

  for (let step = 0; step <= 120; step++) {
    const t = (step / 120) * 11
    while (eventIdx < events.length && t >= events[eventIdx].m) {
      const e = events[eventIdx]
      pts.push([xAt(e.m), yAt(e.peak)])
      pts.push([xAt(e.m + 0.06), yAt(e.drop)])
      bal = e.drop
      eventIdx++
      rateIdx = (rateIdx + 1) % climbRates.length
    }
    if (eventIdx > 0 && Math.abs(t - events[eventIdx - 1].m) < 0.1) continue
    if (step === 0) {
      pts.push([xAt(0), yAt(bal)])
    } else {
      const prevT = ((step - 1) / 120) * 11
      bal += climbRates[rateIdx] * (t - prevT)
      const wobble = Math.sin(t * 2.1) * 0.18
      pts.push([xAt(t), yAt(Math.min(max * 0.95, Math.max(buffer, bal + wobble)))])
    }
  }

  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`
  }

  const labels = events
    .map((e) => {
      const x = xAt(e.m)
      const y = yAt(e.peak) - 6
      return `
      <line x1="${x.toFixed(1)}" y1="${yAt(e.peak).toFixed(1)}" x2="${x.toFixed(1)}" y2="${yAt(e.drop).toFixed(1)}" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="3 2"/>
      <circle cx="${x.toFixed(1)}" cy="${yAt(e.peak).toFixed(1)}" r="3" fill="#dc2626"/>
      <text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="9" font-weight="600" fill="#dc2626" font-family="Segoe UI,Arial,sans-serif">${e.label}</text>`
    })
    .join('')

  const yLabels = [
    [padT + 2, '£12k'],
    [padT + ph / 3, '£8k'],
    [padT + (ph * 2) / 3, '£4k'],
    [padT + ph, '£0'],
  ]
    .map(
      ([y, t]) =>
        `<text x="2" y="${(+y + 3).toFixed(1)}" font-size="9" fill="#6b7280" font-family="Segoe UI,Arial,sans-serif">${t}</text>`,
    )
    .join('')

  const xLabels = months
    .map((m, i) => {
      const x = padL + (i / 11) * pw
      return `<text x="${x.toFixed(1)}" y="${(h - 4).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="#6b7280" font-family="Segoe UI,Arial,sans-serif">${m}</text>`
    })
    .join('')

  const grid = [0, 1, 2, 3]
    .map((i) => {
      const y = padT + (i / 3) * ph
      return `<line x1="${padL}" y1="${y}" x2="${padL + pw}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`
    })
    .join('')

  const bufY = yAt(buffer)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${grid}
  <line x1="${padL}" y1="${bufY.toFixed(1)}" x2="${padL + pw}" y2="${bufY.toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="${d}" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  ${labels}
  ${yLabels}
  ${xLabels}
</svg>`
}

const leftPng = await sharp(Buffer.from(trendSvg(left.w, left.h))).png().toBuffer()
const rightPng = await sharp(Buffer.from(reserveSvg(right.w, right.h))).png().toBuffer()

const out = await sharp(srcPath)
  .composite([
    { input: leftPng, left: left.x, top: left.y },
    { input: rightPng, left: right.x, top: right.y },
  ])
  .png()
  .toBuffer()

const outPng = join(root, 'public/product-monitor.png')
const outWebp = join(root, 'public/product-monitor.webp')
const adsPng = join(root, 'public/ads/cash-prophet-monitor-only-2400.png')
const adsWebp = join(root, 'public/ads/cash-prophet-monitor-only-2400.webp')

writeFileSync(outPng, out)
await sharp(out).webp({ quality: 86 }).toFile(outWebp)
await sharp(out).resize(2400).png({ compressionLevel: 9 }).toFile(adsPng)
await sharp(adsPng).webp({ quality: 88 }).toFile(adsWebp)

// Keep asset copy in sync for future edits
copyFileSync(outPng, 'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/product-monitor.png')

await sharp(out)
  .extract({ left: 150, top: 560, width: 1200, height: 360 })
  .toFile('C:/Users/dave/AppData/Local/Temp/chart-both-new.png')

console.log('Patched monitor charts ->', outPng)
