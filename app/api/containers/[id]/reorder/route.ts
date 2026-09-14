import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { ids } = (await req.json()) as { ids: number[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids must be an array" }, { status: 400 });

  const db = getDb();
  const update = db.prepare("UPDATE tasks SET position=? WHERE id=? AND container_id=?");
  db.transaction(() => {
    ids.forEach((taskId, i) => update.run(i, taskId, Number(id)));
  })();
  return NextResponse.json({ ok: true });
}
