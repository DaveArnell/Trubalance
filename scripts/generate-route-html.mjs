/**
 * After Vite build, write per-route HTML shells so social crawlers (and static
 * file serving) see unique title / description / Open Graph / Twitter tags
 * without executing JavaScript.
 *
 * Reads dist/index.html as the SPA shell and replaces head meta for each
 * public marketing + blog route. Static files take precedence over the SPA
 * rewrite on Vercel.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = 'https://truebalanceapp.io'
const ogImage = `${site}/og-image.png`
const ogAltDefault = 'Cash Prophet — Available Balance you can trust for UK business owners'

const marketingSource = readFileSync(join(root, 'src/content/marketingSeo.ts'), 'utf8')

function extractSeoBlock(name) {
  const re = new RegExp(
    `export const ${name} = \\{([\\s\\S]*?)\\} as const`,
    'm',
  )
  const match = marketingSource.match(re)
  if (!match) throw new Error(`Could not find ${name} in marketingSeo.ts`)
  const block = match[1]
  const title = block.match(/title:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'")
  const description = block.match(/description:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'")
  const path = block.match(/path:\s*'((?:\\'|[^'])*)'/)?.[1]
  const imageAlt = block.match(/imageAlt:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'")
  const noindex = /noindex:\s*true/.test(block)
  if (!title || !description || !path) {
    throw new Error(`Incomplete SEO block for ${name}`)
  }
  return { title, description, path, imageAlt: imageAlt ?? ogAltDefault, noindex }
}

const staticRoutes = [
  'HOME_SEO',
  'PRICING_SEO',
  'HOW_IT_WORKS_SEO',
  'WHO_FOR_SEO',
  'SEE_HOW_SEO',
  'BLOG_INDEX_SEO',
  'PRIVACY_SEO',
  'TERMS_SEO',
  'SIGNUP_SEO',
].map(extractSeoBlock)

function extractBlogPosts(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const posts = []
  const blockRe =
    /\{\s*slug:\s*'([^']+)',\s*title:\s*'((?:\\'|[^'])*)',\s*metaDescription:\s*'((?:\\'|[^'])*)'/g
  let match
  while ((match = blockRe.exec(source)) !== null) {
    posts.push({
      slug: match[1],
      title: match[2].replace(/\\'/g, "'"),
      description: match[3].replace(/\\'/g, "'"),
    })
  }
  return posts
}

const blogPosts = [
  ...extractBlogPosts(join(root, 'src/content/cornerstoneBlogPosts.ts')),
  ...extractBlogPosts(join(root, 'src/content/blogPosts.ts')),
  ...extractBlogPosts(join(root, 'src/content/methodBlogPosts.ts')),
]

const uniqueBlog = []
const seen = new Set()
for (const post of blogPosts) {
  if (seen.has(post.slug)) continue
  seen.add(post.slug)
  uniqueBlog.push(post)
}

const distIndex = join(root, 'dist', 'index.html')
if (!existsSync(distIndex)) {
  console.error('dist/index.html missing — run vite build first')
  process.exit(1)
}

const shell = readFileSync(distIndex, 'utf8')

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function brandTitle(title) {
  if (title.includes('Cash Prophet') || title.includes('True Balance')) return title
  return `${title} | Cash Prophet`
}

function injectMeta(html, { title, description, path, imageAlt, type = 'website', noindex = false }) {
  const fullTitle = brandTitle(title)
  const url = `${site}${path === '/' ? '/' : path}`
  const robots = noindex ? 'noindex, nofollow' : 'index, follow'
  const ogType = type

  let next = html
  next = next.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(fullTitle)}</title>`)

  const replacements = [
    [/name="description"\s+content="[^"]*"/, `name="description" content="${escapeAttr(description)}"`],
    [/property="og:type"\s+content="[^"]*"/, `property="og:type" content="${ogType}"`],
    [/property="og:site_name"\s+content="[^"]*"/, `property="og:site_name" content="Cash Prophet"`],
    [/property="og:title"\s+content="[^"]*"/, `property="og:title" content="${escapeAttr(fullTitle)}"`],
    [/property="og:description"\s+content="[^"]*"/, `property="og:description" content="${escapeAttr(description)}"`],
    [/property="og:url"\s+content="[^"]*"/, `property="og:url" content="${escapeAttr(url)}"`],
    [/property="og:image"\s+content="[^"]*"/, `property="og:image" content="${ogImage}"`],
    [/name="twitter:card"\s+content="[^"]*"/, `name="twitter:card" content="summary_large_image"`],
    [/name="twitter:title"\s+content="[^"]*"/, `name="twitter:title" content="${escapeAttr(fullTitle)}"`],
    [/name="twitter:description"\s+content="[^"]*"/, `name="twitter:description" content="${escapeAttr(description)}"`],
    [/name="twitter:image"\s+content="[^"]*"/, `name="twitter:image" content="${ogImage}"`],
    [/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeAttr(url)}" />`],
  ]

  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(next)) {
      console.warn(`Missing pattern in index.html for ${path}: ${pattern}`)
    }
    next = next.replace(pattern, replacement)
  }

  // Ensure extended OG / Twitter tags exist (insert before </head> if absent).
  const extras = [
    ['og:locale', 'en_GB', 'property'],
    ['og:image:secure_url', ogImage, 'property'],
    ['og:image:type', 'image/png', 'property'],
    ['og:image:width', '1200', 'property'],
    ['og:image:height', '630', 'property'],
    ['og:image:alt', imageAlt, 'property'],
    ['twitter:image:alt', imageAlt, 'name'],
    ['robots', robots, 'name'],
  ]

  for (const [key, content, attr] of extras) {
    const tag =
      attr === 'property'
        ? `<meta property="${key}" content="${escapeAttr(content)}" />`
        : `<meta name="${key}" content="${escapeAttr(content)}" />`
    const finder =
      attr === 'property'
        ? new RegExp(`<meta\\s+property="${key}"\\s+content="[^"]*"\\s*/?>`)
        : new RegExp(`<meta\\s+name="${key}"\\s+content="[^"]*"\\s*/?>`)
    if (finder.test(next)) {
      next = next.replace(finder, tag)
    } else {
      next = next.replace('</head>', `    ${tag}\n  </head>`)
    }
  }

  if (noindex) {
    next = next.replace(/<link rel="canonical"[^>]*>\s*/g, '')
  }

  return next
}

function writeRouteHtml(path, html) {
  const clean = path === '/' ? '' : path.replace(/^\//, '')
  const outDir = clean ? join(root, 'dist', clean) : join(root, 'dist')
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, 'index.html')
  writeFileSync(outFile, html, 'utf8')
}

// Homepage overwrites dist/index.html with the same asset references + homepage meta.
writeRouteHtml('/', injectMeta(shell, staticRoutes.find((r) => r.path === '/') ))

for (const route of staticRoutes) {
  if (route.path === '/') continue
  writeRouteHtml(route.path, injectMeta(shell, route))
}

for (const post of uniqueBlog) {
  const path = `/blog/${post.slug}`
  writeRouteHtml(
    path,
    injectMeta(shell, {
      title: post.title,
      description: post.description,
      path,
      imageAlt: post.title,
      type: 'article',
    }),
  )
}

console.log(
  `SEO HTML shells written (${staticRoutes.length} marketing + ${uniqueBlog.length} blog routes)`,
)
