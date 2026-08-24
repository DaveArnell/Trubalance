import { CanonicalLink } from '../CanonicalLink'
import { HOME_VIDEO } from '../../content/homePage'
import {
  PRODUCT_MONITOR_IMAGE,
  PRODUCT_MONITOR_IMAGE_ALT,
  PRODUCT_MONITOR_IMAGE_HEIGHT,
  PRODUCT_MONITOR_IMAGE_WIDTH,
} from '../../content/marketingSeo'
import { getVideoLabel, getVideoUrl } from '../../content/videos'
import { toVideoEmbedUrl } from '../../utils/videoEmbed'

/**
 * Homepage product snapshot: short caption + monitor image + CTAs.
 * Swaps to the walkthrough video when a homepage video URL is published.
 */
export function HomeHeroVideo() {
  const url = getVideoUrl('homepage')
  const label = getVideoLabel('homepage')

  return (
    <section
      className="home-band home-band--video home-band--mist"
      id="see-cash-prophet"
      aria-labelledby="see-cash-prophet-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
        <div className="home-band-head home-band-head--center home-video-head">
          <h2 id="see-cash-prophet-heading">{HOME_VIDEO.heading}</h2>
          <p className="home-video-lead">{HOME_VIDEO.lead}</p>
        </div>
        <div className={`home-video-frame${url ? '' : ' home-video-frame--snapshot'}`}>
          {url ? (
            <iframe
              className="home-video-embed"
              src={toVideoEmbedUrl(url)}
              title={label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <figure className="home-video-snapshot">
              <img
                src={PRODUCT_MONITOR_IMAGE}
                alt={PRODUCT_MONITOR_IMAGE_ALT}
                width={PRODUCT_MONITOR_IMAGE_WIDTH}
                height={PRODUCT_MONITOR_IMAGE_HEIGHT}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="home-video-snapshot-actions">
                <CanonicalLink to="/see-how-it-works" className="btn-primary btn-large">
                  Try a live demo
                </CanonicalLink>
                <CanonicalLink to="/signup" className="btn-secondary btn-large">
                  Start free
                </CanonicalLink>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
