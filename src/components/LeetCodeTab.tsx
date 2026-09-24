"use client";

import { useMemo } from "react";
import Checkbox from "@/components/Checkbox";
import { PROBLEMS } from "@/lib/plan-data";
import type { TrackerActions } from "@/hooks/useTracker";
import { countDone, fmt, heatLevel, iso, mondayOf, type TrackerState } from "@/lib/tracker";

const DIFFICULTY: Record<string, string> = { E: "Easy", M: "Medium", H: "Hard" };

/** 18 weeks of daily squares, ending with the current week. */
function heatmapCells(log: Record<string, number>, now: Date) {
  const start = mondayOf(now);
  start.setDate(start.getDate() - 7 * 17);
  const cells = [];
  for (let i = 0; i < 18 * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = iso(d);
    const v = Number(log[key]) || 0;
    cells.push({ key, level: heatLevel(v), future: d.getTime() > now.getTime(), title: `${fmt(d)}: ${v} solved` });
  }
  return cells;
}

export default function LeetCodeTab({
  state,
  now,
  actions,
}: {
  state: TrackerState;
  now: Date;
  actions: TrackerActions;
}) {
  const cells = useMemo(() => heatmapCells(state.log, now), [state.log, now]);
  const todayCount = Number(state.log[iso(now)]) || 0;

  // Both fields stay uncontrolled and commit on blur, matching the original
  // (which listened for "change", not every keystroke). The `key` includes the
  // stored value, so when +1/−1 changes it the input remounts and shows it.
  function commitSolved(el: HTMLInputElement) {
    const n = parseInt(el.value, 10);
    if (Number.isFinite(n) && n >= 0) actions.setSolved(n);
    else el.value = String(state.solved); // reject junk, restore the real value
  }

  function commitRating(el: HTMLInputElement) {
    if (el.value !== state.rating) actions.setRating(el.value);
  }

  return (
    <>
      <div className="grid cols-2">
        <div className="panel">
          <h2>Problem count</h2>
          <p className="sub">
            Use +1 each time you solve a problem; it feeds the heatmap and weekly total. Edit the total directly if
            it drifts from LeetCode.
          </p>
          <div className="form">
            <label className="field">
              Total solved
              <input
                key={`solved-${state.solved}`}
                type="number"
                min="0"
                defaultValue={state.solved}
                onBlur={(e) => commitSolved(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </label>
            <label className="field">
              Contest rating
              <input
                key={`rating-${state.rating}`}
                type="number"
                min="0"
                placeholder="e.g. 1600"
                defaultValue={state.rating}
                onBlur={(e) => commitRating(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </label>
          </div>
          <div className="counter" style={{ marginTop: 12 }}>
            <button type="button" className="btn small" onClick={actions.dec}>
              −1
            </button>
            <button type="button" className="btn small primary" onClick={actions.inc}>
              +1 solved today
            </button>
            <span className="hint">Today: {todayCount}</span>
          </div>
        </div>

        <div className="panel">
          <h2>Last 18 weeks</h2>
          <p className="sub">Each square is a day; darker means more problems solved.</p>
          <div className="heat">
            {cells.map((c) => (
              <i key={c.key} data-l={c.level} className={c.future ? "fut" : ""} title={c.title} />
            ))}
          </div>
        </div>
      </div>

      <p className="hint" style={{ margin: "18px 2px 10px" }}>
        Tick the curated problems as you solve them, including ones you&apos;d already done before. Ticking
        doesn&apos;t change your total count.
      </p>

      <div className="grid cols-2">
        {PROBLEMS.map((g) => {
          const keys = g.items.map((p) => `p:${p.n}`);
          const done = countDone(state.done, keys);
          return (
            <div className="panel" key={g.g}>
              <div className="row">
                <h2 style={{ margin: 0 }}>{g.g}</h2>
                <span className="hint">{`${g.w} · ${done}/${keys.length}`}</span>
              </div>
              <div className="bar teal" style={{ margin: "10px 0 6px" }}>
                <i style={{ width: `${(done / keys.length) * 100}%` }} />
              </div>
              <ul className="checks">
                {g.items.map((p) => {
                  const key = `p:${p.n}`;
                  return (
                    <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                      {`${p.n}. `}
                      <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noopener noreferrer">
                        {p.name}
                      </a>
                      <span className={`tag ${p.d}`}>{DIFFICULTY[p.d]}</span>
                    </Checkbox>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
