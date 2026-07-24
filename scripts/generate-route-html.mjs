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

function extractFaqConst(name) {
  const source = readFileSync(join(root, 'src/content/marketingFaqs.ts'), 'utf8')
  const re = new RegExp(`export const ${name}: FaqItem\\[] = \\[([\\s\\S]*?)\\]\\n`, 'm')
  const match = source.match(re)
  if (!match) return []
  const items = []
  const itemRe = /\{\s*q:\s*'((?:\\'|[^'])*)',\s*a:\s*'((?:\\'|[^'])*)',\s*\}/g
  let item
  while ((item = itemRe.exec(match[1])) !== null) {
    items.push({
      q: item[1].replace(/\\'/g, "'"),
      a: item[2].replace(/\\'/g, "'"),
    })
  }
  return items
}

function faqGraph(faqs, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

function organizationGraph() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: 'Cash Prophet',
    legalName: 'Vocatio Ltd',
    url: site,
    logo: { '@type': 'ImageObject', url: `${site}/icon-512.png` },
  }
}

function websiteGraph(description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    name: 'Cash Prophet',
    url: site,
    description,
    inLanguage: 'en-GB',
    publisher: { '@id': `${site}/#organization` },
  }
}

function siteNavigationGraph() {
  const links = [
    { to: '/how-it-works', label: 'How it works' },
    { to: '/who-its-for', label: "Who it's for" },
    { to: '/see-how-it-works', label: 'See it' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/blog', label: 'Blog' },
    { to: '/signup', label: 'Get started' },
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${site}/#site-navigation`,
    name: 'Main navigation',
    itemListElement: links.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.label,
      url: `${site}${item.to}`,
    })),
  }
}

function productGraph(description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${site}/pricing#cash-prophet`,
    name: 'Cash Prophet',
    description,
    image: ogImage,
    brand: { '@type': 'Brand', name: 'Cash Prophet' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'GBP',
      lowPrice: '5',
      highPrice: '15',
      offerCount: 6,
      availability: 'https://schema.org/InStock',
      url: `${site}/pricing`,
    },
  }
}

function articleGraph(post) {
  const url = `${site}/blog/${post.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    image: [ogImage],
    inLanguage: 'en-GB',
    author: { '@type': 'Organization', name: 'Vocatio Ltd', url: site },
    publisher: {
      '@type': 'Organization',
      name: 'Cash Prophet',
      logo: { '@type': 'ImageObject', url: `${site}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

function jsonLdForRoute(path, routeMeta, blogPost) {
  if (path === '/') {
    return [
      organizationGraph(),
      websiteGraph(routeMeta.description),
      siteNavigationGraph(),
      {
        '@context': 'https://schema.org',
        '@type': ['SoftwareApplication', 'Product'],
        name: 'Cash Prophet',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        description: routeMeta.description,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'GBP',
          lowPrice: '5',
          highPrice: '15',
          url: `${site}/pricing`,
        },
      },
    ]
  }
  if (path === '/pricing') {
    return [
      organizationGraph(),
      productGraph(routeMeta.description),
      faqGraph(extractFaqConst('PRICING_FAQS'), `${site}/pricing`),
    ]
  }
  if (path === '/how-it-works') {
    return [
      organizationGraph(),
      faqGraph(extractFaqConst('HOW_IT_WORKS_FAQS'), `${site}/how-it-works`),
    ]
  }
  if (path === '/who-its-for') {
    return [
      organizationGraph(),
      faqGraph(extractFaqConst('WHO_FOR_FAQS'), `${site}/who-its-for`),
    ]
  }
  if (path === '/see-how-it-works') {
    return [
      organizationGraph(),
      {
        '@context': 'https://schema.org',
        '@type': ['SoftwareApplication', 'Product'],
        name: 'Cash Prophet interactive demos',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        description: routeMeta.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      },
    ]
  }
  if (path === '/blog') {
    return [
      organizationGraph(),
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: routeMeta.title,
        description: routeMeta.description,
        url: `${site}/blog`,
        publisher: { '@id': `${site}/#organization` },
      },
    ]
  }
  if (blogPost) {
    return [organizationGraph(), articleGraph(blogPost)]
  }
  return [organizationGraph()]
}

function injectJsonLd(html, graphs) {
  if (!graphs?.length) return html
  const scripts = graphs
    .map((graph) => `<script type="application/ld+json">${JSON.stringify(graph)}</script>`)
    .join('\n    ')
  return html.replace('</head>', `    ${scripts}\n  </head>`)
}

function injectMeta(html, { title, description, path, imageAlt, type = 'website', noindex = false, jsonLd }) {
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

  return injectJsonLd(next, jsonLd)
}

function writeRouteHtml(path, html) {
  const clean = path === '/' ? '' : path.replace(/^\//, '')
  const outDir = clean ? join(root, 'dist', clean) : join(root, 'dist')
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, 'index.html')
  writeFileSync(outFile, html, 'utf8')
}

const homeRoute = staticRoutes.find((r) => r.path === '/')
writeRouteHtml(
  '/',
  injectMeta(shell, { ...homeRoute, jsonLd: jsonLdForRoute('/', homeRoute) }),
)

for (const route of staticRoutes) {
  if (route.path === '/') continue
  writeRouteHtml(
    route.path,
    injectMeta(shell, { ...route, jsonLd: jsonLdForRoute(route.path, route) }),
  )
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
      jsonLd: jsonLdForRoute(path, { description: post.description, title: post.title }, post),
    }),
  )
}

console.log(
  `SEO HTML shells written (${staticRoutes.length} marketing + ${uniqueBlog.length} blog routes, with JSON-LD)`,
)
