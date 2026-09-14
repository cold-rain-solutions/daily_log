"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ChevronDown, Search } from "lucide-react";
import TodayLog from "./TodayLog";
import ContainerCard from "./ContainerCard";
import Heatmap from "./Heatmap";
import { api, fmtDay, todayLocal } from "@/lib/client";
import type { Container, DashboardData } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [newDayOpen, setNewDayOpen] = useState(false);
  const [newDate, setNewDate] = useState(todayLocal());

  const load = useCallback(async () => {
    setData(await api<DashboardData>("/api/dashboard"));
  }, []);

  useEffect(() => {
    void load();
    const onChanged = () => void load();
    window.addEventListener("daylog:changed", onChanged);
    return () => window.removeEventListener("daylog:changed", onChanged);
  }, [load]);

  useEffect(() => {
    const open = data?.today.undone ?? 0;
    document.title = open > 0 ? `(${open}) Daily Log` : "Daily Log";
  }, [data]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      document.getElementById("quick-entry")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function createDay(e: React.FormEvent) {
    e.preventDefault();
    const { container } = await api<{ container: Container }>("/api/containers", {
      method: "POST",
      json: { date: newDate },
    });
    setNewDayOpen(false);
    if (newDate === todayLocal()) void load();
    else router.push(`/container/${container.id}`);
  }

  const buttonCls =
    "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-soft transition-colors hover:border-faint hover:text-ink";

  if (!data) {
    return <div className="p-10 font-mono text-sm text-soft">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine font-mono text-sm text-surface">
            ✓
          </span>
            Daily Log
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("daylog:open-palette"))}
            className={buttonCls}
          >
            <Search size={14} /> Search
            <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-faint">
              ⌘K
            </kbd>
          </button>
          <div className="relative">
            <button onClick={() => setNewDayOpen((v) => !v)} className={buttonCls}>
              <CalendarPlus size={14} /> New day
            </button>
            {newDayOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setNewDayOpen(false)} />
                <form
                  onSubmit={createDay}
                  className="absolute right-0 top-10 z-30 flex w-56 flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-lg"
                >
                  <label className="font-mono text-[10px] uppercase tracking-wider text-faint" htmlFor="new-day-date">
                      Daily log for
                  </label>
                  <input
                    id="new-day-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="rounded-lg border border-line px-2 py-1.5 text-sm focus:border-pine focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-pine px-3 py-1.5 text-sm font-medium text-surface hover:bg-pine-deep"
                  >
                    Open daily log
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>

      <TodayLog data={data} onRefresh={() => void load()} />

      {data.activeDailies.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-soft">
            Open days · {data.activeDailies.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.activeDailies.map((c) => (
              <ContainerCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-soft">Collections</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.fixed.map((c) => (
            <ContainerCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Heatmap cells={data.heatmap} />
      </section>

      {data.archivedDailies.length > 0 && (
        <section className="mt-10">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-soft hover:text-ink">
              <ChevronDown size={13} className="-rotate-90 transition-transform group-open:rotate-0" />
              Archive · {data.archivedDailies.length} finished day{data.archivedDailies.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-1">
              {data.archivedDailies.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/container/${c.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface"
                  >
                    <span className="text-sm">{fmtDay(c.date!)}</span>
                    <span className="font-mono text-xs text-pine">
                      {c.total === 0 ? "empty" : `${c.total} task${c.total === 1 ? "" : "s"} · all done ✓`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
