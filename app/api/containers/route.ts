import { NextResponse } from "next/server";
import { allContainerCounts, ensureDaily, todayStr } from "@/lib/db";

export async function GET() {
  const today = ensureDaily(todayStr());
  return NextResponse.json({ containers: allContainerCounts(), todayId: today.id });
}

export async function POST(req: Request) {
  const body = await req.json();
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  if (!date) return NextResponse.json({ error: "A date in YYYY-MM-DD format is required" }, { status: 400 });
  const container = ensureDaily(date);
  return NextResponse.json({ container });
}
