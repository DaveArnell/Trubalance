import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BlogProse } from '../components/marketing/BlogProse'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { COMPANY_INFO } from '../content/companyInfo'
import { getBlogPost, getRelatedPosts } from '../content/blogPosts'
import { METHOD_BLOG_CATEGORY } from '../content/trueBalanceMethod'
import { usePageMeta } from '../hooks/usePageMeta'

function formatBlogDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const post = getBlogPost(slug)

  usePageMeta({
    title: post?.title ?? 'Article not found',
    description: post?.metaDescription ?? 'True Balance blog',
    path: post ? `/blog/${post.slug}` : '/blog',
    type: post ? 'article' : 'website',
    publishedTime: post ? `${post.publishedAt}T09:00:00Z` : undefined,
    modifiedTime: post ? `${post.updatedAt}T09:00:00Z` : undefined,
  })

  useEffect(() => {
    if (!post) return undefined

    const articleUrl = `${COMPANY_INFO.website}/blog/${post.slug}`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Organization',
        name: COMPANY_INFO.legalName,
        url: COMPANY_INFO.website,
      },
      publisher: {
        '@type': 'Organization',
        name: COMPANY_INFO.productName,
        url: COMPANY_INFO.website,
      },
      mainEntityOfPage: articleUrl,
      keywords: post.keywords.join(', '),
    }

    const faqSection = post.sections.find((section) => section.type === 'faq')
    const faqJsonLd =
      faqSection && faqSection.type === 'faq'
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqSection.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }
        : null

    const scripts: HTMLScriptElement[] = []
    for (const data of [jsonLd, faqJsonLd]) {
      if (!data) continue
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(data)
      document.head.appendChild(script)
      scripts.push(script)
    }
    return () => {
      for (const script of scripts) {
        script.remove()
      }
    }
  }, [post])

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const related = getRelatedPosts(post.slug)

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="blog-page">
        <article className="blog-article blog-page-inner">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden> / </span>
            <Link to="/blog">Blog</Link>
          </nav>

          <header className="blog-article-header">
            <p className="blog-card-meta">
              <span className="blog-card-category">{post.category}</span>
              <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
              <span className="blog-card-read">{post.readMinutes} min read</span>
            </p>
            <h1>{post.title}</h1>
            <p className="blog-article-deck">{post.excerpt}</p>
          </header>

          <BlogProse sections={post.sections} />

          <aside className="blog-cta-box">
            {post.category === METHOD_BLOG_CATEGORY ? (
              <>
                <h2>Follow the method in software</h2>
                <p>
                  True Balance automates the True Balance Method — committed money, virtual reserves
                  and your live position, without spreadsheet logic.
                </p>
              </>
            ) : (
              <>
                <h2>See True Balance in action</h2>
                <p>
                  Explore a demo business with realistic figures, or start a free trial — no payment
                  details required.
                </p>
              </>
            )}
            <div className="blog-index-cta">
              <Link to="/true-balance-method" className="btn-ghost">
                The method
              </Link>
              <Link to="/see-how-it-works" className="btn-primary">
                Try demo
              </Link>
              <Link to="/signup" className="btn-secondary">
                Start free trial
              </Link>
            </div>
          </aside>

          {related.length > 0 ? (
            <aside className="blog-related" aria-label="Related articles">
              <h2>Related guides</h2>
              <ul>
                {related.map((entry) => (
                  <li key={entry.slug}>
                    <Link to={`/blog/${entry.slug}`}>{entry.title}</Link>
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
