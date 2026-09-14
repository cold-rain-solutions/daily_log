import { NextResponse } from "next/server";
import { getDb, nextPosition } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const containerId = Number(body.container_id);
  const subjects: string[] = Array.isArray(body.subjects)
    ? body.subjects
    : typeof body.subject === "string"
      ? [body.subject]
      : [];
  const cleaned = subjects.map((s) => s.trim()).filter(Boolean);
  if (!containerId || cleaned.length === 0) {
    return NextResponse.json({ error: "container_id and a non-empty subject are required" }, { status: 400 });
  }

  const db = getDb();
  const container = db.prepare("SELECT id FROM containers WHERE id=?").get(containerId);
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  let pos = nextPosition(containerId);
  const ins = db.prepare("INSERT INTO tasks (container_id, subject, position) VALUES (?, ?, ?)");
  const ids: number[] = [];
  db.transaction(() => {
    for (const subject of cleaned) ids.push(Number(ins.run(containerId, subject, pos++).lastInsertRowid));
  })();

  const placeholders = ids.map(() => "?").join(",");
  const tasks = db
    .prepare(`SELECT * FROM tasks WHERE id IN (${placeholders}) ORDER BY position`)
    .all(...ids) as Task[];
  return NextResponse.json({ tasks });
}
