/** Turn a watch URL into an embeddable iframe src (Vimeo / YouTube). */
export function toVideoEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}?rel=0`
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '')
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      if (id) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    /* use as-is */
  }
  return url
}
