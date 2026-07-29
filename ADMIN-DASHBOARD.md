# Admin Dashboard — Build Plan

Handoff document. Everything needed to build the SSS Academy admin dashboard
without re-deriving the architecture.

**Status:** Phase 1 complete. Phase 2 is the entry point.

Deviations from this plan as written, all deliberate — see §14 at the end for
the reasoning:

- `src/app/admin/` uses two route groups, `(auth)` and `(dashboard)`, rather
  than a single guarded `layout.tsx`. The login page cannot sit under
  `requireAdmin()`.
- `src/lib/notices.ts` was folded into `src/lib/cms/notices.ts` instead of being
  converted in place.
- Enquiry statuses, reply channels and the reply Zod schema live in
  `src/lib/cms/enquiry-schema.ts`. `enquiries.ts` is `server-only`; the client
  forms need those values.
- The enquiry list filters and searches in memory over the most recent 500
  documents, so no composite index is needed.

---

## 1. What we're building

A password-protected `/admin` area that lets non-technical staff manage the site
without a redeploy:

- **Enquiry inbox** — read enquiries submitted through the public contact form,
  change status, add internal notes, draft replies.
- **Content CRUD** — courses, placements, team, about copy, FAQs, notices,
  contact details, social links.
- **Audit log** — who changed what, when.

Two audiences, one dashboard:

| Audience | Means |
| --- | --- |
| **Anonymous** | The public site. Reads published content. No dashboard access. |
| **Admin** | Signed in. Full CRUD. |

The `role` field exists in the data model (`owner` / `admin` / `editor`) but only
admin-vs-public is enforced for now. Adding an editor tier later must not require
a refactor.

## 2. Decisions already made — do not relitigate

| Question | Decision |
| --- | --- |
| Image uploads | **Skipped.** Photo fields stay as text paths pointing into `public/img`. Images are committed to the repo as they are today. No Firebase Storage, no `remotePatterns`. |
| Email replies | **Deferred.** Phase 1 reads enquiries from Firestore and stores replies there. Sending is behind a transport interface with a no-op implementation. The mail API gets wired later. |
| Draft/publish | **Edit-live.** Saving publishes immediately. The audit log is the safety net, not a draft workflow. |
| Auth provider | Firebase Auth via the Identity Toolkit REST API. No Firebase client SDK. |
| Database | Firestore, through the existing `firebase-admin` setup. No new database. |

## 3. Current state of the codebase

Read this before writing anything.

- **Next 15.5.22**, App Router, React 19, TypeScript strict. SSR-capable —
  `next.config.ts` has no `output: "export"`.
- **Tailwind v4**, CSS-first. All tokens live in `src/app/globals.css` under
  `@theme`. There is **no `tailwind.config.*`** and **no component library** —
  no shadcn, no Radix. UI primitives are `src/components/ui/Button.tsx` and
  `Section.tsx`, plus `src/lib/cn.ts` (a hand-rolled class joiner, not clsx).
- **All site content is hardcoded** in `src/content/*.ts` as `as const` modules.
- **Firestore is the only backend.** `src/lib/firebase.ts` is `server-only`,
  lazily inits a named app (`"sss-academy"`) from a base64 service account in
  `FIREBASE_SERVICE_ACCOUNT_KEY`, and **returns `null` when unconfigured** so the
  site still renders. Two collections in use: `enquiries` (written by
  `POST /api/enquiry`) and `notices` (read by the announcement bar).
- **No auth, no `middleware.ts`, no email, no admin code.** `/api/enquiry` is the
  only route handler.
- Notices already have a Firestore collection **with no UI** — staff edit them in
  the Firebase console today. This is the cheapest real win on the list.
- Every enquiry is written with `status: "new"` and nothing has ever read it.

## 4. Architecture — the part that matters

### The problem

Every public page is statically prerendered from those `as const` modules and is
fast. If "admin-editable" naively means "query Firestore on every request", we
trade a static site for a slow DB-dependent one and burn a Firestore read per
visitor.

### The pattern: Firestore over static fallback, with tag revalidation

One loader module per entity under `src/lib/cms/`. Each loader:

1. Wraps its fetch in `unstable_cache` with a tag and **no time-based expiry**.
2. Reads Firestore.
3. **Falls back to the existing `src/content/*.ts` module** when Firestore is
   unconfigured, the collection is empty, or the read throws.

