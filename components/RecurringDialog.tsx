"use client";

import { useEffect, useState } from "react";
import { Repeat, Trash2, X } from "lucide-react";
import { api, toast } from "@/lib/client";
import type { Cadence, Recurring } from "@/lib/types";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function cadenceLabel(item: Recurring): string {
  if (item.cadence === "daily") return "Every day";
  if (item.cadence === "weekdays") return "Weekdays";
  return `Weekly · ${WEEKDAY_NAMES[item.weekday ?? 1]}`;
}

export default function RecurringDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<Recurring[]>([]);
  const [subject, setSubject] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekdays");
  const [weekday, setWeekday] = useState(1);

  useEffect(() => {
    if (!open) return;
    void api<{ items: Recurring[] }>("/api/recurring").then((d) => setItems(d.items));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const s = subject.trim();
    if (!s) return;
    const { item } = await api<{ item: Recurring }>("/api/recurring", {
      method: "POST",
      json: { subject: s, cadence, weekday: cadence === "weekly" ? weekday : null },
    });
    setItems((xs) => [...xs, item]);
    setSubject("");
    toast("Recurring task added");
  }

  async function toggle(item: Recurring) {
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, active: item.active ? 0 : 1 } : x)));
    await api(`/api/recurring/${item.id}`, { method: "PATCH", json: { active: !item.active } });
  }

  async function del(item: Recurring) {
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    await api(`/api/recurring/${item.id}`, { method: "DELETE" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/25 px-4 pt-[12vh]"
      style={{ animation: "fade-in 120ms ease-out" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Repeat size={16} className="text-pine" /> Recurring tasks
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-soft hover:bg-paper">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4 text-xs text-soft">Active items are added automatically when a new day’s log is created.</p>

        <form onSubmit={add} className="mb-4 space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Check the deploy status"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-pine focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              aria-label="How often"
              className="flex-1 rounded-lg border border-line bg-surface px-2 py-2 text-sm focus:border-pine focus:outline-none"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays (Mon–Fri)</option>
              <option value="weekly">Weekly</option>
            </select>
            {cadence === "weekly" && (
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                aria-label="Which day"
                className="flex-1 rounded-lg border border-line bg-surface px-2 py-2 text-sm focus:border-pine focus:outline-none"
              >
                {WEEKDAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              className="rounded-lg bg-pine px-4 py-2 text-sm font-medium text-surface hover:bg-pine-deep"
            >
              Add
            </button>
          </div>
        </form>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {items.length === 0 && <li className="py-2 text-sm text-faint">No recurring tasks yet.</li>}
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-paper">
              <button
                onClick={() => void toggle(item)}
                role="switch"
                aria-checked={!!item.active}
                aria-label={`Toggle "${item.subject}"`}
                className={`h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors ${
                  item.active ? "bg-pine" : "bg-line"
                }`}
              >
                <span
                  className={`block h-3 w-3 rounded-full bg-surface transition-transform ${
                    item.active ? "translate-x-3" : ""
                  }`}
                />
              </button>
              <span className={`flex-1 truncate text-sm ${item.active ? "" : "text-faint"}`}>{item.subject}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-faint">
                {cadenceLabel(item)}
              </span>
              <button
                onClick={() => void del(item)}
                aria-label="Delete recurring task"
                className="shrink-0 rounded-md p-1 text-soft opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
