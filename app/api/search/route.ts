import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const results = getDb()
    .prepare(
      `SELECT t.*, c.name AS container_name, c.type AS container_type, c.date AS container_date
      FROM tasks t JOIN containers c ON c.id = t.container_id
      WHERE t.subject LIKE ? ESCAPE '\\' OR t.notes LIKE ? ESCAPE '\\'
      ORDER BY t.done ASC, t.id DESC
      LIMIT 30`
    )
    .all(like, like);
  return NextResponse.json({ results });
}
