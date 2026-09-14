import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Container, ContainerCounts, Recurring } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __dayLogDb: Database.Database | undefined;
}

function init(): Database.Database {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "tasks.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('daily','personal','work','backlog')),
      date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_date ON containers(date) WHERE type = 'daily';

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      done INTEGER NOT NULL DEFAULT 0,
      carried INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_container ON tasks(container_id);

    CREATE TABLE IF NOT EXISTS recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekdays','weekly')),
      weekday INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const fixed = db.prepare("SELECT COUNT(*) AS n FROM containers WHERE type != 'daily'").get() as { n: number };
  if (fixed.n === 0) {
    const ins = db.prepare("INSERT INTO containers (name, type) VALUES (?, ?)");
    ins.run("Work", "work");
    ins.run("Personal", "personal");
    ins.run("Backlog", "backlog");
  }
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__dayLogDb) globalThis.__dayLogDb = init();
  return globalThis.__dayLogDb;
}

export function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

export function ensureDaily(date: string): Container {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, name, type, date FROM containers WHERE type='daily' AND date=?")
    .get(date) as Container | undefined;
  if (existing) return existing;

  const info = db.prepare("INSERT INTO containers (name, type, date) VALUES (?, 'daily', ?)").run(date, date);
  const id = Number(info.lastInsertRowid);

  if (date === todayStr()) {
    const [y, m, d] = date.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const recurring = db.prepare("SELECT * FROM recurring WHERE active=1").all() as Recurring[];
    const due = recurring.filter(
      (r) =>
        r.cadence === "daily" ||
        (r.cadence === "weekdays" && day >= 1 && day <= 5) ||
        (r.cadence === "weekly" && r.weekday === day)
    );
    const ins = db.prepare("INSERT INTO tasks (container_id, subject, notes, position) VALUES (?, ?, ?, ?)");
    due.forEach((r, i) => ins.run(id, r.subject, r.notes, i));
  }

  return db.prepare("SELECT id, name, type, date FROM containers WHERE id=?").get(id) as Container;
}

export function allContainerCounts(): ContainerCounts[] {
  return getDb()
    .prepare(
      `SELECT c.id, c.name, c.type, c.date,
        COUNT(t.id) AS total,
        COALESCE(SUM(CASE WHEN t.done = 0 THEN 1 ELSE 0 END), 0) AS undone
      FROM containers c
      LEFT JOIN tasks t ON t.container_id = c.id
      GROUP BY c.id`
    )
    .all() as ContainerCounts[];
}

export function nextPosition(containerId: number): number {
  const row = getDb()
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM tasks WHERE container_id=?")
    .get(containerId) as { pos: number };
  return row.pos;
}
