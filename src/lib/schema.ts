// Zod schema for the sync API.
//
// normalize() in tracker.ts is forgiving on purpose: it has to accept whatever
// an old localStorage copy contains. This schema is the opposite — it is the
// trust boundary, so it rejects anything oversized or the wrong shape rather
// than coercing it. A logged-in user can only ever damage their own row, but
// unbounded JSON in Postgres is still a denial-of-service waiting to happen.
import { z } from "zod";

// Limits from the plan. Generous next to real usage (a year of daily logging is
// ~365 log entries), tight enough that one row cannot grow without bound.
export const LIMITS = {
  apps: 500,
  doneKeys: 5_000,
  logEntries: 1_000,
  /** Body size cap, enforced before parsing so huge payloads are cheap to reject. */
  bodyBytes: 200 * 1024,
} as const;

/** Bounded free text. Long enough for a notes field, short enough to be safe. */
const text = (max: number) => z.string().max(max);

const applicationSchema = z.object({
  id: text(64).min(1),
  company: text(200),
  role: text(200),
  channel: text(64),
  stage: text(64),
  date: text(32),
  ctc: text(64),
  notes: text(2_000),
});

export const trackerStateSchema = z.object({
  v: z.literal(1),

  // ms epoch. Must be a non-negative integer; the route compares it against the
  // stored value, so a float or NaN here would make the comparison meaningless.
  updatedAt: z.number().int().nonnegative(),

  solved: z.number().int().min(0).max(100_000),
  rating: text(32),

  // Checklist keys map to literal `true`. Anything falsy was already dropped
  // client-side by normalize(), so `true` is the only legal value.
  done: z.record(text(128), z.literal(true)).refine(
    (d) => Object.keys(d).length <= LIMITS.doneKeys,
    `at most ${LIMITS.doneKeys} done keys`,
  ),

  // "YYYY-MM-DD" -> problems solved that day. Zero entries are deleted, not stored.
  log: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "log keys must be YYYY-MM-DD"), z.number().int().min(1).max(1_000)).refine(
    (l) => Object.keys(l).length <= LIMITS.logEntries,
    `at most ${LIMITS.logEntries} log entries`,
  ),

  apps: z.array(applicationSchema).max(LIMITS.apps),
});

/** Inferred type must stay assignable to TrackerState; checked in the tests. */
export type ValidatedState = z.infer<typeof trackerStateSchema>;
