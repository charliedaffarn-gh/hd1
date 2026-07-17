"use client";

import Panel from "./Panel";
import { formatDayLabel, formatEventTime } from "@/lib/format";
import type { CalendarEvent } from "@/types";
import styles from "./CalendarPanel.module.css";

function buildMockEvents(): CalendarEvent[] {
  const now = new Date();
  const at = (dayOffset: number, hour: number, minute = 0) =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayOffset,
      hour,
      minute,
    ).toISOString();

  return [
    {
      id: "1",
      title: "School drop-off",
      start: at(0, 8, 30),
      end: at(0, 9, 0),
      calendarName: "Family",
    },
    {
      id: "2",
      title: "Soccer practice",
      start: at(0, 16, 30),
      end: at(0, 17, 30),
      calendarName: "Kids",
    },
    {
      id: "3",
      title: "Family dinner",
      start: at(0, 18, 30),
      end: at(0, 19, 30),
      calendarName: "Family",
    },
    {
      id: "4",
      title: "Bin collection",
      start: at(1, 0, 0),
      end: at(1, 0, 0),
      allDay: true,
      calendarName: "Family",
    },
    {
      id: "5",
      title: "Dentist – Emma",
      start: at(1, 10, 0),
      end: at(1, 11, 0),
      calendarName: "Kids",
    },
  ];
}

const mockEvents = buildMockEvents();

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
  const groups = groupByDay(mockEvents);

  return (
    <Panel title="Calendar">
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <div className={styles.dayLabel}>{group.label}</div>
          {group.events.map((event) => (
            <div key={event.id} className={styles.event}>
              <div className={styles.eventTime}>{formatEventTime(event)}</div>
              <div className={styles.eventTitle}>{event.title}</div>
            </div>
          ))}
        </div>
      ))}
    </Panel>
  );
}
