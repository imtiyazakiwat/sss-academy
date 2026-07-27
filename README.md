# SSS Academy

Next.js rebuild of [sssacademy.in](https://sssacademy.in), replacing the previous
PHP site. Deploys to Vercel with no additional configuration.

## Stack

| Concern    | Choice                                      |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack), React 19 |
| Language   | TypeScript, strict                          |
| Styling    | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Data       | Static content modules + Firestore (optional) |
| Validation | Zod, shared between client and route handler |
| Hosting    | Vercel                                       |

There is no animation library. Scroll reveals, parallax, count-ups and the
hero's 3D scene are built on `IntersectionObserver`, a single shared
`requestAnimationFrame` loop and CSS 3D transforms. All of it is
compositor-only and disabled under `prefers-reduced-motion`.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npx eslint .         # lint
npx tsc --noEmit     # typecheck
```

## Project layout

```
src/
  app/
    page.tsx                  home (narrative: hero -> problem -> approach ->
                              offering -> proof -> founder -> FAQ -> CTA)
    courses/page.tsx          catalogue grouped by track
    courses/[slug]/page.tsx   course detail, prerendered for all 11 courses
    placements/page.tsx       all 23 placement stories
    about/page.tsx            story, vision, mission, founder
    contact/page.tsx          enquiry form, address, hours, map
    api/enquiry/route.ts      enquiry capture (Node runtime)
    sitemap.ts robots.ts
  content/                    all copy and data, typed
    site.ts courses.ts placements.ts about.ts
  components/
    motion/                   Reveal, Parallax, CountUp
    visual/HeroScene.tsx      CSS 3D hero
    site/                     navbar, footer, cards, form, CTA band
    ui/                       Button, Section primitives
  lib/                        firebase, notices, enquiry schema, JSON-LD
```

### Content

Everything in `src/content` was extracted from the legacy PHP site during a
content audit: 11 courses with durations and descriptions, all 23 placement
testimonials with packages and roles, the founder bio, the achievement stats,
and the full contact block. Course descriptions and testimonial quotes are
verbatim. No placement figures or company names were invented — the source
published companies as "MNC", so that is what appears.

## Firebase

Optional. Without credentials every page still renders; only enquiry
persistence and the announcement bar are inactive.

Set `FIREBASE_SERVICE_ACCOUNT_KEY` (see `.env.example`) to enable:

- **`enquiries`** — written by `POST /api/enquiry`. Server-side only via
  `firebase-admin`, so the collection can be locked to deny all client access.
- **`notices`** — read by the announcement bar. Documents:

  ```
  { message: string, active: boolean,
    href?: string, cta?: string, order?: number, expiresAt?: Timestamp }
  ```

  Nothing renders when there is no active notice, so urgency on the site is
  always something a human actually published.

Suggested Firestore rules, given all access is server-side through the admin
SDK (which bypasses rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

## Deploying

Import the repository into Vercel. Framework detection handles the rest; add
`FIREBASE_SERVICE_ACCOUNT_KEY` under Environment Variables if using Firestore.

`next.config.ts` holds permanent redirects from the old `.php` URLs
(`/about.php`, `/courses.php`, `/contact.php`, `/testimonials.php`) so existing
search rankings and inbound links carry over.

## Accessibility & performance notes

- Every page is statically prerendered; only `/api/enquiry` is dynamic.
- Images go through `next/image` with explicit dimensions, so there is no CLS.
- The enquiry form validates client-side and server-side with the same schema,
  reports errors via `aria-invalid` / `aria-describedby`, and moves focus to the
  first invalid field.
- The FAQ accordion is native `<details>`, so it works before hydration.
- Scroll reveals are forced visible under `<noscript>`.
- Fonts are self-hosted through `next/font` with only the weights in use.
