"use client";

import { useEffect, useRef, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronRight } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import TaskRow from "./TaskRow";
import { api, containerTitle, toast } from "@/lib/client";
import type { Container, Task } from "@/lib/types";

interface Props {
  containerId: number;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  containers: Container[];
  onMutated?: () => void;
  emptyText?: string;
}

export default function TaskList({ containerId, tasks, setTasks, containers, onMutated, emptyText }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const moveTargets = containers.filter((c) => c.id !== containerId);

  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);
  const allDone = tasks.length > 0 && openTasks.length === 0;

  // Completed list is collapsed by default, but auto-expands the moment a day
  // has no open tasks left (including when opening a fully-completed day).
  const [showDone, setShowDone] = useState(allDone);
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) setShowDone(true);
    prevAllDone.current = allDone;
  }, [allDone]);

  function toggle(task: Task) {
    const done = task.done ? 0 : 1;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, done: done as 0 | 1 } : t)));
    void api(`/api/tasks/${task.id}`, { method: "PATCH", json: { done: !task.done } }).then(() => onMutated?.());
  }

  // Delete asks for confirmation first; focus returns to the row (or its
  // neighbour once the row is gone) so keyboard flow isn't interrupted.
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  function requestDelete(task: Task) {
    returnFocus.current = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-taskrow]") ?? null;
    setPendingDelete(task);
  }

  function cancelDelete() {
    setPendingDelete(null);
    returnFocus.current?.focus();
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const row = returnFocus.current;
    const neighbour = (row?.nextElementSibling ?? row?.previousElementSibling) as HTMLElement | null;
    del(pendingDelete);
    setPendingDelete(null);
    requestAnimationFrame(() => neighbour?.focus());
  }

  function del(task: Task) {
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    void api(`/api/tasks/${task.id}`, { method: "DELETE" }).then(() => {
      toast("Task deleted");
      onMutated?.();
    });
  }

  function move(task: Task, targetId: number) {
    const target = containers.find((c) => c.id === targetId);
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    void api(`/api/tasks/${task.id}`, { method: "PATCH", json: { container_id: targetId } }).then(() => {
      toast(`Moved to ${target ? containerTitle(target) : "another list"}`);
      onMutated?.();
    });
  }

  function save(task: Task, patch: { subject?: string; notes?: string }) {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    void api(`/api/tasks/${task.id}`, { method: "PATCH", json: patch }).then(() => onMutated?.());
  }

  function persistOrder(nextOpen: Task[], nextDone: Task[]) {
    const next = [...nextOpen, ...nextDone];
    setTasks(next);
    void api(`/api/containers/${containerId}/reorder`, {
      method: "POST",
      json: { ids: next.map((t) => t.id) },
    }).then(() => onMutated?.());
  }

  function dragEndFor(list: Task[], isDone: boolean) {
    return (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const from = list.findIndex((t) => t.id === active.id);
      const to = list.findIndex((t) => t.id === over.id);
      if (from < 0 || to < 0) return;
      const moved = arrayMove(list, from, to);
      if (isDone) persistOrder(openTasks, moved);
      else persistOrder(moved, doneTasks);
    };
  }

  function keyReorder(task: Task, dir: -1 | 1) {
    const isDone = !!task.done;
    const list = isDone ? doneTasks : openTasks;
    const from = list.findIndex((t) => t.id === task.id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= list.length) return;
    const moved = arrayMove(list, from, to);
    if (isDone) persistOrder(openTasks, moved);
    else persistOrder(moved, doneTasks);
  }

  function list(items: Task[], isDone: boolean) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEndFor(items, isDone)}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(24,36,32,0.04)]">
            {items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                moveTargets={moveTargets}
                onToggle={toggle}
                onDelete={requestDelete}
                onMove={move}
                onSave={save}
                onKeyReorder={keyReorder}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-faint">
        {emptyText ?? "Nothing here yet — add a task above."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task?"
        message={
          <>
            <span className="font-medium text-ink">{pendingDelete?.subject}</span> will be permanently deleted.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {openTasks.length > 0 ? (
        list(openTasks, false)
      ) : (
        <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-pine">
          All done ✓
        </div>
      )}

      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            className="flex items-center gap-1.5 rounded-md px-1 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-soft hover:text-ink"
          >
            <ChevronRight size={13} className={`transition-transform ${showDone ? "rotate-90" : ""}`} />
            Completed · {doneTasks.length}
          </button>
          {showDone && <div className="mt-2">{list(doneTasks, true)}</div>}
        </div>
      )}
    </div>
  );
}
