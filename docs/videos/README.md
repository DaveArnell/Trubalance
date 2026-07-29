# Video production index

| Priority | Clip | Doc | Library key | Status |
|----------|------|-----|-------------|--------|
| 1 | Homepage / primary ad | [HOMEPAGE.md](./HOMEPAGE.md) | `homepage` | Script ready — paste Vimeo URL when published |
| 2 | Core onboarding (6) | [ONBOARDING.md](./ONBOARDING.md) | `onboarding-welcome` … `onboarding-trends` | Scripts ready |
| 3 | Tour reuse | [TOUR_REUSE.md](./TOUR_REUSE.md) | same keys | Wired in app |
| 4 | Month view, Reserve, Statement | [ONBOARDING.md](./ONBOARDING.md) | `onboarding-month-view`, `onboarding-reserve`, `onboarding-statement` | Scripts ready |

**Engineering:** URLs live in [`src/content/videos.ts`](../src/content/videos.ts). Homepage player: `HomeHeroVideo`. Onboarding: `SetupVideoSlot`. Tours: `GuidedTour` + `getTourStepVideo`.