```ts
// src/lib/cms/courses.ts
import "server-only";
import { unstable_cache } from "next/cache";

import { courses as staticCourses, type Course } from "@/content/courses";
import { getDb } from "@/lib/firebase";

export const COURSES_TAG = "courses";

async function fetchCourses(): Promise<Course[]> {
  const db = getDb();
  if (!db) return staticCourses;

  try {
    const snap = await db.collection("courses").orderBy("order").get();
    if (snap.empty) return staticCourses;
    return snap.docs.map(toCourse);          // must return plain JSON — see §9
  } catch (error) {
    console.error("[cms/courses] read failed, serving static content", error);
    return staticCourses;
  }
}

export const getCourses = unstable_cache(fetchCourses, ["cms:courses"], {
  tags: [COURSES_TAG],
});
```

On save, the admin server action calls `revalidateTag(COURSES_TAG)`. The next
request refetches once; everyone else serves cache.

**Why this is the right call:**

- Roughly **one Firestore read per content change**, not per pageview.
- The site renders identically to today with zero Firebase config, because the
  static modules remain the fallback. Nothing can break by deploying Phase 2.
- Migration is opt-in per entity. Until someone clicks *Import current content*,
  Firestore is empty and the static fallback serves.

### Seeding

Each entity gets a one-time **Import current content** action in the admin that
writes the static array into Firestore so there is something to edit. Before
that, the admin list view shows the static content read-only with the import
button. Do not auto-seed on boot.

### Derived values become functions

These are module-level constants computed over static arrays today. They move
into the loaders:

| Today | Becomes |
| --- | --- |
| `featuredCourses` | derived inside `getCourses()` consumers or `getFeaturedCourses()` |
| `relatedCourses(slug)` | takes the loaded array as an argument |
| `placementsByPackage`, `highestPackage`, `averagePackage`, `uniqueRoles` | computed in `src/lib/cms/placements.ts` and returned alongside the list |
| `labGroups`, `labOrder` | recomputed from `getCourses()` + static `labs` |

Pure helpers with no data dependency — `durationLabel()`, `trackLabels`,
`initials()` — **stay in `src/content/*.ts` unchanged**. Client components can
keep importing those.

## 5. Auth design

No Firebase client SDK — it would add a large bundle for one login form.

**Login** (server action):

1. `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$FIREBASE_WEB_API_KEY`
   with `{ email, password, returnSecureToken: true }`.
2. Take `idToken` from the response.
3. `getAdminAuth().createSessionCookie(idToken, { expiresIn })` — 5 days.
4. Set as an httpOnly cookie: `secure` in production, `sameSite: "lax"`,
   `path: "/"`.
5. Confirm an `admins/{uid}` document exists. **No document means no access**,
   even with valid Firebase credentials. This is the authorization gate.

**Every request:**

- `middleware.ts` gates `/admin/*` on cookie *presence* only and redirects to
  `/admin/login`. Middleware runs on the Edge runtime where `firebase-admin`
  cannot run, so **middleware is not the security boundary.**
- `requireAdmin()` in `src/lib/admin/auth.ts` runs on Node, calls
  `verifySessionCookie()`, loads `admins/{uid}`, and returns the session or
  redirects. **Every admin page and every admin server action calls it.** No
  exceptions — a missed call is an open door.

Use `verifySessionCookie(cookie, false)` for page reads and `true`
(check-revoked, costs a network call) for mutations.

`src/lib/firebase.ts` currently only exports `getDb`. Add `getAdminAuth()`
against the same named app.

### Security checklist

- [ ] `/admin` returns `noindex, nofollow` and is disallowed in `src/app/robots.ts`
- [ ] Login attempts rate-limited per IP (reuse the pattern in `src/app/api/enquiry/route.ts`)
- [ ] Firestore rules stay deny-all — all access is server-side through the admin SDK, which bypasses rules
- [ ] Generic error text on failed login: never reveal whether an email exists
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` never imported outside a `server-only` module
- [ ] Session cookie cleared server-side on logout, not just in the browser

## 6. Firestore data model

```
admins/{uid}              { email, name, role: 'owner'|'admin'|'editor',
                            createdAt, lastLoginAt }

