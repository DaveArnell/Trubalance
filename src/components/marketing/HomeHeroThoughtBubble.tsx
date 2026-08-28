const MIND_BUBBLE = '/hero-mind-bubble.png'

/** Hand-drawn “finances in your head” illustration for the hero stack. */
export function HomeHeroThoughtBubble() {
  return (
    <div className="home-hero-mind-art">
      <img
        src={MIND_BUBBLE}
        alt="Thought bubble showing bank balance £33,350 with rent, wages, utilities, VAT, insurance and other bills, asking how much is actually left today"
        width={1200}
        height={900}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  )
}
