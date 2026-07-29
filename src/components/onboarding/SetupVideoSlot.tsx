import { toVideoEmbedUrl } from '../../utils/videoEmbed'

/** Onboarding teaching video — plays when a URL is set; otherwise intentional placeholder. */
export function SetupVideoSlot({
  label = 'Walkthrough',
  videoUrl,
}: {
  label?: string
  videoUrl?: string
}) {
  const hasVideo = Boolean(videoUrl?.trim())

  return (
    <div
      className={`setup-video-slot setup-video-slot--open${hasVideo ? ' setup-video-slot--live' : ''}`}
      aria-hidden={hasVideo ? undefined : true}
    >
      <div className="setup-video-slot-frame">
        {hasVideo && videoUrl ? (
          <iframe
            className="setup-video-slot-embed"
            src={toVideoEmbedUrl(videoUrl)}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <div className="setup-video-slot-play">▶</div>
            <div className="setup-video-slot-copy">
              <strong>{label}</strong>
              <span>Video coming soon</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
