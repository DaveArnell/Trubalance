/**
 * Convert public PNG icons / OG art to WebP (and recompress PNG fallbacks).
 * Run: node scripts/optimize-images.mjs
 * Requires: npm i -D sharp (or npx with sharp available in node_modules)
 */
import sharp from 'sharp'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { statSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const jobs = [
  { in: 'og-image.png', out: 'og-image.webp', resize: { width: 1200, height: 630, fit: 'cover' }, quality: 80 },
  { in: 'icon-192.png', out: 'icon-192.webp', resize: { width: 192, height: 192, fit: 'cover' }, quality: 90 },
  { in: 'icon-512.png', out: 'icon-512.webp', resize: { width: 512, height: 512, fit: 'cover' }, quality: 90 },
  { in: 'icon-512.png', out: 'logo-mark.webp', resize: { width: 96, height: 96, fit: 'cover' }, quality: 92 },
]

for (const job of jobs) {
  await sharp(join(root, job.in))
    .resize(job.resize)
    .webp({ quality: job.quality, effort: 6 })
    .toFile(join(root, job.out))
  console.log(job.out, statSync(join(root, job.out)).size, 'bytes')
}
