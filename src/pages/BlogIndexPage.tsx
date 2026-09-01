import { useSearchParams } from 'react-router-dom'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { BLOG_CATEGORIES, BLOG_POSTS } from '../content/blogPosts'
import { BLOG_INDEX_SEO } from '../content/marketingSeo'
import { METHOD_BLOG_CATEGORY } from '../content/trueBalanceMethod'
import { usePageMeta } from '../hooks/usePageMeta'
import { MarketingJsonLd, blogIndexJsonLd } from '../components/marketing/MarketingJsonLd'

export function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category')

  usePageMeta({
    ...BLOG_INDEX_SEO,
    title: activeCategory
      ? `${activeCategory} Cash Guides | Cash Prophet Blog`
      : BLOG_INDEX_SEO.title,
    description: activeCategory
      ? `${activeCategory} articles for UK owner-managed businesses: day-to-day financial organisation, reserves and Cash Prophet Balance.`
      : BLOG_INDEX_SEO.description,
    path: BLOG_INDEX_SEO.path,
  })

  const sorted = [...BLOG_POSTS]
    .filter((post) => !activeCategory || post.category === activeCategory)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <MarketingShell>
      <MarketingJsonLd data={blogIndexJsonLd()} />
      <MarketingHeader />

      <main className="blog-page">
        <header className="method-edu-hero marketing-surface--hero blog-index-hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">Guides</p>
            <h1>Keeping business finances organised</h1>
            <p className="method-edu-hero-lead">
              Practical reading for owner-managed businesses: bills coming up, costs building through
              the month, money to put aside, and a clearer view of where the business stands than the
              bank balance alone.
            </p>
            <div className="blog-index-cta">
              <CanonicalLink to="/see-how-it-works" className="btn-primary marketing-cta-btn-on-dark">
                Take the guided tour
              </CanonicalLink>
              <CanonicalLink to="/how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                How it works
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-ghost btn-large marketing-cta-ghost">
                Join Early Access
              </CanonicalLink>
            </div>
          </div>
        </header>
        <div className="blog-page-inner">

          <div className="blog-category-tags" aria-label="Categories">
            <button
              type="button"
              className={`blog-category-tag blog-category-tag--button${activeCategory ? '' : ' blog-category-tag--active'}`}
              onClick={() => setSearchParams({})}
            >
              All
            </button>
            {BLOG_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`blog-category-tag blog-category-tag--button${
                  activeCategory === category ? ' blog-category-tag--active' : ''
                }`}
                onClick={() => setSearchParams({ category })}
              >
                {category}
              </button>
            ))}
          </div>

          {activeCategory === METHOD_BLOG_CATEGORY && (
            <p className="blog-index-category-note muted">
              Educational articles about Cash Prophet: organising what is coming up, what to put aside,
              and where the business stands.
            </p>
          )}

          <div className="blog-index-grid">
            {sorted.map((post) => (
              <article key={post.slug} className="blog-card">
                <p className="blog-card-meta">
                  <span className="blog-card-category">{post.category}</span>
                  <span className="blog-card-read">{post.readMinutes} min read</span>
                </p>
                <h2>
                  <CanonicalLink to={`/blog/${post.slug}`}>{post.title}</CanonicalLink>
                </h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <CanonicalLink to={`/blog/${post.slug}`} className="blog-card-link">
                  Read guide →
                </CanonicalLink>
              </article>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
