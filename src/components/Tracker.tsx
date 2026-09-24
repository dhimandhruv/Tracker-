"use client";

import { useState } from "react";
import ApplicationsTab from "@/components/ApplicationsTab";
import AuthButton, { type HeaderUser } from "@/components/AuthButton";
import LeetCodeTab from "@/components/LeetCodeTab";
import OverviewTab from "@/components/OverviewTab";
import RoadmapTab from "@/components/RoadmapTab";
import RouteTimeline from "@/components/RouteTimeline";
import SkillsTab from "@/components/SkillsTab";
import SyncStatus from "@/components/SyncStatus";
import Tabs, { type TabId } from "@/components/Tabs";
import { useTracker } from "@/hooks/useTracker";
import { heroLine, today } from "@/lib/tracker";

export default function Tracker({ user }: { user: HeaderUser | null }) {
  const { state, hydrated, sync, actions } = useTracker(user !== null);
  const [tab, setTab] = useState<TabId>("overview");

  // "Today" is fixed for the session. On the server this initialiser runs too,
  // but nothing that uses it renders until `hydrated`, so there is no mismatch.
  const [now] = useState(today);

  return (
    <div className="wrap">
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1>Dhruv&apos;s switch: 10 LPA+ by January</h1>
            {/* The static line is the placeholder the original showed before its
                script ran; it becomes the "next milestone" line after mount. */}
            <p>{hydrated ? heroLine(state.done, now) : "Sep 22, 2026 to joining in spring 2027"}</p>
          </div>
          <div className="header-right">
            <SyncStatus state={sync} />
            <AuthButton user={user} />
          </div>
        </div>
        {hydrated ? (
          <RouteTimeline done={state.done} now={now} onToggle={actions.toggle} />
        ) : (
          <div className="route">
            <div className="route-inner" />
          </div>
        )}
      </header>

      <Tabs tab={tab} onChange={setTab} />

      <main>
        {hydrated && tab === "overview" && <OverviewTab state={state} now={now} actions={actions} />}
        {hydrated && tab === "roadmap" && <RoadmapTab state={state} now={now} actions={actions} />}
        {hydrated && tab === "leetcode" && <LeetCodeTab state={state} now={now} actions={actions} />}
        {hydrated && tab === "apps" && <ApplicationsTab state={state} now={now} actions={actions} />}
        {hydrated && tab === "skills" && <SkillsTab state={state} actions={actions} />}
      </main>
    </div>
  );
}
