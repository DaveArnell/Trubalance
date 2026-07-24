import { useEffect } from 'react'
import { COMPANY_INFO } from '../content/companyInfo'
import {
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_HEIGHT,
  SITE_OG_IMAGE_WIDTH,
} from '../content/marketingSeo'

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
  /** Accessible / social alt text for the share image. */
  imageAlt?: string
}

function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${COMPANY_INFO.website}${path}`
}

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

function brandTitle(title: string): string {
  if (title.includes('Cash Prophet') || title.includes('True Balance')) return title
  return `${title} | Cash Prophet`
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
  imageAlt,
}: PageMeta) {
  useEffect(() => {
    const fullTitle = brandTitle(title)
    const url = absoluteUrl(path || '/')
    const imagePath = image ?? SITE_OG_IMAGE
    const ogImage = absoluteUrl(imagePath)
    const ogAlt = imageAlt ?? SITE_OG_IMAGE_ALT
    const imageType = imagePath.endsWith('.webp')
      ? 'image/webp'
      : imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')
        ? 'image/jpeg'
        : 'image/png'

    document.title = fullTitle
    upsertMeta('description', description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('og:site_name', COMPANY_INFO.productName, 'property')
    upsertMeta('og:locale', 'en_GB', 'property')
    upsertMeta('og:image', ogImage, 'property')
    upsertMeta('og:image:secure_url', ogImage, 'property')
    upsertMeta('og:image:type', imageType, 'property')
    upsertMeta('og:image:width', String(SITE_OG_IMAGE_WIDTH), 'property')
    upsertMeta('og:image:height', String(SITE_OG_IMAGE_HEIGHT), 'property')
    upsertMeta('og:image:alt', ogAlt, 'property')
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', ogImage)
    upsertMeta('twitter:image:alt', ogAlt)

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
    } else {
      removeMeta('article:published_time', 'property')
    }
    if (type === 'article' && modifiedTime) {
      upsertMeta('article:modified_time', modifiedTime, 'property')
    } else {
      removeMeta('article:modified_time', 'property')
    }
  }, [title, description, path, type, publishedTime, modifiedTime, noindex, image, imageAlt])
}
