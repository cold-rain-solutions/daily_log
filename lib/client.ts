import type { Container, ContainerCounts, Task } from "./types";

export async function api<T>(
  url: string,
  init?: Omit<RequestInit, "body"> & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    cache: "no-store",
    ...rest,
    ...(json !== undefined
      ? { body: JSON.stringify(json), headers: { "Content-Type": "application/json" } }
      : {}),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Mon, Aug 1" */
export function fmtDay(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "Monday, August 3" */
export function fmtLong(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function todayLocal(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function containerTitle(c: Pick<Container, "name" | "type" | "date">): string {
  if (c.type === "daily" && c.date) {
    return c.date === todayLocal() ? "Today" : fmtDay(c.date);
  }
  return c.name;
}

/** Plain-text report of a container, for pasting into chat / meeting notes. */
export function containerText(c: ContainerCounts, tasks: Task[]): string {
  const title = c.type === "daily" && c.date ? fmtLong(c.date) : c.name;
  const lines = tasks.map(
    (t) => `${t.done ? "✓" : "○"} ${t.subject}${t.carried && !t.done ? "  (carried over)" : ""}`
  );
  return [`${title} — ${c.total - c.undone}/${c.total} done`, ...lines].join("\n");
}

type ToastListener = (msg: string) => void;
let toastListener: ToastListener | null = null;

export function toast(msg: string) {
  toastListener?.(msg);
}

export function onToast(l: ToastListener): () => void {
  toastListener = l;
  return () => {
    if (toastListener === l) toastListener = null;
  };
}
