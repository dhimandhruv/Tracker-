# Switch Tracker

A personal job-switch tracker: a roadmap to a target date, a LeetCode practice log with a
contribution-style heatmap, and an application pipeline.

It began as a single 40 KB HTML file that stored everything in the browser. This is that app
ported to Next.js, with GitHub sign-in and per-user cloud sync, so the same tracker works on a
laptop and a phone. The UI is a deliberate one-for-one port: same layout, copy, fonts, colours
and dark mode.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript (strict) |
| UI | React client components, hand-written CSS (no Tailwind, no component library) |
| Fonts | `next/font/google` — Bricolage Grotesque, Figtree |
| Auth | Auth.js v5 (NextAuth), GitHub provider, **database** sessions |
| Database | Neon Postgres (serverless) via Prisma 7 |
| Validation | Zod |
| Tests | Vitest |
| Hosting | Vercel |

## Architecture

```
Browser (React client)
  ├─ localStorage cache (key: dhruv-switch-tracker-v1)  ← always written, works offline/signed-out
  └─ fetch /api/state  (GET on load, PUT debounced 700 ms)
        │
Next.js route handlers (server)
  ├─ auth() → session.user.id  (401 if missing)
  ├─ Zod validation + 200 KB body limit
  └─ Prisma → Neon Postgres: one TrackerState row per user
```

### How sync works

1. The app renders immediately from `localStorage` (or defaults), so there is no loading state.
2. If signed in, it `GET`s `/api/state`. Whichever copy has the newer `updatedAt` wins: a newer
   server copy replaces the local one, a newer local copy gets uploaded.
3. Every change stamps `updatedAt = Date.now()`, writes `localStorage`, re-renders, then schedules
   a debounced `PUT` (700 ms). Only one request is ever in flight; changes made during a request
   are sent in one follow-up request afterwards.
4. The server accepts a `PUT` only if `incoming.updatedAt >= stored.updatedAt`. Otherwise it
   returns `409` with the stored state, and the client adopts it.
5. On window focus the client re-`GET`s and applies rule 2, which is how a phone and a laptop stay
   in sync without websockets.
6. The header shows the current state: *Saved to your account*, *Saving…*, *Saved in this browser*
   (signed out), or *Couldn't save to your account. Saved in this browser.*

Signed out, the whole app still works against `localStorage` alone. On first sign-in, an existing
browser-only tracker is uploaded automatically, because rule 2 treats "server has no row" as
"local wins".

## Local setup

```bash
npm install                       # also runs `prisma generate`
cp .env.example .env              # then fill in the values below
npx prisma migrate dev            # create the tables
npm run dev                       # http://localhost:3000
```

### Environment variables

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`). Used at runtime. |
| `DATABASE_URL_UNPOOLED` | Neon **direct** connection string. Used for migrations, which cannot run through the pooler. |
| `AUTH_SECRET` | Session/token signing key. Generate with `npx auth secret`. |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID. |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret. |

`.env*` is gitignored; only `.env.example`, with placeholders, is committed.

For the GitHub OAuth app, the callback URL must be
`<origin>/api/auth/callback/github` — so `http://localhost:3000/api/auth/callback/github` locally.
A single OAuth app accepts up to 10 callback URLs, so the local and production URLs can share one.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checks as well) |
| `npm run lint` | ESLint |
| `npm test` | Vitest (pure logic and schema validation) |

## Deploying to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new); Next.js is auto-detected.
2. Add all five environment variables from the table above to the Vercel project.
3. Set the build command so migrations run on every deploy:

   ```
   prisma migrate deploy && next build
   ```

   `migrate deploy` only applies committed migrations and never generates or resets anything, which
   is what makes it safe to run automatically on each deploy. (`migrate dev` is the opposite — it
   authors new migrations and can prompt to reset the database, so it belongs on a developer's
   machine only.)
4. Add the production callback URL `https://<project>.vercel.app/api/auth/callback/github` to the
   GitHub OAuth app.

Auth.js detects the deployment URL from Vercel's own environment variables, so `AUTH_URL` is not
normally needed. If sign-in reports an untrusted host, set `AUTH_TRUST_HOST=true`.

## Design decisions

**Why last-writer-wins on `updatedAt`.** This is a single-user app: the only conflict is the same
person editing on two devices, usually minutes or hours apart. Real merging would mean per-field
timestamps or CRDTs, which is a large amount of machinery to resolve a conflict that is rare and
low-stakes. Comparing one `updatedAt` is a few lines, is easy to reason about, and its worst case
is losing one device's edits made while offline — acceptable here, and the `409` response at least
makes the loser adopt a consistent state rather than silently diverging. `updatedAt` lives in its
own `BigInt` column rather than only inside the JSON so Postgres can compare it directly.

**Why a `localStorage` cache.** It does the work of three features at once: the app renders
instantly with no spinner, it keeps working offline, and it makes signed-out mode a first-class
state rather than a degraded one. It also means the network is never on the critical path of a
click — a ticked checkbox is saved locally before the request is even scheduled.

**Why database sessions rather than JWTs.** A JWT session avoids a database read per request, but
it cannot be revoked before it expires, and its contents go stale. Since every request already
touches Postgres to read or write tracker state, the extra session read costs little, and it means
the session row is the single source of truth for who the user is. The tracker keys its data on
`session.user.id`, so getting that wrong matters more than saving a query.

**Why validate with Zod at the boundary.** `normalize()` in `src/lib/tracker.ts` is deliberately
forgiving, because it has to accept whatever an old `localStorage` copy contains. The API is the
opposite: it is a trust boundary, so `src/lib/schema.ts` rejects rather than coerces, and bounds
every string, array and record. The user id always comes from the session and never from the
request body.

**Why one JSON blob instead of normalised tables.** The state is only ever read and written whole,
by one user. Splitting `done`, `log` and `apps` into tables would add joins and migrations without
enabling a single query the app actually makes.

## Project layout

```
prisma/schema.prisma        Auth.js adapter models + TrackerState
prisma7.config.ts           Prisma 7 CLI config (schema path, direct connection)
src/auth.ts                 Auth.js configuration
src/app/api/auth/…          Auth.js endpoints
src/app/api/state/route.ts  GET/PUT sync API
src/app/globals.css         CSS ported from the original HTML
src/components/             RouteTimeline, Tabs, the five tab views, Checkbox, SyncStatus, AuthButton
src/hooks/useTracker.ts     State ownership and the sync rules above
src/lib/plan-data.ts        Milestones, weeks, ~92 LeetCode problems, resume/topic data
src/lib/tracker.ts          Pure logic: normalize, date helpers, streak, merge
src/lib/schema.ts           Zod schema for the API
switch-tracker.html         The original single-file app, kept for reference
```

## Notes on versions

- **Prisma is pinned to 7.10.0.** At the time of writing, Prisma's `latest` npm tag points at an
  `8.0.0-rc` release candidate, so an unpinned install would pull a pre-release. Prisma 7 also
  requires a driver adapter (`@prisma/adapter-neon`), has no query engine binary, and reads the
  connection string from `prisma7.config.ts` rather than `schema.prisma`.
- **Auth.js v5 is still published under the `beta` tag.** v5 is what provides the `auth()` helper
  and the App Router handlers used here; the beta declares support for Next.js 16.
