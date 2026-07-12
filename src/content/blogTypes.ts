export type BlogSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'faq'; heading?: string; items: { q: string; a: string }[] }

export interface BlogPost {
  slug: string
  title: string
  metaDescription: string
  keywords: string[]
  publishedAt: string
  updatedAt: string
  category: string
  readMinutes: number
  excerpt: string
  sections: BlogSection[]
  relatedSlugs: string[]
}
