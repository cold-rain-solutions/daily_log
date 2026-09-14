import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Recurring } from "@/lib/types";

export async function GET() {
  const items = getDb().prepare("SELECT * FROM recurring ORDER BY id").all() as Recurring[];
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json();
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const cadence = ["daily", "weekdays", "weekly"].includes(body.cadence) ? body.cadence : null;
  const weekday =
    cadence === "weekly" && Number.isInteger(body.weekday) && body.weekday >= 0 && body.weekday <= 6
      ? body.weekday
      : null;
  if (!subject || !cadence || (cadence === "weekly" && weekday === null)) {
    return NextResponse.json({ error: "subject and a valid cadence are required" }, { status: 400 });
  }

  const db = getDb();
  const info = db
    .prepare("INSERT INTO recurring (subject, cadence, weekday) VALUES (?, ?, ?)")
    .run(subject, cadence, weekday);
  const item = db.prepare("SELECT * FROM recurring WHERE id=?").get(Number(info.lastInsertRowid));
  return NextResponse.json({ item });
}
