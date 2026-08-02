import sharp from 'sharp'
import { copyFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const framePath =
  'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/monitor-empty-frame.png'
const mockPath =
  'C:/Users/dave/AppData/Local/Temp/cursor/screenshots/monitor-dashboard-mock.png'

const left = 318
const top = 122
const width = 900
const height = 545

const rounded = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="10" ry="10" fill="#fff"/></svg>`,
)

const screenContent = await sharp(mockPath)
  .trim({ threshold: 8 })
  .resize(width, height, { fit: 'fill' })
  .composite([{ input: rounded, blend: 'dest-in' }])
  .png()
  .toBuffer()

const out = await sharp(framePath)
  .composite([{ input: screenContent, left, top }])
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
copyFileSync(outPng, 'C:/Users/dave/.cursor/projects/d-Projects-Trubalance/assets/product-monitor.png')

await sharp(out)
  .extract({ left: 300, top: 100, width: 940, height: 580 })
  .toFile('C:/Users/dave/AppData/Local/Temp/final-screen-check.png')

console.log('Composited monitor with accurate charts')
