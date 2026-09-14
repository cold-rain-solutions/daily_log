import { NextResponse } from "next/server";
import { getDb, nextPosition } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  const body = await req.json();

  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(taskId) as Task | undefined;
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (typeof body.subject === "string" && body.subject.trim()) {
    db.prepare("UPDATE tasks SET subject=? WHERE id=?").run(body.subject.trim(), taskId);
  }
  if (typeof body.notes === "string") {
    db.prepare("UPDATE tasks SET notes=? WHERE id=?").run(body.notes, taskId);
  }
  if (typeof body.done === "boolean") {
    db.prepare("UPDATE tasks SET done=?, completed_at=? WHERE id=?").run(
      body.done ? 1 : 0,
      body.done ? new Date().toISOString() : null,
      taskId
    );
  }
  if (typeof body.container_id === "number" && body.container_id !== task.container_id) {
    const target = db.prepare("SELECT id FROM containers WHERE id=?").get(body.container_id);
    if (!target) return NextResponse.json({ error: "Target container not found" }, { status: 404 });
    db.prepare("UPDATE tasks SET container_id=?, position=? WHERE id=?").run(
      body.container_id,
      nextPosition(body.container_id),
      taskId
    );
  }

  const updated = db.prepare("SELECT * FROM tasks WHERE id=?").get(taskId) as Task;
  return NextResponse.json({ task: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  getDb().prepare("DELETE FROM tasks WHERE id=?").run(Number(id));
  return NextResponse.json({ ok: true });
}
