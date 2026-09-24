"use client";

export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "leetcode", label: "LeetCode" },
  { id: "apps", label: "Applications" },
  { id: "skills", label: "Resume & skills" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function Tabs({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="tab"
          role="tab"
          aria-selected={t.id === tab}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
