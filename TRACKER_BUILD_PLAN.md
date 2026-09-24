# Build plan: Switch Tracker → Next.js app with login + cloud sync on Vercel

> **How to use this file:** put this file and `switch-tracker.html` in an empty folder, open Claude Code in that folder, and say:
> **"Read TRACKER_BUILD_PLAN.md and execute it phase by phase. Stop at every CHECKPOINT and wait for me."**

---

## 0. Instructions for Claude Code

You are converting a working single-file HTML app (`switch-tracker.html`) into a production-ready Next.js app deployed on Vercel, with GitHub login and per-user cloud sync.

Rules:

1. **Work phase by phase.** At the start, show a short plan and the final file tree, then wait for approval.
2. **Stop at every `CHECKPOINT`.** Tell the user exactly what to do (links, values to copy), then wait. Never invent or guess secrets.
3. **Preserve the UI exactly.** Same layout, colours, fonts, copy, tabs, behaviour and dark mode. This is a port, not a redesign.
4. **Use current, stable versions.** Before installing, check the latest stable versions and current docs of Next.js, Auth.js, Prisma and the Neon adapter. If an API in this plan has changed, follow the current docs and tell the user what you changed.
5. **Never commit secrets.** `.env*` goes in `.gitignore`. Provide `.env.example` with placeholder values only.
6. **Keep it simple and explainable.** The user will discuss this project in interviews, so prefer clear code over clever code, and add short comments where logic isn't obvious.
7. After each phase: run `npm run lint`, `npm run build` (and tests once they exist), fix all errors, then summarise what changed.

---

## 1. What the app does (source of truth: `switch-tracker.html`)

Read `switch-tracker.html` fully before writing code. It contains:

- **Constants:** `MILESTONES`, `WEEKS`, `WEEKLY`, `PROBLEMS` (~100 LeetCode problems), `RESUME`, `TOPICS`, `STAGES`, `ACTIVE`, `CHANNELS`.
- **State shape:**

  ```ts
  type TrackerState = {
    v: 1;
    updatedAt: number;            // ms epoch, set on every change
    solved: number;               // total LeetCode solved (starts at 200)
    rating: string;               // contest rating, free text
    done: Record<string, true>;   // checklist keys: "p:238", "t:w1:0", "wk:2026-09-21:3", "r:0", "s:0:1", "m:2"
    log: Record<string, number>;  // "YYYY-MM-DD" -> problems solved that day
    apps: Application[];
  };
  type Application = {
    id: string; company: string; role: string; channel: string;
    stage: string; date: string; ctc: string; notes: string;
  };
  ```

- **Views:** route timeline hero, tabs (Overview, Roadmap, LeetCode, Applications, Resume & skills), heatmap, pipeline table.
- **Storage today:** claude.ai `window.claude.use("db")` with a `localStorage` fallback. **Remove all `window.claude` code**; it doesn't exist outside claude.ai.

The existing `normalize()` function and the data format must stay compatible, so users can import their old localStorage data (key `dhruv-switch-tracker-v1`) with no migration.

---

## 2. Target stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript (strict) |
| UI | React client components; CSS copied from the HTML into `app/globals.css` (no Tailwind, no UI library) |
| Fonts | `next/font/google`: Bricolage Grotesque and Figtree (same weights as the HTML) |
| Auth | Auth.js (NextAuth v5) with the GitHub provider, database sessions via the Prisma adapter |
| Database | Neon Postgres (serverless) via Prisma |
| Validation | Zod |
| Tests | Vitest |
| Hosting | Vercel |

---

## 3. Architecture

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

**Sync rules (implement exactly):**

