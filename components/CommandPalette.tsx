"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Circle, Folder, Plus, Search } from "lucide-react";
import { api, containerTitle, toast, todayLocal } from "@/lib/client";
import type { ContainerCounts, SearchResult } from "@/lib/types";

type Item =
  | { kind: "add"; subject: string }
  | { kind: "container"; c: ContainerCounts }
  | { kind: "task"; t: SearchResult };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [containers, setContainers] = useState<ContainerCounts[]>([]);
  const [todayId, setTodayId] = useState<number | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  const show = useCallback(() => {
    setQ("");
    setResults([]);
    setSel(0);
    setOpen(true);
    void api<{ containers: ContainerCounts[]; todayId: number }>("/api/containers").then((d) => {
      setContainers(d.containers);
      setTodayId(d.todayId);
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    }
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener("daylog:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("daylog:open-palette", onOpen);
    };
  }, [open, show]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      void api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(query)}`).then((d) =>
        setResults(d.results)
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [q, open]);

  const query = q.trim();
  const today = todayLocal();
  const jumpList: ContainerCounts[] = !query
    ? [
        ...containers.filter((c) => c.type === "daily" && c.date === today),
        ...containers.filter((c) => c.type !== "daily"),
        ...containers
          .filter((c) => c.type === "daily" && c.date !== today)
          .sort((a, b) => (a.date! < b.date! ? 1 : -1))
          .slice(0, 6),
      ]
    : [];
  const items: Item[] = query
    ? [{ kind: "add", subject: query }, ...results.map((t) => ({ kind: "task" as const, t }))]
    : jumpList.map((c) => ({ kind: "container" as const, c }));

  useEffect(() => setSel(0), [q, open]);
  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  async function exec(item: Item) {
    if (item.kind === "add") {
      if (!todayId) return;
      await api("/api/tasks", { method: "POST", json: { container_id: todayId, subjects: [item.subject] } });
      toast("Added to Today");
      setQ("");
      window.dispatchEvent(new Event("daylog:changed"));
    } else if (item.kind === "container") {
      setOpen(false);
      router.push(`/container/${item.c.id}`);
    } else {
      setOpen(false);
      router.push(`/container/${item.t.container_id}`);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/25 px-4 pt-[14vh]"
      style={{ animation: "fade-in 120ms ease-out" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Search size={16} className="shrink-0 text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter" && items[sel]) {
                e.preventDefault();
                void exec(items[sel]);
              }
            }}
            placeholder="Search tasks, or type to add to Today…"
            className="w-full bg-transparent text-[15px] placeholder:text-faint focus:outline-none"
          />
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
          {items.map((item, i) => (
            <li key={item.kind === "task" ? `t${item.t.id}` : item.kind === "container" ? `c${item.c.id}` : "add"}>
              <button
                onClick={() => void exec(item)}
                onMouseMove={() => setSel(i)}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm ${
                  i === sel ? "bg-pine-soft" : ""
                }`}
              >
                {item.kind === "add" && (
                  <>
                    <Plus size={15} className="shrink-0 text-pine" />
                    <span>
                      Add <span className="font-medium">“{item.subject}”</span> to Today
                    </span>
                  </>
                )}
                {item.kind === "container" && (
                  <>
                    {item.c.type === "daily" ? (
                      <Calendar size={15} className="shrink-0 text-soft" />
                    ) : (
                      <Folder size={15} className="shrink-0 text-soft" />
                    )}
                    <span className="flex-1 truncate">{containerTitle(item.c)}</span>
                    {item.c.undone > 0 && (
                      <span className="font-mono text-xs text-amber">{item.c.undone} open</span>
                    )}
                  </>
                )}
                {item.kind === "task" && (
                  <>
                    {item.t.done ? (
                      <Check size={15} className="shrink-0 text-pine" />
                    ) : (
                      <Circle size={13} className="shrink-0 text-faint" />
                    )}
                    <span className={`flex-1 truncate ${item.t.done ? "text-faint line-through" : ""}`}>
                      {item.t.subject}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-faint">
                      {containerTitle({
                        name: item.t.container_name,
                        type: item.t.container_type,
                        date: item.t.container_date,
                      })}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
          {query && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-faint">No matching tasks — Enter adds it to Today.</li>
          )}
        </ul>

        <div className="border-t border-line px-4 py-2 font-mono text-[10px] text-faint">
          ↑↓ navigate · ↵ select · esc close
        </div>
      </div>
    </div>
  );
}
