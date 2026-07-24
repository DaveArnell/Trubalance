import { Link, useSearchParams } from 'react-router-dom'
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
      ? `${activeCategory} articles on Available Balance, committed funds and cash clarity for UK business owners.`
      : BLOG_INDEX_SEO.description,
    path: activeCategory ? `/blog?category=${encodeURIComponent(activeCategory)}` : BLOG_INDEX_SEO.path,
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
            <p className="marketing-how-eyebrow">Clarity</p>
            <h1>Articles on knowing where you stand</h1>
            <p className="method-edu-hero-lead">
              Why your bank balance isn’t enough, how known commitments build before payday, how to
              stop VAT and annual bills catching you out, and the light habits that keep the picture
              honest.
            </p>
            <div className="blog-index-cta">
              <Link to="/how-it-works" className="btn-primary marketing-cta-btn-on-dark">
                How it works
              </Link>
              <Link to="/see-how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                See how it feels
              </Link>
              <Link to="/signup" className="btn-ghost btn-large marketing-cta-ghost">
                Get started
              </Link>
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
              Educational articles about Cash Prophet — how to see what is genuinely available and keep
              a calm financial routine.
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
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} className="blog-card-link">
                  Read guide →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
