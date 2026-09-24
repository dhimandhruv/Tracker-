"use client";

import { MILESTONES } from "@/lib/plan-data";
import { fmt, routePct, toDate } from "@/lib/tracker";

/**
 * The hero timeline. Milestone dots are buttons, so clicking one ticks it off.
 *
 * The child order matters: the CSS uses `.node:nth-of-type(even)` to stagger
 * labels above and below the track, which counts the <button> elements only.
 */
export default function RouteTimeline({
  done,
  now,
  onToggle,
}: {
  done: Record<string, true>;
  now: Date;
  onToggle: (key: string) => void;
}) {
  const todayPct = routePct(now);

  return (
    <div className="route">
      <div className="route-inner">
        <div className="track" />
        <div className="track-fill" style={{ width: `${todayPct}%` }} />

        {MILESTONES.map((m, i) => {
          const key = `m:${i}`;
          const date = toDate(m.d);
          const isDone = !!done[key];
          const late = !isDone && date.getTime() < now.getTime();
          return (
            <button
              key={key}
              type="button"
              className={["node", isDone && "done", late && "late"].filter(Boolean).join(" ")}
              // Clamped so the first and last dots stay inside the card.
              style={{ left: `${Math.min(96, Math.max(4, routePct(date)))}%` }}
              aria-pressed={isDone}
              title={m.s}
              onClick={() => onToggle(key)}
            >
              <span className="dot" />
              <span className="lbl">
                <b>{m.t}</b>
                {fmt(date)}
              </span>
            </button>
          );
        })}

        <div className="today" style={{ left: `${todayPct}%` }}>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
