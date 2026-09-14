"use client";

import { useEffect, useState } from "react";
import { Copy, Repeat } from "lucide-react";
import TaskEntry from "./TaskEntry";
import TaskList from "./TaskList";
import RecurringDialog from "./RecurringDialog";
import { api, containerText, fmtDay, fmtLong, toast } from "@/lib/client";
import type { DashboardData, Task } from "@/lib/types";

interface Props {
  data: DashboardData;
  onRefresh: () => void;
}

export default function TodayLog({ data, onRefresh }: Props) {
  const today = data.today;
  const [tasks, setTasks] = useState<Task[]>(today.tasks);
  const [recurringOpen, setRecurringOpen] = useState(false);
  useEffect(() => setTasks(today.tasks), [today.tasks]);

  const open = tasks.filter((t) => !t.done).length;
  const moveContainers = [today, ...data.fixed, ...data.activeDailies];

  async function add(subjects: string[]) {
    await api("/api/tasks", { method: "POST", json: { container_id: today.id, subjects } });
    onRefresh();
  }

  async function carryOver() {
    const res = await api<{ moved: number }>("/api/carryover", { method: "POST" });
    toast(`Carried over ${res.moved} task${res.moved === 1 ? "" : "s"}`);
    onRefresh();
  }

  function copyDay() {
    void navigator.clipboard.writeText(
      containerText({ ...today, total: tasks.length, undone: open }, tasks)
    );
    toast("Copied to clipboard");
  }

  const buttonCls =
    "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-soft transition-colors hover:border-faint hover:text-ink";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-soft">
            Today {open > 0 ? `· ${open} open` : tasks.length > 0 ? "· all done ✓" : ""}
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">{fmtLong(today.date!)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyDay} className={buttonCls} title="Copy today as text for chat or meeting notes">
            <Copy size={14} /> Copy as text
          </button>
          <button onClick={() => setRecurringOpen(true)} className={buttonCls}>
            <Repeat size={14} /> Recurring
          </button>
        </div>
      </div>

      {data.carryover && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber/30 bg-amber-soft px-4 py-2.5">
          <p className="text-sm">
            <span className="mr-1 font-mono font-semibold text-amber">»</span>
            {data.carryover.count} unfinished task{data.carryover.count === 1 ? "" : "s"} left on{" "}
            {fmtDay(data.carryover.fromDate)}
          </p>
          <button
            onClick={() => void carryOver()}
            className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-pine-deep"
          >
            Carry over to today
          </button>
        </div>
      )}

      <TaskEntry onAdd={add} autoFocus inputId="quick-entry" placeholder="Add a task and press Enter — “/” focuses here" />

      <TaskList
        containerId={today.id}
        tasks={tasks}
        setTasks={setTasks}
        containers={moveContainers}
        onMutated={onRefresh}
        emptyText="A clean slate — add your first task for today."
      />

      <RecurringDialog open={recurringOpen} onClose={() => setRecurringOpen(false)} />
    </section>
  );
}
