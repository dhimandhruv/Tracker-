import { END, MILESTONES, PROBLEMS, START, WEEKS, type DateTuple, type Week } from "@/lib/plan-data";

/* ---------------------------------------------------------------- types */

export type Application = {
  id: string;
  company: string;
  role: string;
  channel: string;
  stage: string;
  date: string;
  /** Kept as a string because it comes straight from a text input. */
  ctc: string;
  notes: string;
};

export type TrackerState = {
  v: 1;
  /** ms epoch, set on every change. Drives last-writer-wins sync. */
  updatedAt: number;
  /** Total LeetCode problems solved. */
  solved: number;
  /** Contest rating, free text. */
  rating: string;
  /** Checklist keys: "p:238", "t:w1:0", "wk:2026-09-21:3", "r:0", "s:0:1", "m:2". */
  done: Record<string, true>;
  /** "YYYY-MM-DD" -> problems solved that day. */
  log: Record<string, number>;
  apps: Application[];
};

/** localStorage key. Unchanged from the original HTML so old data still loads. */
export const LS_KEY = "dhruv-switch-tracker-v1";

export function DEFAULT(): TrackerState {
  return { v: 1, updatedAt: 0, solved: 200, rating: "", done: {}, log: {}, apps: [] };
}

/* ------------------------------------------------------------ normalize */

function str(v: unknown): string {
  if (typeof v === "string") return v;
  return v == null ? "" : String(v);
}

function normalizeDone(v: unknown): Record<string, true> {
  const out: Record<string, true> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v)) if (val) out[k] = true;
  }
  return out;
}

function normalizeLog(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v)) {
      const n = Number(val);
      // The app deletes a day's entry when it hits zero, so zeros are noise.
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
  }
  return out;
}

function normalizeApps(v: unknown): Application[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      id: str(a.id) || newAppId(),
      company: str(a.company),
      role: str(a.role),
      channel: str(a.channel),
      stage: str(a.stage),
      date: str(a.date),
      ctc: str(a.ctc),
      notes: str(a.notes),
    }));
}

/**
 * Turns anything (old localStorage, an API response, garbage) into a valid
 * TrackerState. Same contract as the original HTML's normalize(), so data
 * written by that version loads without a migration.
 */
export function normalize(input: unknown): TrackerState {
  if (!input || typeof input !== "object") return DEFAULT();
  const s = input as Record<string, unknown>;
  const solved = Number(s.solved);
  return {
    v: 1,
    updatedAt: Number(s.updatedAt) || 0,
    solved: Number.isFinite(solved) ? solved : 200,
    rating: str(s.rating),
    done: normalizeDone(s.done),
    log: normalizeLog(s.log),
    apps: normalizeApps(s.apps),
  };
}

export function cloneState(s: TrackerState): TrackerState {
  return structuredClone(s);
}

export function newAppId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------------------------------------------------------- date helpers */

export const toDate = (a: DateTuple): Date => new Date(a[0], a[1], a[2]);

/** Local-time YYYY-MM-DD. Deliberately not toISOString(), which is UTC. */
export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fmt = (d: Date): string => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Today at local midnight. */
export const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dayDiff = (a: Date, b: Date): number => Math.round((b.getTime() - a.getTime()) / 86400000);

/** Monday of the week containing d, at local midnight. */
export const mondayOf = (d: Date): Date => {
  const x = new Date(d);
  const k = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - k);
  x.setHours(0, 0, 0, 0);
  return x;
};

/* -------------------------------------------------------- derived values */

export const weekKeys = (w: Week): string[] => w.tasks.map((_, i) => `t:${w.id}:${i}`);

export const allProblemKeys = (): string[] => PROBLEMS.flatMap((g) => g.items.map((p) => `p:${p.n}`));

export const countDone = (done: Record<string, true>, keys: string[]): number =>
  keys.filter((k) => done[k]).length;

/** The roadmap week containing t, clamped to the first/last week outside the plan. */
export function currentWeek(t: Date): Week {
  const ms = t.getTime();
  const found = WEEKS.find((w) => ms >= toDate(w.from).getTime() && ms <= toDate(w.to).getTime());
  if (found) return found;
  return ms < toDate(WEEKS[0].from).getTime() ? WEEKS[0] : WEEKS[WEEKS.length - 1];
}

/** Key prefix for the weekly checklist, which resets every Monday. */
export const thisWeekKey = (t: Date): string => iso(mondayOf(t));

/** Problems solved between two YYYY-MM-DD dates, inclusive. */
export function logSum(log: Record<string, number>, from: string, to: string): number {
  let sum = 0;
  for (const [k, v] of Object.entries(log)) {
    if (k >= from && k <= to) sum += Number(v) || 0;
  }
  return sum;
}

/**
 * Consecutive days with at least one problem solved. Today not being logged
 * yet does not break the streak — it counts back from yesterday instead.
 */
export function streak(log: Record<string, number>, t: Date): number {
  const d = new Date(t);
  if (!((Number(log[iso(d)]) || 0) > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while ((Number(log[iso(d)]) || 0) > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Heatmap shade, 0-4. */
export const heatLevel = (v: number): number => (v === 0 ? 0 : v < 2 ? 1 : v < 3 ? 2 : v < 5 ? 3 : 4);

/** Position of a date along the hero timeline, as a percentage. */
export const routePct = (d: Date): number =>
  Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / (END.getTime() - START.getTime())) * 100));

/** Index of the first unticked milestone, or -1 when they are all done. */
export const nextMilestoneIndex = (done: Record<string, true>): number =>
  MILESTONES.findIndex((_, i) => !done[`m:${i}`]);

/** The line under the page title. */
export function heroLine(done: Record<string, true>, t: Date): string {
  const i = nextMilestoneIndex(done);
  if (i === -1) return "Every milestone done. Congratulations on the switch.";
  const m = MILESTONES[i];
  const target = toDate(m.d);
  const days = dayDiff(t, target);
  const when = days >= 0 ? `${days} days left` : `${Math.abs(days)} days overdue`;
  return `Next: ${m.t} by ${fmt(target)} (${when})`;
}

/* ------------------------------------------------------------- sync glue */

export type MergeSource = "local" | "remote";

/**
 * Last-writer-wins by updatedAt. A tie prefers the remote copy, so the server
 * stays the tie-breaker and two devices converge instead of ping-ponging.
 * `source` tells the caller whether the local copy still needs uploading.
 */
export function mergeByUpdatedAt(
  local: TrackerState | null,
  remote: TrackerState | null,
): { state: TrackerState; source: MergeSource } {
  if (!remote) return { state: local ?? DEFAULT(), source: "local" };
  if (!local) return { state: remote, source: "remote" };
  return remote.updatedAt >= local.updatedAt
    ? { state: remote, source: "remote" }
    : { state: local, source: "local" };
}

/* ------------------------------------------------------ browser storage */

export function loadLocal(): TrackerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    // Private mode, disabled storage or corrupt JSON: fall back to defaults.
    return null;
  }
}

export function saveLocal(state: TrackerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // Best-effort cache; a write failure must not break the app.
  }
}
