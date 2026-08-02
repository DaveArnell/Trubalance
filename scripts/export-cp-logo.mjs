import sharp from 'sharp'
import { writeFileSync } from 'fs'

const src =
  'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/c__Users_dave_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_CP_Logo-004d9fc3-b98a-421e-bbb0-0558ff291c18.png'

const { data, info } = await sharp(src).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
const c = info.channels
const raw = Buffer.from(data)
let best = null
for (let y = 0; y < info.height; y += 2) {
  for (let x = 0; x < info.width; x += 2) {
    const i = (y * info.width + x) * c
    const r = raw[i]
    const g = raw[i + 1]
    const b = raw[i + 2]
    if (g > 150 && g > r + 40 && g > b + 40) {
      if (!best || g > best[1]) best = [r, g, b]
    }
  }
}
console.log('green sample', best)

for (let i = 0; i < raw.length; i += c) {
  const r = raw[i]
  const g = raw[i + 1]
  const b = raw[i + 2]
  if (r < 45 && g < 45 && b < 55) raw[i + 3] = 0
}

const transparent = await sharp(raw, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim()
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp(transparent).toFile('D:/Projects/Trubalance/public/logo-mark.png')
await sharp(transparent).webp({ quality: 95 }).toFile('D:/Projects/Trubalance/public/logo-mark.webp')

const iconBg = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 12, g: 0, b: 34, alpha: 1 },
  },
}).png().toBuffer()

const markOnIcon = await sharp(transparent)
  .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

const icon = await sharp(iconBg)
  .composite([{ input: markOnIcon, gravity: 'centre' }])
  .png()
  .toBuffer()

const roundedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="112" ry="112" fill="#fff"/></svg>`
const iconRound = await sharp(icon)
  .composite([{ input: Buffer.from(roundedSvg), blend: 'dest-in' }])
  .png()
  .toBuffer()

await sharp(iconRound).resize(192).toFile('D:/Projects/Trubalance/public/icon-192.png')
await sharp(iconRound).resize(192).webp({ quality: 95 }).toFile('D:/Projects/Trubalance/public/icon-192.webp')
await sharp(iconRound).resize(512).toFile('D:/Projects/Trubalance/public/icon-512.png')
await sharp(iconRound).resize(512).webp({ quality: 95 }).toFile('D:/Projects/Trubalance/public/icon-512.webp')
await sharp(iconRound).resize(180).toFile('D:/Projects/Trubalance/public/apple-touch-icon.png')
await sharp(iconRound).resize(180).webp({ quality: 95 }).toFile('D:/Projects/Trubalance/public/apple-touch-icon.webp')

writeFileSync(
  'D:/Projects/Trubalance/public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" role="img" aria-label="Cash Prophet">
  <rect width="40" height="40" rx="10" fill="#0C0022"/>
  <g fill="none" stroke="#16C065" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18.8 20c0-4.8-3.3-7.8-7.4-7.8S4 15.2 4 20s3.3 7.8 7.4 7.8c2.3 0 4.2-.9 5.5-2.4"/>
    <path d="M18.8 20c0-4.8 3.4-7.8 7.7-7.8S34.4 15.2 34.4 20s-3.4 7.8-7.9 7.8c-1.5 0-2.8-.4-3.9-1"/>
    <path d="M26.5 12.2V31.5"/>
  </g>
</svg>`,
)

console.log('logo assets written')
