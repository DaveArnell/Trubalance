import sharp from 'sharp'
import { writeFileSync } from 'fs'

const markPath = 'D:/Projects/Trubalance/public/logo-mark.png'
const { data, info } = await sharp(markPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const raw = Buffer.from(data)
for (let i = 0; i < raw.length; i += 4) {
  if (raw[i] < 30 && raw[i + 1] < 30 && raw[i + 2] < 30) raw[i + 3] = 0
}
const cleanMark = await sharp(raw, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim()
  .png()
  .toBuffer()

await sharp(cleanMark)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(markPath)
await sharp(cleanMark)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 95 })
  .toFile('D:/Projects/Trubalance/public/logo-mark.webp')

async function iconAt(size, out) {
  const bg = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 12, g: 0, b: 34, alpha: 1 },
    },
  })
    .png()
    .toBuffer()
  const pad = Math.round(size * 0.14)
  const inner = size - pad * 2
  const m = await sharp(cleanMark)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const composed = await sharp(bg)
    .composite([{ input: m, left: pad, top: pad }])
    .png()
    .toBuffer()
  const rx = Math.round(size * 0.22)
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#fff"/></svg>`,
  )
  await sharp(composed).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out)
}

await iconAt(32, 'D:/Projects/Trubalance/public/favicon-32.png')
await iconAt(48, 'D:/Projects/Trubalance/public/favicon-48.png')
await iconAt(192, 'D:/Projects/Trubalance/public/icon-192.png')
await iconAt(512, 'D:/Projects/Trubalance/public/icon-512.png')
await sharp('D:/Projects/Trubalance/public/favicon-32.png').toFile(
  'D:/Projects/Trubalance/public/favicon.png',
)
await sharp('D:/Projects/Trubalance/public/icon-192.png')
  .webp({ quality: 95 })
  .toFile('D:/Projects/Trubalance/public/icon-192.webp')
await sharp('D:/Projects/Trubalance/public/icon-512.png')
  .webp({ quality: 95 })
  .toFile('D:/Projects/Trubalance/public/icon-512.webp')
await sharp('D:/Projects/Trubalance/public/icon-512.png')
  .resize(180)
  .png()
  .toFile('D:/Projects/Trubalance/public/apple-touch-icon.png')
await sharp('D:/Projects/Trubalance/public/apple-touch-icon.png')
  .webp({ quality: 95 })
  .toFile('D:/Projects/Trubalance/public/apple-touch-icon.webp')

// Embed the real mark as a data-free approach: write SVG that references PNG won't work well.
// Keep a simple SVG fallback that browsers can use, but HTML will prefer PNG.
writeFileSync(
  'D:/Projects/Trubalance/public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Cash Prophet">
  <rect width="64" height="64" rx="14" fill="#0C0022"/>
  <image href="/logo-mark.png" x="8" y="8" width="48" height="48" />
</svg>`,
)

console.log('CP favicons ready')
