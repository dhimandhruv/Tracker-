"use client";

import { Fragment } from "react";
import Checkbox from "@/components/Checkbox";
import { RESUME, TOPICS } from "@/lib/plan-data";
import type { TrackerActions } from "@/hooks/useTracker";
import type { TrackerState } from "@/lib/tracker";

export default function SkillsTab({ state, actions }: { state: TrackerState; actions: TrackerActions }) {
  return (
    <div className="grid cols-2">
      <div className="panel">
        <h2>Resume fixes</h2>
        <p className="sub">Finish these before sending any application.</p>
        <ul className="checks">
          {RESUME.map((item, i) => {
            const key = `r:${i}`;
            return (
              <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                {item}
              </Checkbox>
            );
          })}
        </ul>
      </div>

      <div className="panel">
        <h2>Topics to explore</h2>
        <p className="sub">About 4–5 hours a week, mostly on weekends.</p>
        {TOPICS.map((group, gi) => (
          <Fragment key={group.g}>
            <h3>{group.g}</h3>
            <ul className="checks">
              {group.items.map((item, i) => {
                const key = `s:${gi}:${i}`;
                return (
                  <Checkbox key={key} checked={!!state.done[key]} onToggle={() => actions.toggle(key)}>
                    {item}
                  </Checkbox>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
