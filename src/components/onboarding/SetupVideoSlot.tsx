/** Placeholder for onboarding teaching videos. */
export function SetupVideoSlot({
  label = 'Watch video',
}: {
  label?: string
}) {
  return (
    <div className="setup-video-slot" aria-hidden="true">
      <div className="setup-video-slot-play">▶</div>
      <div className="setup-video-slot-copy">
        <strong>{label}</strong>
        <span>Coming soon</span>
      </div>
    </div>
  )
}
