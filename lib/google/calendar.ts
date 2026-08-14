import { google } from "googleapis";
import { getPrimaryRefreshToken } from "@/lib/accounts";
import { buildOAuth2Client } from "./oauth";
import type { CalendarEvent } from "@/types";

function getCalendarIds(): string[] {
  const raw = process.env.GOOGLE_CALENDAR_IDS ?? "primary";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function getAuthorizedClient() {
  const refreshToken = await getPrimaryRefreshToken();
  if (!refreshToken) {
    throw new Error("No primary Google account connected");
  }
  const client = buildOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

// Today through +7 days — shared with the Hitchin events cache filter so a
// stale monthly-refreshed entry never shows up outside the same window the
// live family calendar is displaying.
export function getDisplayWindow(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarIds = getCalendarIds();

  const { start: timeMin, end: timeMax } = getDisplayWindow();

  const results = await Promise.allSettled(
    calendarIds.map((calendarId) =>
      calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 25,
      }),
    ),
  );

  const events: CalendarEvent[] = [];

  results.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      console.error(`Failed to fetch calendar "${calendarIds[index]}":`, result.reason);
      return;
    }

    for (const item of result.value.data.items ?? []) {
      const start = item.start?.dateTime ?? item.start?.date;
      const end = item.end?.dateTime ?? item.end?.date;
      if (!item.id || !item.summary || !start || !end) continue;

      events.push({
        id: item.id,
        title: item.summary,
        start,
        end,
        allDay: Boolean(item.start?.date && !item.start?.dateTime),
        calendarName: calendarIds[index],
      });
    }
  });

  events.sort((a, b) => a.start.localeCompare(b.start));
  return events;
}