1. On load, render immediately from localStorage (or defaults).
2. If signed in, `GET /api/state`. If the server copy has a newer `updatedAt`, replace local state; if the local copy is newer (or the server has none), `PUT` the local copy.
3. Every change sets `updatedAt = Date.now()`, writes localStorage, re-renders, then schedules a debounced `PUT` (700 ms). Only one request in flight at a time; if changes happen during a request, send the latest state after it finishes.
4. Server `PUT` stores the state **only if** `incoming.updatedAt >= stored.updatedAt`; otherwise it returns `409` with the stored state, and the client adopts the stored state.
5. On window focus, re-`GET` and apply rule 2 (so phone ↔ laptop stays in sync without websockets).
6. Show the status next to the title, using the existing `.sync` styles: `Saved to your account` (ok), `Saving…`, `Saved in this browser` (signed out), `Couldn't save to your account. Saved in this browser.` (error).

**Signed-out mode:** the full app works with localStorage only, plus a "Sign in with GitHub to sync" button in the header. After signing in, apply rule 2.

---

## 4. Phases

### Phase 1: Scaffold and port the UI (no auth, no DB)

1. Create the Next.js app in the current folder (TypeScript, ESLint, App Router, `src/` directory, no Tailwind).
2. Move constants into `src/lib/plan-data.ts` (typed).
3. Move pure logic into `src/lib/tracker.ts`: `DEFAULT`, `normalize`, date helpers (`iso`, `mondayOf`, `today`, `dayDiff`, `fmt`), `currentWeek`, `streak`, `logSum`, `countDone`, and a `mergeByUpdatedAt(local, remote)` helper.
4. Build components under `src/components/`: `RouteTimeline`, `Tabs`, `OverviewTab`, `RoadmapTab`, `LeetCodeTab`, `ApplicationsTab`, `SkillsTab`, `Checkbox`, `SyncStatus`.
5. Put state in a `useTracker()` hook (`src/hooks/useTracker.ts`) with `localStorage` persistence only for now. Guard `localStorage` in `try/catch` and only access it on the client.
6. Copy the CSS verbatim into `globals.css`; keep class names so styles apply unchanged. Keep the `viewport-fit=cover` viewport and safe-area padding.
7. Avoid hydration mismatches: date-dependent UI (today marker, current week, heatmap) must render after mount.
8. Remove all `window.claude` code.

**Acceptance:** `npm run dev` shows a pixel-equivalent copy of the HTML app; ticking boxes, +1/−1, adding applications and changing stages all work and survive reload.

### Phase 2: Tests for the logic

Add Vitest tests in `src/lib/__tests__/tracker.test.ts` for: `normalize` (bad input → defaults, keeps valid fields), `mergeByUpdatedAt` (newer wins, ties prefer remote), `streak` (including "no problem today yet"), `mondayOf`, and `logSum`. Add `"test": "vitest run"` to `package.json`.

### ⛔ CHECKPOINT 1: Neon database

Tell the user to:

1. Create a free project at https://neon.tech (region close to India, e.g. Singapore, if available).
2. Copy the **pooled** connection string and the **direct** connection string.
3. Paste them into a new `.env.local` as `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).

Wait until the user confirms.

### Phase 3: Database with Prisma

1. Install Prisma and set up `prisma/schema.prisma` (Postgres, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`).
2. Include the Auth.js Prisma adapter models (`User`, `Account`, `Session`, `VerificationToken`) as in the current Auth.js docs, plus:

   ```prisma
   model TrackerState {
     userId    String   @id
     data      Json
     updatedAt BigInt   // client-side ms epoch, used for conflict resolution
     savedAt   DateTime @updatedAt
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }
   ```

3. Create `src/lib/prisma.ts` with the standard singleton pattern (avoid multiple clients in dev).
4. Run the first migration (`prisma migrate dev --name init`). Add `"postinstall": "prisma generate"` so Vercel builds work.

### ⛔ CHECKPOINT 2: GitHub OAuth app and auth secret

Tell the user to:

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. Copy the Client ID and generate a Client Secret.
3. Add to `.env.local`: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `AUTH_SECRET` (generate it with `npx auth secret` or `openssl rand -base64 32`).

Wait until the user confirms.

### Phase 4: Authentication

