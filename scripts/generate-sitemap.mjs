/**
 * Regenerates public/sitemap.xml from blog post slugs in src/content/blogPosts.ts
 * Run automatically before production build (see package.json).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogSource = readFileSync(join(root, 'src/content/blogPosts.ts'), 'utf8')
const methodBlogSource = readFileSync(join(root, 'src/content/methodBlogPosts.ts'), 'utf8')
const cornerstoneBlogSource = readFileSync(join(root, 'src/content/cornerstoneBlogPosts.ts'), 'utf8')
const site = 'https://truebalanceapp.io'

const slugs = [
  ...cornerstoneBlogSource.matchAll(/slug:\s*'([^']+)'/g),
  ...blogSource.matchAll(/slug:\s*'([^']+)'/g),
  ...methodBlogSource.matchAll(/slug:\s*'([^']+)'/g),
].map((match) => match[1])

const uniqueSlugs = [...new Set(slugs)]

const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { loc: '/how-it-works', priority: '0.9', changefreq: 'monthly' },
  { loc: '/see-how-it-works', priority: '0.9', changefreq: 'monthly' },
  { loc: '/true-balance-method', priority: '0.9', changefreq: 'monthly' },
  { loc: '/signup', priority: '0.9', changefreq: 'monthly' },
  { loc: '/blog', priority: '0.9', changefreq: 'weekly' },
  { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
]

const blogPages = uniqueSlugs.map((slug) => ({
  loc: `/blog/${slug}`,
  priority: '0.8',
  changefreq: 'monthly',
}))

const today = new Date().toISOString().slice(0, 10)

const urls = [...staticPages, ...blogPages]
  .map(
    (page) => `  <url>
    <loc>${site}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

writeFileSync(join(root, 'public/sitemap.xml'), xml, 'utf8')
console.log(`sitemap.xml updated (${staticPages.length + blogPages.length} URLs, ${blogPages.length} blog posts)`)
