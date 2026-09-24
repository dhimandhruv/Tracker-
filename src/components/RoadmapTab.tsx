"use client";

import { Fragment, useMemo, useState } from "react";
import Checkbox from "@/components/Checkbox";
import { MILESTONES, WEEKS } from "@/lib/plan-data";
import type { TrackerActions } from "@/hooks/useTracker";
import { countDone, currentWeek, fmt, toDate, weekKeys, type TrackerState } from "@/lib/tracker";

export default function RoadmapTab({
  state,
  now,
  actions,
}: {
  state: TrackerState;
  now: Date;
  actions: TrackerActions;
}) {
  const cw = currentWeek(now);

  // Which <details> are expanded. The current week starts open, as in the
  // original; keeping it in state means a re-render doesn't collapse the rest.
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ [cw.id]: true }));

  // A phase heading is printed the first time a phase appears.
  const rows = useMemo(
    () =>
      WEEKS.map((w, i) => ({
        week: w,
        heading: i === 0 || WEEKS[i - 1].phase !== w.phase ? w.phase : null,
      })),
    [],
  );

  return (
    <>
      {rows.map(({ week: w, heading }) => {
        const keys = weekKeys(w);
        const done = countDone(state.done, keys);
        const complete = done === keys.length;
        return (
          // A Fragment, not a wrapper div, so the DOM matches the original exactly.
          <Fragment key={w.id}>
            {heading && <h2 className="phase-h">{heading}</h2>}
            <details
              className={["week", w === cw && "current", complete && "complete"].filter(Boolean).join(" ")}
              open={!!open[w.id]}
              onToggle={(e) => {
                const isOpen = e.currentTarget.open;
                setOpen((prev) => ({ ...prev, [w.id]: isOpen }));
              }}
            >
              <summary>
                <span className="wk">{w.name}</span>
                <span className="dates">
                  {`${fmt(toDate(w.from))} – ${fmt(toDate(w.to))}${w === cw ? " · current" : ""}`}
                </span>
                <span className="cnt">
                  {done}/{keys.length}
                </span>
              </summary>
              <div className="body">
                <ul className="checks">
                  {w.tasks.map((task, i) => {
                    const key = `t:${w.id}:${i}`;
                    return (
                      <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                        {task}
                      </Checkbox>
                    );
                  })}
                </ul>
              </div>
            </details>
          </Fragment>
        );
      })}

      <h2 className="phase-h">Milestones</h2>
      <div className="panel">
        <ul className="checks">
          {MILESTONES.map((m, i) => {
            const key = `m:${i}`;
            return (
              <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                <b>{fmt(toDate(m.d))}</b>
                {`: ${m.s}`}
              </Checkbox>
            );
          })}
        </ul>
      </div>
    </>
  );
}
