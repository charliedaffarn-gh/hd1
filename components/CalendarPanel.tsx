"use client";

import useSWR from "swr";
import Panel from "./Panel";
import { formatDayLabel, formatEventTime } from "@/lib/format";
import type { CalendarEvent } from "@/types";
import styles from "./CalendarPanel.module.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function fetcher(url: string): Promise<{ events: CalendarEvent[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load calendar");
  return res.json();
}

function groupByDay(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const groups: { label: string; events: CalendarEvent[] }[] = [];

  for (const event of sorted) {
    const label = formatDayLabel(event.start);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }

  return groups;
}

export default function CalendarPanel() {
  const { data, error, isLoading } = useSWR<{ events: CalendarEvent[] }>(
    "/api/calendar",
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  if (isLoading) {
    return (
      <Panel title="Calendar">
        <p className={styles.message}>Loading…</p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Calendar">
        <p className={styles.message}>Couldn&rsquo;t load the calendar.</p>
      </Panel>
    );
  }

  const groups = groupByDay(data?.events ?? []);

  return (
    <Panel title="Calendar">
      {groups.length === 0 ? (
        <p className={styles.message}>No upcoming events.</p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <div className={styles.dayLabel}>{group.label}</div>
            {group.events.map((event) => (
              <div key={event.id} className={styles.event}>
                <div className={styles.eventTime}>{formatEventTime(event)}</div>
                <div className={styles.eventTitle}>{event.title}</div>
              </div>
            ))}
          </div>
        ))
      )}
    </Panel>
  );
}
