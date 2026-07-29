import { HOME_VIDEO } from '../../content/homePage'
import { getVideoLabel, getVideoUrl } from '../../content/videos'
import { toVideoEmbedUrl } from '../../utils/videoEmbed'

/**
 * Homepage hero video band — Vimeo when published, intentional placeholder until then.
 * Does not replace the animated hero graphs.
 */
export function HomeHeroVideo() {
  const url = getVideoUrl('homepage')
  const label = getVideoLabel('homepage')

  return (
    <section
      className="home-band home-band--video home-band--mist"
      id="see-cash-prophet"
      aria-labelledby="home-video-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
        <div className="home-band-head home-band-head--center home-video-head">
          <h2 id="home-video-heading">{HOME_VIDEO.heading}</h2>
          <p className="home-video-lead">{HOME_VIDEO.lead}</p>
        </div>
        <div className="home-video-frame">
          {url ? (
            <iframe
              className="home-video-embed"
              src={toVideoEmbedUrl(url)}
              title={label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="home-video-placeholder" role="status">
              <span className="home-video-play" aria-hidden>
                ▶
              </span>
              <p>Video coming soon</p>
              <p className="home-video-placeholder-hint">{HOME_VIDEO.placeholderHint}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
