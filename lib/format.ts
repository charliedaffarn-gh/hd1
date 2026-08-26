const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDaysFromToday(iso: string): number {
  return Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / DAY_MS,
  );
}

export function formatDayLabel(iso: string): string {
  const diffDays = diffDaysFromToday(iso);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export type TaskDueStatus = "overdue" | "today" | "upcoming";

export function getTaskDueStatus(due: string): TaskDueStatus {
  const diffDays = diffDaysFromToday(due);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

// Google Tasks only stores a due date (always midnight UTC, no time-of-day)
// so this only ever needs to talk about days, never times.
export function formatTaskDue(due: string): string {
  const status = getTaskDueStatus(due);
  if (status === "today") return "Due today";
  if (status === "overdue") return `Overdue — was due ${formatDayLabel(due)}`;
  return `Due ${formatDayLabel(due)}`;
}

export function formatEventTime(event: {
  start: string;
  end: string;
  allDay?: boolean;
}): string {
  if (event.allDay) return "All day";
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(event.start).toLocaleTimeString(undefined, opts);
  const end = new Date(event.end).toLocaleTimeString(undefined, opts);
  return `${start} – ${end}`;
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffMin = Math.round((now - new Date(iso).getTime()) / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}
