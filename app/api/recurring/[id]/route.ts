import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Recurring } from "@/lib/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const db = getDb();
  const item = db.prepare("SELECT * FROM recurring WHERE id=?").get(Number(id)) as Recurring | undefined;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (typeof body.active === "boolean") {
    db.prepare("UPDATE recurring SET active=? WHERE id=?").run(body.active ? 1 : 0, item.id);
  }
  if (typeof body.subject === "string" && body.subject.trim()) {
    db.prepare("UPDATE recurring SET subject=? WHERE id=?").run(body.subject.trim(), item.id);
  }
  const updated = db.prepare("SELECT * FROM recurring WHERE id=?").get(item.id);
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  getDb().prepare("DELETE FROM recurring WHERE id=?").run(Number(id));
  return NextResponse.json({ ok: true });
}
