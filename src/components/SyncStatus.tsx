"use client";

import type { SyncState } from "@/hooks/useTracker";

// Class names and copy are the ones the original HTML used with setSync().
const LABELS: Record<SyncState, { cls: string; text: string }> = {
  ok: { cls: "ok", text: "Saved to your account" },
  saving: { cls: "ok", text: "Saving…" },
  local: { cls: "local", text: "Saved in this browser" },
  error: { cls: "err", text: "Couldn't save to your account. Saved in this browser." },
};

export default function SyncStatus({ state }: { state: SyncState }) {
  const { cls, text } = LABELS[state];
  return <div className={`sync ${cls}`}>{text}</div>;
}