1. Install and configure Auth.js (v5) in `src/auth.ts` with the GitHub provider and Prisma adapter; export `auth`, `signIn`, `signOut`, `handlers`.
2. Add `src/app/api/auth/[...nextauth]/route.ts`.
3. Header: show "Sign in with GitHub to sync" when signed out; show the GitHub avatar/name and a "Sign out" button when signed in. Keep it small and styled with the existing tokens (`.btn`, `.btn.small`).
4. Make sure `session.user.id` is available on the server.

### Phase 5: Sync API and client sync

1. `src/lib/schema.ts`: a Zod schema for `TrackerState` (bounded strings, max 500 applications, max 5,000 `done` keys, max 1,000 `log` entries).
2. `src/app/api/state/route.ts`:
   - `GET` → 401 if signed out; returns `{ state }` or `{ state: null }`.
   - `PUT` → 401 if signed out; reject bodies over 200 KB (413); validate with Zod (400 with a short message); apply sync rule 4 (409 with stored state if stale); upsert; return `{ state, savedAt }`.
   - Always use the user id from the session, never from the request body.
3. Update `useTracker()` to implement sync rules 1–6 from section 3.
4. Add a small "Import from this browser" safety net: if a signed-in user has no server state, silently upload the local copy (rule 2 already covers this; verify it).

**Acceptance:** sign in on two browsers; a change in one appears in the other after focusing it; signing out keeps the app working locally; tampered or oversized requests are rejected.

### Phase 6: Polish and hardening

- Add `export const dynamic = "force-dynamic"` to the API route; set `Cache-Control: no-store` on responses.
- Add basic security headers in `next.config` (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`).
- Metadata: title "Switch Tracker", a compass emoji favicon (🧭) via `app/icon.svg` or similar.
- Add `.env.example`, update `.gitignore`, and write a `README.md` (what it is, stack, architecture diagram from section 3, local setup, env vars, deploy steps, and a short "Design decisions" section: why last-writer-wins by `updatedAt`, why localStorage cache, why database sessions).
- Run lint, tests and `npm run build`; fix everything.

### ⛔ CHECKPOINT 3: GitHub repository

Tell the user to create an empty GitHub repo (private is fine), then run `git init`, commit, add the remote and push. Wait until done.

### ⛔ CHECKPOINT 4: Deploy on Vercel

Tell the user to:

1. Import the repo at https://vercel.com/new (framework auto-detected as Next.js).
2. Add environment variables in Vercel: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` (and `AUTH_TRUST_HOST=true` if the current Auth.js docs require it on Vercel).
3. Make sure migrations run on deploy: set the build command to `prisma migrate deploy && next build` (or add it as a `vercel-build` script), and explain the choice.
4. Deploy, then in GitHub create a **second OAuth app** for production (or update the existing one) with:
   - Homepage URL: `https://<project>.vercel.app`
   - Callback URL: `https://<project>.vercel.app/api/auth/callback/github`
   and update the Vercel env vars if the ID/secret changed, then redeploy.

### Phase 7: Final verification

Walk through this checklist with the user and fix anything that fails:

- [ ] Production URL loads; UI matches the original HTML in light and dark mode.
- [ ] Sign in with GitHub works in production.
- [ ] Changes persist after reload and appear on a second device.
- [ ] Signed-out mode works with localStorage only.
- [ ] Old data from the `dhruv-switch-tracker-v1` localStorage key is picked up on first sign-in.
- [ ] `npm run lint`, `npm test` and `npm run build` pass locally.
- [ ] No secrets in the git history (`git log -p | grep -i secret` shows nothing sensitive).

---

## 5. Out of scope (don't build unless asked)

Websockets/realtime, multiple users sharing one tracker, email notifications, a redesign, analytics, or a mobile app.

## 6. Optional extras (offer these only after Phase 7)

1. GitHub Actions CI running lint, tests and build on every push.
2. Export/import state as a JSON file (backup button).
3. A `/api/health` route and Vercel Analytics.
4. Playwright end-to-end test for sign-in-free flows.