enquiries/{id}            { name, phone, email, course, message,       ← exists
                            source, status: 'new'|'open'|'replied'|'closed',
                            assignedTo?, userAgent, createdAt, updatedAt }
enquiries/{id}/replies/{rid}
                          { body, channel: 'email'|'whatsapp'|'call'|'note',
                            authorUid, authorName, createdAt,
                            deliveryStatus: 'pending'|'sent'|'failed'|'not-sent' }

notices/{id}              { message, active, href?, cta?,             ← exists
                            order?, expiresAt? }

courses/{slug}            { ...Course, order, updatedAt, updatedBy }
placements/{slug}         { ...Placement, order, published, updatedAt }
team/{id}                 { name, role, photo, bio, tags[], expertise[],
                            order, isFounder, published }
faqs/{id}                 { q, a, order, published }
batches/{id}              { courseSlug, startDate, timing, mode, seats,
                            status, published }

settings/site             { name, legalName, tagline, promise, url,
                            description, shortDescription }
settings/contact          { email, phones[], phoneHrefs[], whatsapp,
                            address{...}, geo{...}, mapEmbed, mapLink, hours[] }
settings/socials          { items: [{ label, href }] }
settings/about            { stats[], story{}, vision{}, mission{},
                            problem{}, approach{}, trustSignals[] }

auditLog/{id}             { actorUid, actorEmail, entity, entityId,
                            action: 'create'|'update'|'delete', before, after, at }
