"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import TaskEntry from "@/components/TaskEntry";
import TaskList from "@/components/TaskList";
import { api, containerText, containerTitle, fmtLong, toast } from "@/lib/client";
import type { ContainerData, Task } from "@/lib/types";

export default function ContainerPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ContainerData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    const d = await api<ContainerData>(`/api/containers/${id}`);
    setData(d);
    setTasks(d.tasks);
  }, [id]);

  useEffect(() => {
    void load();
    const onChanged = () => void load();
    window.addEventListener("daylog:changed", onChanged);
    return () => window.removeEventListener("daylog:changed", onChanged);
  }, [load]);

  if (!data) {
    return <div className="p-10 font-mono text-sm text-soft">Loading…</div>;
  }

  const c = data.container;
  const open = tasks.filter((t) => !t.done).length;

  async function add(subjects: string[]) {
    await api("/api/tasks", { method: "POST", json: { container_id: c.id, subjects } });
    void load();
  }

  function copyList() {
    void navigator.clipboard.writeText(containerText({ ...c, total: tasks.length, undone: open }, tasks));
    toast("Copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm text-soft transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-soft">
            {c.type === "daily" && c.date ? fmtLong(c.date) : c.type}
            {tasks.length > 0 && (open > 0 ? ` · ${open} open of ${tasks.length}` : " · all done ✓")}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{containerTitle(c)}</h1>
        </div>
        <button
          onClick={copyList}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-soft transition-colors hover:border-faint hover:text-ink"
          title="Copy this list as text"
        >
          <Copy size={14} /> Copy as text
        </button>
      </div>

      <div className="space-y-4">
        <TaskEntry onAdd={add} autoFocus />
        <TaskList
          containerId={c.id}
          tasks={tasks}
          setTasks={setTasks}
          containers={data.containers}
          onMutated={() => void load()}
          emptyText="Nothing here yet — add a task above."
        />
      </div>
    </div>
  );
}
