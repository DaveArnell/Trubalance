import { useEffect } from 'react'
import { COMPANY_INFO } from '../content/companyInfo'

export interface PageMeta {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
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
}: PageMeta) {
  useEffect(() => {
    const fullTitle = title.includes('True Balance') ? title : `${title} | True Balance`
    const url = `${COMPANY_INFO.website}${path}`

    document.title = fullTitle
    upsertMeta('description', description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', description)
    upsertCanonical(url)

    if (type === 'article' && publishedTime) {
      upsertMeta('article:published_time', publishedTime, 'property')
    }
    if (type === 'article' && modifiedTime) {
      upsertMeta('article:modified_time', modifiedTime, 'property')
    }
  }, [title, description, path, type, publishedTime, modifiedTime])
}
