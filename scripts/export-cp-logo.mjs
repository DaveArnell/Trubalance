import sharp from 'sharp'

const src =
  'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/c__Users_dave_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Copy_of_CP_Logo-10557906-fa69-4601-b118-d16028748357.png'

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const c = info.channels
const raw = Buffer.from(data)

let best = null
for (let y = 0; y < info.height; y += 2) {
  for (let x = 0; x < info.width; x += 2) {
    const i = (y * info.width + x) * c
    const r = raw[i]
    const g = raw[i + 1]
    const b = raw[i + 2]
    if (g > 140 && g > r + 30 && g > b + 30) {
      if (!best || g > best[1]) best = [r, g, b]
    }
  }
}
console.log('green', best)

// Knock out black / near-black background to alpha
for (let i = 0; i < raw.length; i += c) {
  const r = raw[i]
  const g = raw[i + 1]
  const b = raw[i + 2]
  const max = Math.max(r, g, b)
  const isDark = max < 28
  const isNearBlackGreenish = r < 20 && g < 35 && b < 25 && g < 40
  if (isDark || isNearBlackGreenish) raw[i + 3] = 0
}

const transparent = await sharp(raw, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 5 })
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
})
  .png()
  .toBuffer()

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

console.log('transparent logo exported')
