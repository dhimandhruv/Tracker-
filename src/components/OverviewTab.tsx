"use client";

import Checkbox from "@/components/Checkbox";
import { ACTIVE, RESUME, WEEKLY, WEEKS } from "@/lib/plan-data";
import type { TrackerActions } from "@/hooks/useTracker";
import {
  allProblemKeys,
  countDone,
  currentWeek,
  fmt,
  iso,
  logSum,
  mondayOf,
  streak,
  thisWeekKey,
  toDate,
  weekKeys,
  type TrackerState,
} from "@/lib/tracker";

export default function OverviewTab({
  state,
  now,
  actions,
}: {
  state: TrackerState;
  now: Date;
  actions: TrackerActions;
}) {
  const cw = currentWeek(now);
  const wkKey = thisWeekKey(now);

  const mon = mondayOf(now);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const weekSolved = logSum(state.log, iso(mon), iso(sun));
  const days = streak(state.log, now);

  const problemKeys = allProblemKeys();
  const problemsDone = countDone(state.done, problemKeys);

  const taskKeys = WEEKS.flatMap(weekKeys);
  const tasksDone = countDone(state.done, taskKeys);

  const resumeKeys = RESUME.map((_, i) => `r:${i}`);
  const resumeDone = countDone(state.done, resumeKeys);

  const active = state.apps.filter((a) => ACTIVE.includes(a.stage)).length;
  const offers = state.apps.filter((a) => a.stage === "Offer");
  const best = offers.reduce((m, a) => Math.max(m, Number(a.ctc) || 0), 0);

  // 200 solved at the start of the plan, 350 at the end.
  const solvedPct = Math.min(100, ((state.solved - 200) / 150) * 100);

  return (
    <>
      <div className="grid cols-3">
        <div className="panel stat">
          <div className="n">
            {state.solved}
            <small> / 350</small>
          </div>
          <div className="k">LeetCode problems solved</div>
          <div className="bar">
            <i style={{ width: `${Math.max(0, solvedPct)}%` }} />
          </div>
          <div className="counter" style={{ marginTop: 12 }}>
            <button type="button" className="btn small" onClick={actions.dec}>
              −1
            </button>
            <button type="button" className="btn small primary" onClick={actions.inc}>
              +1 solved today
            </button>
          </div>
        </div>

        <div className="panel stat">
          <div className="n">
            {weekSolved}
            <small> this week</small>
          </div>
          <div className="k">{`Target 12–15 · streak ${days} day${days === 1 ? "" : "s"}`}</div>
          <div className="bar teal">
            <i style={{ width: `${Math.min(100, (weekSolved / 15) * 100)}%` }} />
          </div>
        </div>

        <div className="panel stat">
          <div className="n">
            {active}
            <small> active</small>
          </div>
          <div className="k">
            {`${offers.length} offer${offers.length === 1 ? "" : "s"}${best ? `; best ${best} LPA` : ""} · ${state.apps.length} applications tracked`}
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (active / 5) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>This week: {cw.name}</h2>
          <p className="sub">{`${fmt(toDate(cw.from))} to ${fmt(toDate(cw.to))} · ${cw.phase}`}</p>
          <ul className="checks">
            {cw.tasks.map((task, i) => {
              const key = `t:${cw.id}:${i}`;
              return (
                <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                  {task}
                </Checkbox>
              );
            })}
          </ul>
        </div>

        <div className="panel">
          <h2>Weekly checklist</h2>
          <p className="sub">{`Resets every Monday. Week of ${fmt(mon)}.`}</p>
          <ul className="checks">
            {WEEKLY.map((item, i) => {
              const key = `wk:${wkKey}:${i}`;
              return (
                <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                  {item}
                </Checkbox>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="panel stat">
          <div className="n">
            {tasksDone}
            <small> / {taskKeys.length}</small>
          </div>
          <div className="k">Roadmap tasks done</div>
          <div className="bar teal">
            <i style={{ width: `${(tasksDone / taskKeys.length) * 100}%` }} />
          </div>
        </div>

        <div className="panel stat">
          <div className="n">
            {problemsDone}
            <small> / {problemKeys.length}</small>
          </div>
          <div className="k">Curated problems ticked</div>
          <div className="bar">
            <i style={{ width: `${(problemsDone / problemKeys.length) * 100}%` }} />
          </div>
        </div>

        <div className="panel stat">
          <div className="n">
            {resumeDone}
            <small> / {RESUME.length}</small>
          </div>
          <div className="k">Resume fixes done</div>
          <div className="bar teal">
            <i style={{ width: `${(resumeDone / RESUME.length) * 100}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