```

`settings` is a collection of singleton documents. Document IDs mirror the
existing slugs for `courses` and `placements` so nothing has to be remapped.

**Cache tags:** `courses`, `placements`, `team`, `faqs`, `settings`, `notices`,
`batches`. Keep them in one exported constant file so a typo can't silently
break revalidation.

## 7. Directory plan

```
src/
  middleware.ts                        NEW — cookie presence gate on /admin/*
  app/
    admin/
      layout.tsx                       requireAdmin() + shell (sidebar, topbar)
      page.tsx                         overview: counts, recent enquiries
      login/page.tsx                   public — must sit outside the guarded layout
      enquiries/page.tsx               list: filter by status, search, CSV export
      enquiries/[id]/page.tsx          detail: thread, status, notes, reply box
      notices/page.tsx
      courses/page.tsx  courses/[slug]/page.tsx
      placements/page.tsx  placements/[slug]/page.tsx
      team/page.tsx
      about/page.tsx
      faqs/page.tsx
      settings/page.tsx
      audit/page.tsx
      _actions/                        server actions, one file per entity
      _components/                     admin-only UI: Field, Table, StatusPill,
                                       RepeatableList, SubmitButton, Toast
  lib/
    admin/
      auth.ts                          requireAdmin, login, logout, session
      audit.ts                         writeAudit()
      tags.ts                          cache tag constants
    cms/
      courses.ts placements.ts team.ts about.ts settings.ts faqs.ts
      notices.ts batches.ts
    mail.ts                            NEW — transport interface + no-op
```

Admin routes need `export const dynamic = "force-dynamic"` so nothing is cached
between admins.

## 8. Tasks

Sizes: **S** under half a day, **M** one to two days, **L** three or more.

### Phase 1 — Auth, shell, enquiry inbox

Highest value, touches zero public rendering, so nothing can break.

- [x] **1.1 (S)** Add `getAdminAuth()` to `src/lib/firebase.ts` against the existing named app. Keep the null-when-unconfigured behaviour.
- [x] **1.2 (S)** `src/lib/admin/tags.ts` — export every cache tag as a const.
- [x] **1.3 (M)** `src/lib/admin/auth.ts` — `login()`, `logout()`, `getSession()`, `requireAdmin()`. Identity Toolkit REST sign-in, session cookie mint, `admins/{uid}` authorization check.
- [x] **1.4 (S)** `src/middleware.ts` — redirect unauthenticated `/admin/*` to `/admin/login`. Matcher must exclude `/admin/login`.
- [x] **1.5 (S)** `src/app/admin/login/page.tsx` — email/password form, server action, rate limited, generic errors.
- [x] **1.6 (M)** `src/app/admin/layout.tsx` — `requireAdmin()`, sidebar nav, signed-in user, logout. `noindex`. In `src/app/robots.ts`, `disallow` is currently the single string `"/api/"` — change it to `["/api/", "/admin/"]`.
- [x] **1.7 (S)** `scripts/create-admin.mjs` — one-off script to create the first Firebase Auth user and its `admins/{uid}` doc. Document usage in the README.
- [x] **1.8 (S)** `src/lib/admin/audit.ts` — `writeAudit()`. Wire it into every mutation from here on.
- [x] **1.9 (M)** `src/lib/cms/enquiries.ts` — list with status filter and pagination, get one, update status, add reply/note. **Not** `unstable_cache`d; this data must always be live.
- [x] **1.10 (L)** `/admin/enquiries` — table with status filter, search by name/phone/email, relative timestamps, unread count. CSV export.
- [x] **1.11 (M)** `/admin/enquiries/[id]` — full detail, reply thread, status dropdown, internal notes, `tel:` and WhatsApp deep links built from `settings/contact`.
- [x] **1.12 (S)** `src/lib/mail.ts` — `sendMail()` transport interface with a logging no-op. Replies persist to Firestore with `deliveryStatus: "not-sent"` regardless.
- [x] **1.13 (M)** `/admin/notices` — full CRUD on the existing collection, plus `revalidateTag("notices")`. Convert `getActiveNotices()` in `src/lib/notices.ts` to use the tag.
- [x] **1.14 (S)** `/admin` overview — enquiry counts by status, last 5 enquiries, active notice count.

**Done when:** an admin can sign in, read every enquiry the live site has captured, move it through `new → open → replied → closed`, leave notes, and publish a notice that appears on the public site without a redeploy.

### Phase 2 — CMS layer, courses, placements

Introduces the loader pattern. Do courses first; it is the hardest and sets the
template.

- [ ] **2.1 (M)** `src/lib/cms/courses.ts` — loader per §4, plus `seedCourses()`.
- [ ] **2.2 (L)** Migrate all `courses` **value** consumers to the loader. See §10 for the full list and the client-component trap.
- [ ] **2.3 (M)** `/admin/courses` list + `/admin/courses/[slug]` editor. Topics are a reorderable repeatable text list. **Must implement the lab topic guard — see §9.**
- [ ] **2.4 (S)** Relax the `course` field in `src/lib/enquiry.ts` to a plain string; validate against the dynamic catalogue inside the route handler instead. See §9.
- [ ] **2.5 (M)** `src/lib/cms/placements.ts` — loader plus the four derived aggregates, plus `seedPlacements()`.
- [ ] **2.6 (M)** Migrate placement consumers; `/admin/placements` CRUD with drag-to-order.
- [ ] **2.7 (S)** Make `src/app/sitemap.ts` async and source from the loaders.

**Done when:** editing a course title in the admin changes `/courses`,
`/courses/[slug]`, the navbar menu and the enquiry form dropdown on the next
request, with Firestore emptied still rendering the current content.

### Phase 3 — About, team, settings, FAQs

- [ ] **3.1 (M)** `src/lib/cms/settings.ts` — `site`, `contact`, `socials`, `about` singletons with per-doc fallback.
- [ ] **3.2 (M)** `/admin/settings` — contact details, phones, address, hours, socials. Repeatable-row editors.
- [ ] **3.3 (M)** `src/lib/cms/team.ts` + `/admin/team`. Generalize the single `founder` object into a collection with `order` and `isFounder`. `FounderBlock.tsx` renders `isFounder` first; the About page gets a team grid below. **Photo is a text path — no upload.**
- [ ] **3.4 (M)** `/admin/about` — story paragraphs, vision, mission, stats, trust signals, problem and approach blocks.
- [ ] **3.5 (S)** `src/lib/cms/faqs.ts` + `/admin/faqs`. Feeds both the accordion and the FAQ JSON-LD.
- [ ] **3.6 (M)** Make `src/lib/schema.ts` data-driven — see §9.
- [ ] **3.7 (S)** `/admin/audit` — read-only paginated log.

### Phase 4 — Batches and metrics

- [ ] **4.1 (M)** `src/lib/cms/batches.ts` + `/admin/batches` — course, start date, timing, mode (online/offline/hybrid), seats.
- [ ] **4.2 (M)** Public "upcoming batches" on `/courses/[slug]` and the home page.
- [ ] **4.3 (S)** Auto-suggest a notice from the next upcoming batch.
- [ ] **4.4 (M)** Dashboard metrics: enquiries per week, status funnel, **top courses by enquiry volume**. The `course` field is already captured on every enquiry and currently thrown away — this is free insight into which courses people actually want.
- [ ] **4.5 (S)** JSON export of all content. Cheap insurance on a free-tier database.

### Phase 5 — Later

- [ ] **5.1** Wire the real mail transport into `src/lib/mail.ts`. Note: Gmail cannot send with an API key — it needs an OAuth2 refresh token (`gmail.send` scope), or a service account with domain-wide delegation if the domain is on Google Workspace. SMTP with an app password is the simplest alternative.
- [ ] **5.2** Admin user management — invite staff, enforce the `editor` role.
- [ ] **5.3** Interview questions CRUD (the 22 in `labs.ts`). **Labs themselves stay in code** — they carry SQL solutions that need testing.
- [ ] **5.4** Per-course SEO fields and syllabus PDF as a lead magnet.
- [ ] **5.5** Public "submit your story" form so placed students enter their own testimonial for admin approval.

## 9. Landmines

Read this section twice. Each of these will cost a day if discovered late.

### Firestore Timestamps break `unstable_cache`

Cached values must be plain JSON. A `Timestamp` or a `DocumentReference` will
either throw or deserialize into garbage. **Every loader must map documents to
plain objects and convert timestamps to `number` (millis) or ISO strings before
returning.** Same rule applies to anything crossing a server-to-client boundary.

### Client components import content directly

Three client components import content module **values**, so that data sits in
the browser bundle today. Once the data is dynamic they must receive it as props
from a server parent:

| Client component | Imports | Fix |
| --- | --- | --- |
| `src/components/site/Navbar.tsx` | `courses`, `trackLabels` | `app/layout.tsx` is a server component — fetch there, pass `courses` down |
| `src/components/site/EnquiryForm.tsx` | `courses`, `contact` | pass from `app/contact/page.tsx` |
| `src/components/site/MobileCtaBar.tsx` | `contact` | pass from `app/layout.tsx` |

`PlacementStories.tsx` is also a client component but already uses
`import type { Placement }` and receives its data as props — **no change
needed**. It is the model to copy for the three above.

`trackLabels`, `durationLabel` and `initials` are static helpers with no data
dependency and can keep being imported directly from `src/content/*`.

### The lab topic constraint

`src/content/labs.ts` ends with `assertLabTopics()`, which runs at module load
and **throws in development** (warns in production) if any lab's `topics` string
is not a verbatim member of its course's `topics[]`.

Courses are moving to Firestore; labs are staying in code. So:

- Leave `assertLabTopics()` validating against the **static**
  `src/content/courses.ts`. It remains a useful guard for code changes.
- In the admin course editor, **before saving a renamed or deleted topic**, look
  up which labs reference that exact string and show
  *"3 playground labs reference this topic and will break."* Require explicit
  confirmation. Do not silently allow it.

The affected labs are discoverable with `labsForCourse(courseSlug)` filtered on
the topic string.

### `enquirySchema` imports `courses` at module load

`src/lib/enquiry.ts` builds a course-slug allowlist from the static array, and it
is imported by the **client** `EnquiryForm`. It cannot become async and it cannot
import server code.

Fix: relax the field to `z.string().trim().max(60).optional().default("")` and
validate the slug against the dynamic catalogue inside
`src/app/api/enquiry/route.ts`, which is already Node runtime and can call the
loader.

### `src/lib/schema.ts` is synchronous

It imports `courses`, `faqs`, `contact`, `site`, `socials` and `stats` at module
level and exports synchronous functions consumed by page components. Convert the
exports to take their data as arguments and have the pages pass loaded data in.
Do not make them async — that ripples further than it needs to.

### `generateStaticParams` with dynamic courses

`app/courses/[slug]/page.tsx` prerenders from the static array. Once it reads the
loader it prerenders whatever is in Firestore at build time. `dynamicParams`
defaults to `true`, so a course added afterwards still renders on demand —
`revalidateTag("courses")` on save is what makes it appear. Do not set
`dynamicParams = false`.

### Everything else

- Both `app/courses/[slug]/page.tsx` and `generateMetadata` in the same file call
  `getCourse`. Two calls, one cached fetch — fine, but do not add a third
  uncached path.
- Route types are Next 15.5 typed routes: `PageProps<"/courses/[slug]">`. Match
  that style in new routes.
- `revalidateTag` cannot be called during render. Server actions and route
  handlers only.
- Admin pages need `export const dynamic = "force-dynamic"`.
- `firebase-admin` is in `serverExternalPackages` and only works on the Node
  runtime. Never import it into middleware or a client component.
- The enquiry rate limiter is per-instance in-memory. Fine for the login form
  too, but it is not real protection on a multi-instance deploy — say so rather
  than implying otherwise.

## 10. Content consumers

Files importing each content module. `type`-only imports need no change.

**`@/content/courses`** — `app/contact/page.tsx`, `app/courses/[slug]/page.tsx`,
`app/courses/page.tsx`, `app/not-found.tsx`, `app/playground/[lab]/page.tsx`,
`app/playground/page.tsx`, `app/sitemap.ts`, `components/home/Offering.tsx`,
`components/home/StatsStrip.tsx`, `components/playground/PlaygroundShell.tsx`,
`components/playground/labs/InterviewLab.tsx`, `components/site/CourseCard.tsx`
(type + helpers only), `components/site/CourseHero.tsx`,
`components/site/EnquiryForm.tsx`, `components/site/Footer.tsx`,
`components/site/Navbar.tsx`, `content/labs.ts`, `lib/enquiry.ts`, `lib/schema.ts`

**`@/content/placements`** — `app/courses/[slug]/page.tsx`,
`app/placements/page.tsx`, `components/home/Hero.tsx`,
`components/home/Proof.tsx`, `components/home/StatsStrip.tsx`,
`components/site/PlacementCard.tsx` (type + helper only),
`components/site/PlacementStories.tsx`

**`@/content/about`** — `app/about/page.tsx`, `components/home/Approach.tsx`,
`components/home/Problem.tsx`, `components/site/Faq.tsx`,
`components/site/FounderBlock.tsx`, `lib/schema.ts`

**`@/content/site`** — `app/contact/page.tsx`, `app/layout.tsx`,
`app/placements/page.tsx`, `app/robots.ts`, `app/sitemap.ts`,
`components/home/Hero.tsx`, `components/site/CourseHero.tsx`,
`components/site/CtaBand.tsx`, `components/site/EnquiryForm.tsx`,
`components/site/Footer.tsx`, `components/site/MobileCtaBar.tsx`,
`lib/schema.ts`

`@/content/labs` and `@/content/lab-seed` are playground-only and **out of
scope** for the CMS.

## 11. Environment variables

Add to `.env.example` with the same explanatory comment style already used there.

```bash
# Existing — base64 service account JSON
FIREBASE_SERVICE_ACCOUNT_KEY=

# NEW — Firebase Web API key, from Project settings -> General -> Web API Key.
# Used server-side only, for the Identity Toolkit password sign-in call.
# Safe to expose in principle, but there is no reason to ship it to the client.
FIREBASE_WEB_API_KEY=

# NEW — absolute site origin, for cookie domain and absolute links in the admin.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Mail credentials arrive in Phase 5.

## 12. Conventions

- **Styling:** reuse the existing `@theme` tokens in `globals.css` —
  `ink-*` for neutrals and `navy-*` for structure on white, `ember-*` for
  destructive and primary actions. Do not introduce a UI library, a CSS-in-JS
  layer, or `clsx`. Use `cn()` from `src/lib/cn.ts`.
- **Validation:** Zod schemas shared between the form and the server action, the
  way `src/lib/enquiry.ts` already does it. One schema per entity in
  `src/lib/cms/<entity>.ts`.
- **Mutations:** server actions, not route handlers, except where an external
  caller needs an endpoint. Every action: `requireAdmin()` → validate →
  write → `writeAudit()` → `revalidateTag()`.
- **Errors:** loaders log and fall back, never throw into a page render. That
  invariant is what keeps the public site up when Firestore misbehaves.
- **Accessibility:** the existing forms set `aria-invalid` / `aria-describedby`
  and move focus to the first invalid field. Match that — see
  `components/site/EnquiryForm.tsx`.
- **Verify before claiming done:** `npx tsc --noEmit && npx eslint . && npm run build`.

## 13. Open questions

- ~~Does `enquiries` need an index for the status filter plus `createdAt`
  ordering?~~ Sidestepped. The list reads one `orderBy("createdAt")` window and
  filters in memory, so only the automatic single-field index is needed.
- Should closed enquiries auto-archive after N months? Free-tier storage is not a
  concern yet, but the list view gets unusable eventually — and the 500-document
  window is the point at which it actually starts hiding things.
- Who is the first admin account, and what email does it use? Still unanswered;
  `scripts/create-admin.mjs` takes it as an argument.

## 14. Phase 1 as built — deviations and why

Four places where the implementation departs from §7 and §8. None of them are
worth reverting, but the next phase should know about them.

### Route groups instead of one admin layout

§7 puts `requireAdmin()` in `app/admin/layout.tsx` and the login page at
`app/admin/login/page.tsx`. Those two are incompatible: the login page would
inherit the guard and redirect to itself. The shipped structure is

```
app/admin/
  layout.tsx              no session needed — metadata, noindex, data-admin-shell
  not-found.tsx           admin-scoped 404, so a bad id does not render the
                          marketing 404 inside the dashboard
  (auth)/login/           public
  (dashboard)/layout.tsx  requireAdmin() + sidebar
  (dashboard)/page.tsx    /admin
  (dashboard)/enquiries/  ...
```

Route groups do not appear in URLs, so every path in §7 is unchanged.

### `src/lib/notices.ts` was removed, not converted

Its contents moved into `src/lib/cms/notices.ts`, which now holds the cached
public loader *and* the admin CRUD for the same collection. Two modules for one
collection was the worse option. `NoticeBar.tsx` is the only import site and was
updated.

One thing worth preserving if that file is touched: **expiry is applied outside
the cache**. Caching `expiresAt > now` freezes the comparison into the cached
value, and an expired notice would keep showing until something else triggered a
revalidation.

### `enquiry-schema.ts` exists because of the `server-only` boundary

`src/lib/cms/enquiries.ts` imports `firebase-admin`, so it is `server-only` and
the build fails the moment a client component imports anything from it — even a
plain `as const` array. The status dropdown and the reply composer both need the
vocabulary and the Zod schema the server action validates against.

`src/lib/cms/enquiry-schema.ts` holds the statuses, channels, labels and
`replySchema`, imports nothing but `zod`, and is re-exported from `enquiries.ts`
so server code has one import path. **Phase 2 will hit this same wall** with
courses — the client `EnquiryForm` and `Navbar` need course data that comes from
a `server-only` loader. §9 already flags the fix (pass it as props), but the
schema-splitting half of the pattern is here.

### The enquiry list is windowed, not queried

`listEnquiries()` fetches the most recent 500 enquiries with a single
`orderBy("createdAt", "desc")` and does status filtering, search, counts and
pagination in memory. Firestore cannot do substring search at all, so search was
always going to be in-memory; doing the status filter there too removes the
composite index from the setup checklist entirely.

The cost is one read set per page load and a hard horizon at 500 documents. The
list page says so when the window fills up. If volume ever justifies it, the fix
is a composite index plus cursor pagination — not a bigger window.

### Smaller notes

- Statuses advance automatically: logging a reply on any channel except `note`
  moves the enquiry to `replied`, and never out of `closed`. A private note is
  not progress.
- `updateStatusAction` and every notice mutation use
  `requireAdmin({ checkRevoked: true })`. Page reads do not. That is the one
  network round trip per mutation §5 asks for.
- The CSV export is a route handler, not a server action, because it returns a
  file. It calls `getSession()` and returns 403 rather than redirecting —
  handing an HTML login page to a download is not useful. It is the one admin
  entry point that does not use `requireAdmin()`, for that reason.
- The public chrome is hidden inside `/admin` with the same
  `body:has([data-admin-shell])` rule the playground uses, at the end of
  `globals.css`. A nested layout cannot remove nodes the root layout rendered.
- `.env.example` did not exist despite the README referencing it — created, and
  `.gitignore` now has `!.env.example` so it is actually committed.
