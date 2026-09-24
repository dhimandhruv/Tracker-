import { describe, expect, it } from "vitest";
import {
  DEFAULT,
  currentWeek,
  iso,
  logSum,
  mergeByUpdatedAt,
  mondayOf,
  normalize,
  streak,
  type TrackerState,
} from "@/lib/tracker";

/** A state with only the fields a test cares about. */
const make = (over: Partial<TrackerState> = {}): TrackerState => ({ ...DEFAULT(), ...over });

describe("normalize", () => {
  it("returns defaults for anything that isn't an object", () => {
    for (const bad of [null, undefined, 0, "", "nope", true, NaN]) {
      expect(normalize(bad)).toEqual(DEFAULT());
    }
  });

  it("returns defaults for an empty object", () => {
    expect(normalize({})).toEqual(DEFAULT());
  });

  it("keeps valid fields", () => {
    const input = {
      v: 1,
      updatedAt: 1700000000000,
      solved: 243,
      rating: "1612",
      done: { "p:238": true, "m:0": true },
      log: { "2026-09-22": 4 },
      apps: [
        {
          id: "abc",
          company: "Acme",
          role: "SDE-1",
          channel: "Referral",
          stage: "Applied",
          date: "2026-09-22",
          ctc: "12",
          notes: "via Ravi",
        },
      ],
    };
    expect(normalize(input)).toEqual({ ...input, v: 1 });
  });

  it("falls back to 200 solved when the value isn't a number", () => {
    expect(normalize({ solved: "abc" }).solved).toBe(200);
    expect(normalize({ solved: undefined }).solved).toBe(200);
    // Number("0") is finite, so an explicit zero is respected.
    expect(normalize({ solved: 0 }).solved).toBe(0);
  });

  it("drops junk out of done, log and apps", () => {
    const s = normalize({
      done: { "p:1": true, "p:2": false, "p:3": 0, "p:4": "yes" },
      log: { "2026-09-22": 3, "2026-09-23": 0, "2026-09-24": "x", "2026-09-25": -2 },
      apps: [null, "nope", { company: "Acme" }],
    });
    expect(s.done).toEqual({ "p:1": true, "p:4": true });
    expect(s.log).toEqual({ "2026-09-22": 3 });
    expect(s.apps).toHaveLength(1);
    expect(s.apps[0].company).toBe("Acme");
    expect(s.apps[0].role).toBe(""); // missing fields become empty strings
    expect(s.apps[0].id).not.toBe(""); // a missing id is generated
  });

  it("coerces a non-string rating and a missing one", () => {
    expect(normalize({ rating: 1600 }).rating).toBe("1600");
    expect(normalize({ rating: null }).rating).toBe("");
  });

  it("defaults updatedAt to 0 so any stored copy wins over a fresh one", () => {
    expect(normalize({ updatedAt: "not a number" }).updatedAt).toBe(0);
  });
});

describe("mergeByUpdatedAt", () => {
  const local = make({ updatedAt: 200, solved: 201 });
  const remote = make({ updatedAt: 300, solved: 301 });

  it("takes the newer copy", () => {
    expect(mergeByUpdatedAt(local, remote)).toEqual({ state: remote, source: "remote" });
    expect(mergeByUpdatedAt(remote, local)).toEqual({ state: remote, source: "local" });
  });

  it("prefers remote on a tie, so two devices converge", () => {
    const a = make({ updatedAt: 500, solved: 1 });
    const b = make({ updatedAt: 500, solved: 2 });
    expect(mergeByUpdatedAt(a, b)).toEqual({ state: b, source: "remote" });
  });

  it("uses the local copy when the server has none", () => {
    expect(mergeByUpdatedAt(local, null)).toEqual({ state: local, source: "local" });
  });

  it("uses the server copy when the browser has none", () => {
    expect(mergeByUpdatedAt(null, remote)).toEqual({ state: remote, source: "remote" });
  });

  it("falls back to defaults when neither side has anything", () => {
    expect(mergeByUpdatedAt(null, null)).toEqual({ state: DEFAULT(), source: "local" });
  });
});

describe("streak", () => {
  const tue = new Date(2026, 8, 22); // Tuesday 22 Sep 2026

  it("counts back from today when today is logged", () => {
    const log = { "2026-09-22": 3, "2026-09-21": 1, "2026-09-20": 5 };
    expect(streak(log, tue)).toBe(3);
  });

  it("does not break the streak when today has no problem yet", () => {
    const log = { "2026-09-21": 1, "2026-09-20": 5 };
    expect(streak(log, tue)).toBe(2);
  });

  it("is zero when neither today nor yesterday is logged", () => {
    expect(streak({ "2026-09-20": 5 }, tue)).toBe(0);
    expect(streak({}, tue)).toBe(0);
  });

  it("stops at the first gap", () => {
    const log = { "2026-09-22": 1, "2026-09-21": 2, "2026-09-19": 9 };
    expect(streak(log, tue)).toBe(2);
  });
});

describe("mondayOf", () => {
  it("returns the same day for a Monday", () => {
    expect(iso(mondayOf(new Date(2026, 8, 21)))).toBe("2026-09-21");
  });

  it("walks back from any other weekday", () => {
    expect(iso(mondayOf(new Date(2026, 8, 22)))).toBe("2026-09-21"); // Tuesday
    expect(iso(mondayOf(new Date(2026, 8, 27)))).toBe("2026-09-21"); // Sunday
  });

  it("crosses a month boundary", () => {
    expect(iso(mondayOf(new Date(2026, 9, 1)))).toBe("2026-09-28"); // Thu 1 Oct
  });

  it("clears the time so the key is stable through the day", () => {
    const m = mondayOf(new Date(2026, 8, 22, 23, 59, 59));
    expect([m.getHours(), m.getMinutes(), m.getSeconds(), m.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });
});

describe("logSum", () => {
  const log = { "2026-09-20": 2, "2026-09-21": 3, "2026-09-27": 4, "2026-10-01": 5 };

  it("sums the inclusive range only", () => {
    expect(logSum(log, "2026-09-21", "2026-09-27")).toBe(7);
  });

  it("includes both endpoints", () => {
    expect(logSum(log, "2026-09-20", "2026-09-20")).toBe(2);
  });

  it("is zero outside the range", () => {
    expect(logSum(log, "2026-11-01", "2026-11-30")).toBe(0);
    expect(logSum({}, "2026-09-01", "2026-09-30")).toBe(0);
  });
});

describe("currentWeek", () => {
  it("finds the week containing the date", () => {
    expect(currentWeek(new Date(2026, 8, 24)).id).toBe("w1");
    expect(currentWeek(new Date(2026, 9, 5)).id).toBe("w2");
  });

  it("clamps to the first week before the plan starts", () => {
    expect(currentWeek(new Date(2026, 0, 1)).id).toBe("w1");
  });

  it("clamps to the last week after the plan ends", () => {
    expect(currentWeek(new Date(2030, 0, 1)).id).toBe("p5");
  });
});
