/** Always-visible placeholder for onboarding teaching videos. */
export function SetupVideoSlot({
  label = 'Walkthrough',
}: {
  label?: string
}) {
  return (
    <div className="setup-video-slot setup-video-slot--open" aria-hidden="true">
      <div className="setup-video-slot-frame">
        <div className="setup-video-slot-play">▶</div>
        <div className="setup-video-slot-copy">
          <strong>{label}</strong>
          <span>Video coming soon</span>
        </div>
      </div>
    </div>
  )
}
