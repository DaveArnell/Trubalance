import { Link, useSearchParams } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { BLOG_CATEGORIES, BLOG_POSTS } from '../content/blogPosts'
import { METHOD_BLOG_CATEGORY } from '../content/trueBalanceMethod'
import { usePageMeta } from '../hooks/usePageMeta'

function formatBlogDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category')

  usePageMeta({
    title: 'Blog — Learn the True Balance Method | True Balance',
    description:
      'Articles teaching the True Balance Method: bank balance isn’t available cash, continuous accrual, VAT reserves, and financial management vs accounting software.',
    path: activeCategory ? `/blog?category=${encodeURIComponent(activeCategory)}` : '/blog',
  })

  const sorted = [...BLOG_POSTS]
    .filter((post) => !activeCategory || post.category === activeCategory)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="blog-page">
        <div className="blog-page-inner">
          <header className="blog-index-header">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Learn the Method</p>
            <h1>Teaching the True Balance Method</h1>
            <p className="blog-index-lead">
              Why your bank balance is not spending money, why costs should accrue every day, how the
              Reserve Planner funds annual bills, and the two habits every business owner can keep.
              The True Balance app is the easiest way to follow the Method.
            </p>
            <div className="blog-index-cta">
              <Link to="/true-balance-method" className="btn-primary">
                The True Balance Method
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary">
                See it in a demo
              </Link>
              <Link to="/signup" className="btn-secondary">
                Follow it in software
              </Link>
            </div>
          </header>

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
              Educational articles about the True Balance Method — how to see what is genuinely
              available and keep a calm financial routine.
            </p>
          )}

          <div className="blog-index-grid">
            {sorted.map((post) => (
              <article key={post.slug} className="blog-card">
                <p className="blog-card-meta">
                  <span className="blog-card-category">{post.category}</span>
                  <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
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
