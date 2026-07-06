import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { BLOG_CATEGORIES, BLOG_POSTS } from '../content/blogPosts'
import { usePageMeta } from '../hooks/usePageMeta'

function formatBlogDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogIndexPage() {
  usePageMeta({
    title: 'Blog — Cash clarity & UK small business finance guides',
    description:
      'Guides on True Balance, cash flow forecasting, VAT reserves, and UK small business finance. Compare tools, plan tax, and know what you can actually spend.',
    path: '/blog',
  })

  const sorted = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="blog-page">
        <div className="blog-page-inner">
          <header className="blog-index-header">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Resources</p>
            <h1>Cash clarity for UK business owners</h1>
            <p className="blog-index-lead">
              Practical guides on True Balance, cash flow, tax reserves, and how we compare to
              spreadsheets and other tools — written for search and for owners who need answers fast.
            </p>
            <div className="blog-index-cta">
              <Link to="/signup" className="btn-primary">
                Start free trial
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary">
                Try demo
              </Link>
            </div>
          </header>

          <div className="blog-category-tags" aria-label="Categories">
            {BLOG_CATEGORIES.map((category) => (
              <span key={category} className="blog-category-tag">
                {category}
              </span>
            ))}
          </div>

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
