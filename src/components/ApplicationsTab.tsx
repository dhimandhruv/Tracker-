"use client";

import { useRef, useState } from "react";
import { CHANNELS, STAGES } from "@/lib/plan-data";
import type { TrackerActions } from "@/hooks/useTracker";
import { fmt, iso, type TrackerState } from "@/lib/tracker";

type FormState = {
  company: string;
  role: string;
  channel: string;
  stage: string;
  date: string;
  ctc: string;
  notes: string;
};

const emptyForm = (now: Date): FormState => ({
  company: "",
  role: "",
  channel: CHANNELS[0],
  stage: "Applied",
  date: iso(now),
  ctc: "",
  notes: "",
});

/** "2026-11-04" -> "4 Nov". Left as-is if it isn't a real date. */
function showDate(value: string): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00`);
  return Number.isNaN(d.getTime()) ? value : fmt(d);
}

export default function ApplicationsTab({
  state,
  now,
  actions,
}: {
  state: TrackerState;
  now: Date;
  actions: TrackerActions;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(now));
  const [showError, setShowError] = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const company = form.company.trim();
    if (!company) {
      setShowError(true);
      companyRef.current?.focus();
      return;
    }
    actions.addApp({
      company,
      role: form.role.trim(),
      channel: form.channel,
      stage: form.stage,
      date: form.date,
      ctc: form.ctc,
      notes: form.notes.trim(),
    });
    setForm(emptyForm(now));
    setShowError(false);
  }

  const counts = STAGES.map((s) => ({ s, n: state.apps.filter((a) => a.stage === s).length })).filter((x) => x.n);
  const rows = [...state.apps].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <>
      <div className="panel">
        <h2>Add an application</h2>
        {/* A real <form> so Enter submits, as it did in the original. */}
        <form className="form" onSubmit={submit} noValidate>
          <label className="field">
            Company
            <input
              ref={companyRef}
              placeholder="Company name"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </label>
          <label className="field">
            Role
            <input placeholder="SDE-1 Backend" value={form.role} onChange={(e) => set("role", e.target.value)} />
          </label>
          <label className="field">
            Channel
            <select value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Stage
            <select value={form.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Date
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          <label className="field">
            CTC (LPA)
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Offered or expected"
              value={form.ctc}
              onChange={(e) => set("ctc", e.target.value)}
            />
          </label>
          <label className="field" style={{ gridColumn: "1/-1" }}>
            Notes
            <input
              placeholder="Referrer, next round, follow-up date"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
          <div>
            <button type="submit" className="btn primary">
              Add application
            </button>
          </div>
        </form>
        <p className="hint" hidden={!showError}>
          Enter a company name to add the application.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Pipeline</h2>
        <div className="pipeline">
          {counts.map((c) => (
            <span className="pill" key={c.s}>
              {c.s}
              <b>{c.n}</b>
            </span>
          ))}
        </div>
        {state.apps.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Channel</th>
                  <th>Stage</th>
                  <th>Date</th>
                  <th>CTC</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.company}</b>
                      <br />
                      <span className="hint">{a.role}</span>
                    </td>
                    <td>{a.channel}</td>
                    <td>
                      <select
                        className={`stage-${a.stage}`}
                        aria-label={`Stage for ${a.company}`}
                        value={a.stage}
                        onChange={(e) => actions.setStage(a.id, e.target.value)}
                      >
                        {STAGES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>{showDate(a.date)}</td>
                    <td>{a.ctc ? `${a.ctc} LPA` : ""}</td>
                    <td>{a.notes}</td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        aria-label={`Delete ${a.company}`}
                        onClick={() => actions.deleteApp(a.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No applications yet. Start adding them from Nov 16, or add wishlist companies now.</p>
        )}
      </div>
    </>
  );
}
