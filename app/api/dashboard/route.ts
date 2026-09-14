import { NextResponse } from "next/server";
import { addDays, allContainerCounts, ensureDaily, getDb, todayStr } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const today = todayStr();
  const todayContainer = ensureDaily(today);

  const counts = allContainerCounts();
  const todayCounts = counts.find((c) => c.id === todayContainer.id)!;
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE container_id=? ORDER BY position, id")
    .all(todayContainer.id) as Task[];

  const typeOrder = { work: 0, personal: 1, backlog: 2 } as Record<string, number>;
  const fixed = counts
    .filter((c) => c.type !== "daily")
    .sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9));

  const pastDailies = counts.filter((c) => c.type === "daily" && c.date !== null && c.date < today);
  const activeDailies = pastDailies
    .filter((c) => c.undone > 0)
    .sort((a, b) => (a.date! < b.date! ? 1 : -1));
  const archivedDailies = pastDailies
    .filter((c) => c.undone === 0)
    .sort((a, b) => (a.date! < b.date! ? 1 : -1));

  const carrySource = activeDailies[0] ?? null;
  const carryover = carrySource
    ? { fromId: carrySource.id, fromDate: carrySource.date!, count: carrySource.undone }
    : null;

  const heatStart = addDays(today, -118);
  const heatmap = counts
    .filter((c) => c.type === "daily" && c.date !== null && c.date >= heatStart)
    .map((c) => ({ id: c.id, date: c.date!, total: c.total, done: c.total - c.undone }));

  return NextResponse.json({
    today: { ...todayCounts, tasks },
    fixed,
    activeDailies,
    archivedDailies,
    carryover,
    heatmap,
  });
}
