/**
 * Optimized marketing raster with WebP source and keyword-conscious alt text.
 * Prefer this over bare <img> for any static product/share visual.
 */
export function MarketingPicture({
  webpSrc,
  fallbackSrc,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority,
}: {
  webpSrc: string
  fallbackSrc: string
  alt: string
  width: number
  height: number
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
}) {
  return (
    <picture className={className}>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        width={width}
        height={height}
        alt={alt}
        decoding="async"
        loading={loading}
        fetchPriority={fetchPriority}
      />
    </picture>
  )
}

export const OG_IMAGE_ALT =
  'Cash Prophet Balance for UK businesses — one trusted financial number after meaningful commitments'

export const LOGO_MARK_ALT =
  'Cash Prophet logo — one trusted financial number for UK business owners'
