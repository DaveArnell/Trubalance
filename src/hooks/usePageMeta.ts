import { useEffect } from 'react'
import { COMPANY_INFO } from '../content/companyInfo'

export interface PageMeta {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  /** When true, sets robots noindex (app, demo, auth flows). */
  noindex?: boolean
  /** Absolute or site-relative OG image; defaults to /og-image.png on the live domain. */
  image?: string
}

const DEFAULT_OG_IMAGE = `${COMPANY_INFO.website}/og-image.png`

function upsertMeta(property: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function removeMeta(property: string, attribute: 'name' | 'property' = 'name') {
  document.querySelector(`meta[${attribute}="${property}"]`)?.remove()
}

function upsertCanonical(href: string) {
  let element = document.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export function usePageMeta({
  title,
  description,
  path = '',
  type = 'website',
  publishedTime,
  modifiedTime,
  noindex = false,
  image,
}: PageMeta) {
  useEffect(() => {
    const fullTitle = title.includes('True Balance') ? title : `${title} | True Balance`
    const url = `${COMPANY_INFO.website}${path}`
    const ogImage = image?.startsWith('http') ? image : image ? `${COMPANY_INFO.website}${image}` : DEFAULT_OG_IMAGE

    document.title = fullTitle
    upsertMeta('description', description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('og:site_name', COMPANY_INFO.productName, 'property')
    upsertMeta('og:image', ogImage, 'property')
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', ogImage)

    if (noindex) {
      upsertMeta('robots', 'noindex, nofollow')
      removeMeta('googlebot')
    } else {
      upsertMeta('robots', 'index, follow')
      removeMeta('googlebot')
    }

    if (noindex) {
      document.querySelector('link[rel="canonical"]')?.remove()
    } else {
      upsertCanonical(url)
    }

    if (type === 'article' && publishedTime) {
      upsertMeta('article:published_time', publishedTime, 'property')
    }
    if (type === 'article' && modifiedTime) {
      upsertMeta('article:modified_time', modifiedTime, 'property')
    }
  }, [title, description, path, type, publishedTime, modifiedTime, noindex, image])
}
