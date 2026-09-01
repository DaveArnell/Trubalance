import { Navigate, useParams } from 'react-router-dom'
import { CanonicalLink } from '../components/CanonicalLink'
import { BlogProse } from '../components/marketing/BlogProse'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import {
  MarketingJsonLd,
  blogPostJsonLd,
  breadcrumbJsonLd,
} from '../components/marketing/MarketingJsonLd'
import { getBlogPost, getRelatedPosts } from '../content/blogPosts'
import { METHOD_BLOG_CATEGORY } from '../content/trueBalanceMethod'
import { usePageMeta } from '../hooks/usePageMeta'

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const post = getBlogPost(slug)

  usePageMeta({
    title: post?.title ?? 'Article not found',
    description: post?.metaDescription ?? 'Cash Prophet blog',
    path: post ? `/blog/${post.slug}` : '/blog',
    type: post ? 'article' : 'website',
    publishedTime: post ? `${post.publishedAt}T09:00:00Z` : undefined,
    modifiedTime: post ? `${post.updatedAt}T09:00:00Z` : undefined,
    imageAlt: post?.title ?? 'Cash Prophet blog article',
    noindex: !post,
  })

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const related = getRelatedPosts(post.slug)
  const jsonLd = [
    ...blogPostJsonLd(post),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ]

  return (
    <MarketingShell>
      <MarketingJsonLd data={jsonLd} />
      <MarketingHeader />

      <main className="blog-page">
        <article className="blog-article blog-page-inner">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <CanonicalLink to="/">Home</CanonicalLink>
            <span aria-hidden> / </span>
            <CanonicalLink to="/blog">Blog</CanonicalLink>
          </nav>

          <header className="blog-article-header">
            <p className="blog-card-meta">
              <span className="blog-card-category">{post.category}</span>
              <span className="blog-card-read">{post.readMinutes} min read</span>
            </p>
            <h1>{post.title}</h1>
            <p className="blog-article-deck">{post.excerpt}</p>
          </header>

          <BlogProse sections={post.sections} />

          <aside className="blog-cta-box">
            {post.category === METHOD_BLOG_CATEGORY ? (
              <>
                <h2>Keep the day-to-day picture organised</h2>
                <p>
                  Cash Prophet is a financial organiser for owner-managed businesses. See what is
                  coming up, what needs putting aside, where you stand and whether that position is
                  improving.
                </p>
              </>
            ) : (
              <>
                <h2>See Cash Prophet in action</h2>
                <p>
                  Take a guided tour through an example business, or join Early Access. Personal
                  setup is available and no card is required to start.
                </p>
              </>
            )}
            <div className="blog-index-cta">
              <CanonicalLink to="/see-how-it-works" className="btn-primary">
                Take the guided tour
              </CanonicalLink>
              <CanonicalLink to="/how-it-works" className="btn-ghost">
                How it works
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-secondary">
                Join Early Access
              </CanonicalLink>
            </div>
          </aside>

          {related.length > 0 ? (
            <aside className="blog-related" aria-label="Related articles">
              <h2>Related guides</h2>
              <ul>
                {related.map((entry) => (
                  <li key={entry.slug}>
                    <CanonicalLink to={`/blog/${entry.slug}`}>{entry.title}</CanonicalLink>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </article>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
