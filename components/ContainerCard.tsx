"use client";

import Link from "next/link";
import { containerTitle } from "@/lib/client";
import type { ContainerCounts } from "@/lib/types";

export default function ContainerCard({ c }: { c: ContainerCounts }) {
  const typeLabel = c.type === "daily" ? "day log" : c.type;

  return (
    <Link
      href={`/container/${c.id}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(24,36,32,0.04)] transition hover:-translate-y-0.5 hover:border-pine/50 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">{typeLabel}</span>
        {c.total > 0 &&
          (c.undone > 0 ? (
            <span className="h-2 w-2 rounded-full bg-amber" title={`${c.undone} open`} />
          ) : (
            <span className="font-mono text-xs text-pine" title="All done">
              ✓
            </span>
          ))}
      </div>
      <h3 className="font-display text-lg font-semibold leading-tight">{containerTitle(c)}</h3>
      <div className="mt-auto flex items-baseline gap-1.5">
        {c.undone > 0 ? (
          <>
            <span className="font-display text-2xl font-bold text-amber">{c.undone}</span>
            <span className="text-xs text-soft">open · {c.total} total</span>
          </>
        ) : c.total > 0 ? (
          <span className="text-sm font-medium text-pine">All {c.total} done</span>
        ) : (
          <span className="text-sm text-faint">Empty</span>
        )}
      </div>
    </Link>
  );
}
