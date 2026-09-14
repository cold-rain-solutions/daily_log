import { NextResponse } from "next/server";
import { allContainerCounts, ensureDaily, getDb, todayStr } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function POST() {
  const db = getDb();
  const today = todayStr();
  const todayContainer = ensureDaily(today);

  const source = allContainerCounts()
    .filter((c) => c.type === "daily" && c.date !== null && c.date < today && c.undone > 0)
    .sort((a, b) => (a.date! < b.date! ? 1 : -1))[0];
  if (!source) return NextResponse.json({ moved: 0 });

  const moving = db
    .prepare("SELECT * FROM tasks WHERE container_id=? AND done=0 ORDER BY position, id")
    .all(source.id) as Task[];
  const existing = db
    .prepare("SELECT id FROM tasks WHERE container_id=? ORDER BY position, id")
    .all(todayContainer.id) as { id: number }[];

  // Carried tasks go to the top of today's list, keeping their order.
  const setPos = db.prepare("UPDATE tasks SET position=? WHERE id=?");
  const move = db.prepare("UPDATE tasks SET container_id=?, carried=1 WHERE id=?");
  db.transaction(() => {
    moving.forEach((t, i) => {
      move.run(todayContainer.id, t.id);
      setPos.run(i, t.id);
    });
    existing.forEach((t, i) => setPos.run(moving.length + i, t.id));
  })();

  return NextResponse.json({ moved: moving.length, fromDate: source.date });
}
