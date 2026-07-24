/**
 * Regenerates public/sitemap.xml with absolute canonical URLs (no trailing slashes)
 * for every indexable marketing path + blog post. Runs automatically before build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = 'https://truebalanceapp.io'

function stripTrailingSlash(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function canonicalLoc(path) {
  const pathname = stripTrailingSlash(path.split(/[?#]/)[0] || '/')
  if (pathname === '/') return `${site}/`
  return `${site}${pathname}`
}

function extractIndexableStaticRoutes() {
  const source = readFileSync(join(root, 'src/content/indexableRoutes.ts'), 'utf8')
  const block = source.match(/export const INDEXABLE_STATIC_ROUTES[^=]*=\s*\[([\s\S]*?)\]\s*as const/)
  if (!block) throw new Error('INDEXABLE_STATIC_ROUTES not found')
  const routes = []
  const itemRe =
    /\{\s*path:\s*'([^']+)',\s*priority:\s*'([^']+)',\s*changefreq:\s*'([^']+)'\s*\}/g
  let match
  while ((match = itemRe.exec(block[1])) !== null) {
    routes.push({
      path: stripTrailingSlash(match[1]),
      priority: match[2],
      changefreq: match[3],
    })
  }
  if (routes.length === 0) throw new Error('No indexable static routes parsed')
  return routes
}

function extractBlogSlugs() {
  const files = [
    'src/content/cornerstoneBlogPosts.ts',
    'src/content/blogPosts.ts',
    'src/content/methodBlogPosts.ts',
  ]
  const slugs = []
  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8')
    for (const match of source.matchAll(/slug:\s*'([^']+)'/g)) {
      slugs.push(match[1])
    }
  }
  return [...new Set(slugs)]
}

const staticRoutes = extractIndexableStaticRoutes()
const blogSlugs = extractBlogSlugs()
const today = new Date().toISOString().slice(0, 10)

const seen = new Set()
const urls = []

for (const route of staticRoutes) {
  const loc = canonicalLoc(route.path)
  if (seen.has(loc)) continue
  seen.add(loc)
  urls.push({ loc, priority: route.priority, changefreq: route.changefreq })
}

for (const slug of blogSlugs) {
  const loc = canonicalLoc(`/blog/${slug}`)
  if (seen.has(loc)) continue
  seen.add(loc)
  urls.push({ loc, priority: '0.8', changefreq: 'monthly' })
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'public/sitemap.xml'), xml, 'utf8')
console.log(
  `sitemap.xml updated (${urls.length} absolute canonical URLs, ${blogSlugs.length} blog posts)`,
)
