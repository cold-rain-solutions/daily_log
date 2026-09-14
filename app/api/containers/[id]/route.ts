import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Container, ContainerCounts, Task } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = getDb();
  const container = db
    .prepare(
      `SELECT c.id, c.name, c.type, c.date,
        COUNT(t.id) AS total,
        COALESCE(SUM(CASE WHEN t.done = 0 THEN 1 ELSE 0 END), 0) AS undone
      FROM containers c LEFT JOIN tasks t ON t.container_id = c.id
      WHERE c.id = ? GROUP BY c.id`
    )
    .get(Number(id)) as ContainerCounts | undefined;
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  const tasks = db
    .prepare("SELECT * FROM tasks WHERE container_id=? ORDER BY position, id")
    .all(container.id) as Task[];
  const containers = db
    .prepare("SELECT id, name, type, date FROM containers ORDER BY type, date DESC")
    .all() as Container[];

  return NextResponse.json({ container, tasks, containers });
}
