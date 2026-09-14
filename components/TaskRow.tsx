"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, Check, ChevronUp, FolderInput, GripVertical, PenLine, Trash2 } from "lucide-react";
import NotesEditor from "./NotesEditor";
import { containerTitle } from "@/lib/client";
import type { Container, Task } from "@/lib/types";

interface Props {
  task: Task;
  moveTargets: Container[];
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, targetId: number) => void;
  onSave: (t: Task, patch: { subject?: string; notes?: string }) => void;
  onKeyReorder: (t: Task, dir: -1 | 1) => void;
}

export default function TaskRow({ task, moveTargets, onToggle, onDelete, onMove, onSave, onKeyReorder }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState(task.subject);
  const rowRef = useRef<HTMLLIElement | null>(null);

  const pendingNotes = useRef<string | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  useEffect(() => setSubjectDraft(task.subject), [task.subject]);
  // flush unsaved notes if the row unmounts while the editor is open
  useEffect(() => () => flushNotes(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function queueNotes(html: string) {
    pendingNotes.current = html;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(flushNotes, 600);
  }

  function flushNotes() {
    if (notesTimer.current) {
      clearTimeout(notesTimer.current);
      notesTimer.current = null;
    }
    if (pendingNotes.current !== null && pendingNotes.current !== task.notes) {
      onSave(task, { notes: pendingNotes.current });
    }
    pendingNotes.current = null;
  }

  function saveSubject() {
    const s = subjectDraft.trim();
    if (s && s !== task.subject) onSave(task, { subject: s });
    else setSubjectDraft(task.subject);
  }

  function closePanel() {
    flushNotes();
    saveSubject();
    setExpanded(false);
    rowRef.current?.focus();
  }

  function handleRowKey(e: React.KeyboardEvent<HTMLLIElement>) {
    if (e.target !== e.currentTarget) return;
    const key = e.key.toLowerCase();
    if (e.key === " " || key === "x") {
      e.preventDefault();
      onToggle(task);
    } else if (e.key === "Enter" || key === "e") {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete(task);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      if (e.altKey) {
        onKeyReorder(task, dir);
        return;
      }
      const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-taskrow]"));
      const i = rows.indexOf(e.currentTarget);
      rows[i + dir]?.focus();
    }
  }

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        rowRef.current = node;
      }}
      data-taskrow
      tabIndex={0}
      onKeyDown={handleRowKey}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative bg-surface px-3 py-2 outline-offset-[-2px] first:rounded-t-[11px] last:rounded-b-[11px] ${isDragging ? "z-10 shadow-md" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          tabIndex={-1}
          aria-label="Drag to reorder"
          className="mt-1.5 shrink-0 cursor-grab touch-none text-faint opacity-0 transition-opacity group-hover:opacity-60"
        >
          <GripVertical size={14} />
        </button>

        <button
          onClick={() => onToggle(task)}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            task.done
              ? "border-pine bg-pine text-surface"
              : "border-faint bg-surface hover:border-pine hover:bg-pine-soft"
          }`}
        >
          {task.done ? <Check size={12} strokeWidth={3} /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => (expanded ? closePanel() : setExpanded(true))}
            className="flex w-full items-center gap-1.5 text-left"
          >
            {task.carried === 1 && task.done === 0 && (
              <span className="shrink-0 font-mono font-semibold text-amber" title="Carried over from a previous day">
                »
              </span>
            )}
            <span className={`truncate text-[15px] ${task.done ? "text-faint line-through" : ""}`}>
              {task.subject}
            </span>
            {task.notes && !expanded && <AlignLeft size={13} className="shrink-0 text-faint" />}
          </button>

          {expanded && (
            <div
              className="mt-2 space-y-2 pb-1"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  closePanel();
                }
              }}
            >
              <input
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                onBlur={saveSubject}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveSubject();
                  }
                }}
                aria-label="Task subject"
                className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[15px] focus:border-pine focus:outline-none"
              />
              <NotesEditor value={task.notes} onChange={queueNotes} />
              <div className="flex justify-end">
                <button
                  onClick={closePanel}
                  className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] text-soft hover:bg-paper hover:text-ink"
                >
                  <ChevronUp size={12} /> close · esc
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={() => setMoveOpen((v) => !v)}
            aria-label="Move to another list"
            title="Move to another list"
            className="rounded-md p-1.5 text-soft hover:bg-paper hover:text-ink"
          >
            <FolderInput size={15} />
          </button>
          <button
            onClick={() => (expanded ? closePanel() : setExpanded(true))}
            aria-label={expanded ? "Close notes" : "Edit notes"}
            title={expanded ? "Close notes" : "Edit notes"}
            className="rounded-md p-1.5 text-soft hover:bg-paper hover:text-ink"
          >
            <PenLine size={15} />
          </button>
          <button
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            title="Delete task"
            className="rounded-md p-1.5 text-soft hover:bg-paper hover:text-danger"
          >
            <Trash2 size={15} />
          </button>

          {moveOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMoveOpen(false)} />
              <div className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
                <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-faint">Move to</p>
                {moveTargets.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setMoveOpen(false);
                      onMove(task, c.id);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-pine-soft"
                  >
                    {containerTitle(c)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
