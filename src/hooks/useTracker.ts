"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT,
  cloneState,
  iso,
  loadLocal,
  mergeByUpdatedAt,
  newAppId,
  normalize,
  saveLocal,
  today,
  type Application,
  type TrackerState,
} from "@/lib/tracker";

export type SyncState = "local" | "saving" | "ok" | "error";

export type TrackerActions = {
  toggle: (key: string) => void;
  inc: () => void;
  dec: () => void;
  setSolved: (n: number) => void;
  setRating: (value: string) => void;
  addApp: (app: Omit<Application, "id">) => void;
  deleteApp: (id: string) => void;
  setStage: (id: string, stage: string) => void;
};

/** How long to wait after the last change before uploading. */
const DEBOUNCE_MS = 700;

// The standard "has this hydrated yet?" probe: the server snapshot is false and
// the client snapshot is true, so React re-renders once hydration is done.
// Nothing ever changes, so the subscribe function has nothing to do.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Owns the tracker state and its sync with the server.
 *
 * localStorage is always the local truth: it is written on every change, so the
 * app works offline and while signed out. When signed in, the browser copy and
 * the server copy are reconciled by `updatedAt` (last writer wins) on load, on
 * every change (debounced) and on window focus.
 */
export function useTracker(signedIn: boolean) {
  const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  // Read the browser cache during the first client render rather than in an
  // effect: no extra render pass, and no flash of default numbers. On the
  // server loadLocal() returns null, so this starts from DEFAULT there.
  const [state, setState] = useState<TrackerState>(() => loadLocal() ?? DEFAULT());

  // Only meaningful while signed in; the signed-out label is derived below, so
  // that signing out never needs a setState from inside an effect.
  const [serverSync, setServerSync] = useState<SyncState>("saving");
  const sync: SyncState = signedIn ? serverSync : "local";

  // Mirror of `state` for the async sync code. Reading state inside a fetch
  // callback would capture a stale render's value; this ref is always current.
  const latest = useRef(state);

  // One request at a time. If changes land while a PUT is in flight, we note it
  // and send the newest state once that request finishes, rather than queueing
  // a pile of overlapping writes.
  const inFlight = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Write the cache back on every change. Effects only run on the client.
  useEffect(() => {
    latest.current = state;
    saveLocal(state);
  }, [state]);

  /** Take the server's copy as the new truth (it was newer, or we were stale). */
  const adopt = useCallback((remote: unknown) => {
    const next = normalize(remote);
    latest.current = next;
    setState(next);
    saveLocal(next);
  }, []);

  /** Upload the newest local state. Returns once the request settles. */
  const push = useCallback(async () => {
    if (inFlight.current) {
      // A request is already running. Flag it so the loop below sends the newest
      // state once that request finishes, instead of racing a second write.
      again.current = true;
      return;
    }
    inFlight.current = true;
    setServerSync("saving");

    try {
      // Loop rather than recurse: each pass sends whatever the newest state is,
      // so changes made mid-request are covered by one extra request, not a pile.
      do {
        again.current = false;

        const res = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latest.current),
        });

        if (res.status === 409) {
          // Our write was stale: the other device is ahead. Adopt what is stored.
          const { state: stored } = await res.json();
          adopt(stored);
          setServerSync("ok");
        } else if (res.status === 401) {
          // Session expired while the tab was open; carry on locally.
          setServerSync("local");
          return;
        } else if (res.ok) {
          setServerSync("ok");
        } else {
          setServerSync("error");
          return;
        }
      } while (again.current);
    } catch {
      // Offline or the request failed. localStorage already has the change.
      setServerSync("error");
    } finally {
      inFlight.current = false;
    }
  }, [adopt]);

  /**
   * Fetch the server copy and reconcile. Newer server copy replaces the local
   * one; a newer local copy (or no server row at all) gets uploaded. The
   * "no server row" case is what imports a pre-existing browser-only tracker.
   */
  const pull = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.status === 401) {
        setServerSync("local");
        return;
      }
      if (!res.ok) {
        setServerSync("error");
        return;
      }

      const { state: remoteRaw } = await res.json();
      const remote = remoteRaw ? normalize(remoteRaw) : null;
      const { state: winner, source } = mergeByUpdatedAt(latest.current, remote);

      if (source === "remote") {
        adopt(winner);
        setServerSync("ok");
      } else {
        // Local is ahead, or the server has nothing yet: upload it.
        await push();
      }
    } catch {
      setServerSync("error");
    }
  }, [adopt, push]);

  /** Debounced upload, scheduled after every change. */
  const schedulePush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void push();
    }, DEBOUNCE_MS);
  }, [push]);

  // Initial reconcile, and whenever the user signs in or out. Fetching the
  // server copy on mount is exactly the "synchronise with an external system"
  // case effects are for.
  //
  // The lint rule below cannot see through the async boundary: every setState in
  // pull() happens after `await fetch`, so none of them runs during this effect
  // and none can cascade a render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState only happens after an await
    if (signedIn) void pull();
  }, [signedIn, pull]);

  // Re-check on focus, so moving between phone and laptop picks up the other
  // device's changes without any realtime transport.
  useEffect(() => {
    if (!signedIn) return;
    const onFocus = () => void pull();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [signedIn, pull]);

  // Never leave a pending upload behind when the hook unmounts.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** Apply a mutation to a copy of the state and stamp it with the change time. */
  const commit = useCallback(
    (mutate: (draft: TrackerState) => void) => {
      const now = Date.now();
      setState((prev) => {
        const next = cloneState(prev);
        mutate(next);
        next.updatedAt = now;
        latest.current = next;
        return next;
      });
      if (signedIn) schedulePush();
    },
    [signedIn, schedulePush],
  );

  const actions = useMemo<TrackerActions>(
    () => ({
      toggle: (key) =>
        commit((d) => {
          if (d.done[key]) delete d.done[key];
          else d.done[key] = true;
        }),

      inc: () =>
        commit((d) => {
          const k = iso(today());
          d.solved += 1;
          d.log[k] = (Number(d.log[k]) || 0) + 1;
        }),

      dec: () =>
        commit((d) => {
          const k = iso(today());
          const v = Number(d.log[k]) || 0;
          if (v > 0) {
            if (v - 1 > 0) d.log[k] = v - 1;
            else delete d.log[k];
          }
          d.solved = Math.max(0, d.solved - 1);
        }),

      setSolved: (n) =>
        commit((d) => {
          d.solved = n;
        }),

      setRating: (value) =>
        commit((d) => {
          d.rating = value;
        }),

      addApp: (app) =>
        commit((d) => {
          d.apps.push({ ...app, id: newAppId() });
        }),

      deleteApp: (id) =>
        commit((d) => {
          d.apps = d.apps.filter((a) => a.id !== id);
        }),

      setStage: (id, stage) =>
        commit((d) => {
          const app = d.apps.find((a) => a.id === id);
          if (app) app.stage = stage;
        }),
    }),
    [commit],
  );

  return { state, hydrated, sync, actions };
}
