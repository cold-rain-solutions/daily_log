"use client";

import Link from "next/link";
import { fmtDay } from "@/lib/client";
import type { HeatCell } from "@/lib/types";

const WEEKS = 17;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function iso(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export default function Heatmap({ cells }: { cells: HeatCell[] }) {
  const byDate = new Map(cells.map((c) => [c.date, c]));
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7);

  const columns: { month: string | null; days: Date[] }[] = [];
  let prevMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const days: Date[] = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + w * 7 + r);
      days.push(d);
    }
    const m = days[0].getMonth();
    columns.push({ month: m !== prevMonth ? MONTH_SHORT[m] : null, days });
    prevMonth = m;
  }

  const todayIso = iso(today);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(24,36,32,0.04)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          History · last {WEEKS} weeks
        </span>
        <span className="flex items-center gap-3 font-mono text-[10px] text-faint">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-pine" /> all done
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-amber" /> unfinished
          </span>
        </span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]">
          {columns.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              <span className="h-3 font-mono text-[9px] leading-3 text-faint">{col.month ?? " "}</span>
              {col.days.map((d) => {
                const dateStr = iso(d);
                if (dateStr > todayIso) return <span key={dateStr} className="h-3 w-3" />;
                const cell = byDate.get(dateStr);
                const cls =
                  cell && cell.total > 0
                    ? cell.done < cell.total
                      ? "bg-amber hover:ring-1 hover:ring-ink"
                      : "bg-pine hover:ring-1 hover:ring-ink"
                    : "bg-line/60";
                const ring = dateStr === todayIso ? " ring-1 ring-ink" : "";
                const title = cell
                  ? `${fmtDay(dateStr)} — ${cell.done}/${cell.total} done`
                  : `${fmtDay(dateStr)} — no log`;
                return cell ? (
                  <Link
                    key={dateStr}
                    href={`/container/${cell.id}`}
                    title={title}
                    className={`h-3 w-3 rounded-[3px] ${cls}${ring}`}
                  />
                ) : (
                  <span key={dateStr} title={title} className={`h-3 w-3 rounded-[3px] ${cls}${ring}`} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
