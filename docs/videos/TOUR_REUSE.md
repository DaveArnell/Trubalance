# Guided tour video reuse

Do **not** film a second full set for page tours. Reuse onboarding masters; the tour card title/body already contextualise the step.

Mapping is coded in [`src/content/videos.ts`](../src/content/videos.ts) as `TOUR_STEP_VIDEO_KEY`. [`src/content/pageTours.ts`](../src/content/pageTours.ts) resolves `videoUrl` / `videoLabel` from that map at runtime via `getTourStepVideo`.

| Tour step id | Reuses library key |
|--------------|--------------------|
| setup-balances, cf-hero, st-structure | onboarding-structure |
| setup-committed, cf-commitments | onboarding-monthly-costs |
| cf-views | onboarding-month-view |
| setup-due, cf-due | onboarding-due |
| setup-receipts, cf-receipts | onboarding-receipts |
| setup-true-balance | onboarding-welcome |
| tr-chart, tr-log | onboarding-trends |
| rp-*, rpi-* | onboarding-reserve |

When a library `url` is empty, GuidedTour keeps showing “Video coming soon”. When you publish a clip, set the URL once on the library entry — every mapped tour step updates automatically.
