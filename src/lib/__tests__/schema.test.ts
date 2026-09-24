import { describe, expect, it } from "vitest";
import { LIMITS, trackerStateSchema, type ValidatedState } from "@/lib/schema";
import { DEFAULT, type TrackerState } from "@/lib/tracker";

/**
 * Compile-time check that the validated shape is usable as a TrackerState.
 * If the Zod schema and the app's type ever drift apart, this stops building.
 */
const _assignable: TrackerState = DEFAULT() satisfies ValidatedState;
void _assignable;

/** A minimal valid payload; individual tests override one field at a time. */
const valid = (over: Partial<TrackerState> = {}): unknown => ({ ...DEFAULT(), ...over });

describe("trackerStateSchema", () => {
  it("accepts the default state", () => {
    expect(trackerStateSchema.safeParse(valid()).success).toBe(true);
  });

  it("accepts a fully populated state", () => {
    const parsed = trackerStateSchema.safeParse(
      valid({
        updatedAt: 1_759_000_000_000,
        solved: 247,
        rating: "1612",
        done: { "p:238": true, "t:w1:0": true, "m:2": true },
        log: { "2026-09-22": 3, "2026-09-23": 12 },
        apps: [
          {
            id: "abc123",
            company: "Acme",
            role: "SDE II",
            channel: "Referral",
            stage: "Interview",
            date: "2026-09-23",
            ctc: "18 LPA",
            notes: "round 2 on Friday",
          },
        ],
      }),
    );
    expect(parsed.success).toBe(true);
  });

  it("rejects a wrong version literal", () => {
    expect(trackerStateSchema.safeParse(valid({ v: 2 as 1 })).success).toBe(false);
  });

  it("rejects a non-integer or negative updatedAt", () => {
    expect(trackerStateSchema.safeParse(valid({ updatedAt: 1.5 })).success).toBe(false);
    expect(trackerStateSchema.safeParse(valid({ updatedAt: -1 })).success).toBe(false);
  });

  it("rejects a falsy value in done, since only `true` is stored", () => {
    expect(trackerStateSchema.safeParse({ ...DEFAULT(), done: { "p:1": false } }).success).toBe(false);
  });

  it("rejects log keys that are not YYYY-MM-DD", () => {
    expect(trackerStateSchema.safeParse(valid({ log: { "22-09-2026": 3 } })).success).toBe(false);
  });

  it("rejects a zero log count, which the client deletes instead of storing", () => {
    expect(trackerStateSchema.safeParse(valid({ log: { "2026-09-22": 0 } })).success).toBe(false);
  });

  it("rejects more applications than the limit", () => {
    const app = {
      id: "x",
      company: "",
      role: "",
      channel: "",
      stage: "",
      date: "",
      ctc: "",
      notes: "",
    };
    const apps = Array.from({ length: LIMITS.apps + 1 }, () => ({ ...app }));
    expect(trackerStateSchema.safeParse(valid({ apps })).success).toBe(false);
  });

  it("rejects more done keys than the limit", () => {
    const done: Record<string, true> = {};
    for (let i = 0; i <= LIMITS.doneKeys; i++) done[`p:${i}`] = true;
    expect(trackerStateSchema.safeParse(valid({ done })).success).toBe(false);
  });

  it("rejects more log entries than the limit", () => {
    const log: Record<string, number> = {};
    // Distinct valid YYYY-MM-DD keys, produced by walking days forward.
    for (let i = 0; i <= LIMITS.logEntries; i++) {
      const d = new Date(Date.UTC(2020, 0, 1 + i));
      log[d.toISOString().slice(0, 10)] = 1;
    }
    expect(trackerStateSchema.safeParse(valid({ log })).success).toBe(false);
  });

  it("rejects an over-long free-text field", () => {
    const apps = [
      {
        id: "x",
        company: "a".repeat(201),
        role: "",
        channel: "",
        stage: "",
        date: "",
        ctc: "",
        notes: "",
      },
    ];
    expect(trackerStateSchema.safeParse(valid({ apps })).success).toBe(false);
  });

  it("rejects extra top-level keys being used to smuggle data in", () => {
    const parsed = trackerStateSchema.safeParse({ ...DEFAULT(), userId: "someone-else" });
    // Zod strips unknown keys rather than failing, so assert it is not carried over.
    expect(parsed.success).toBe(true);
    if (parsed.success) expect("userId" in parsed.data).toBe(false);
  });
});
