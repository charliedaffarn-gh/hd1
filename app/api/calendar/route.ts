import { NextResponse } from "next/server";
import { getUpcomingEvents, getDisplayWindow } from "@/lib/google/calendar";
import { getCachedHitchinEvents } from "@/lib/hitchin-events";
import type { CalendarEvent } from "@/types";

export const dynamic = "force-dynamic";

// The Hitchin cache only refreshes monthly, so it can hold events well
// outside what's currently on screen — filter to the same window the live
// family calendar uses rather than trusting the cache's own contents.
function withinDisplayWindow(event: CalendarEvent): boolean {
  const { start, end } = getDisplayWindow();
  const eventStart = new Date(event.start);
  return eventStart >= start && eventStart < end;
}

// Most weekday listings (markets, toddler groups, midweek talks) aren't
// relevant to the family — only worth surfacing what's actually happening
// on a Saturday or Sunday. Uses the UK's actual local day, not UTC, since a
// date-only "start" is midnight UTC and a late-evening timed event near a
// day boundary could otherwise land on the wrong side of the week.
function isWeekendEvent(event: CalendarEvent): boolean {
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
  }).format(new Date(event.start));
  return weekday === "Sat" || weekday === "Sun";
}

export async function GET() {
  try {
    const events = await getUpcomingEvents();

    // A failure here degrades gracefully to "no local events" rather than
    // blanking the whole panel — the family calendar fetch above is the
    // one that should still fail the request if it breaks.
    const hitchinEvents = await getCachedHitchinEvents()
      .then((cache) =>
        cache ? cache.items.filter(withinDisplayWindow).filter(isWeekendEvent) : [],
      )
      .catch((err) => {
        console.error("Failed to load cached Hitchin events:", err);
        return [];
      });

    const merged = [...events, ...hitchinEvents].sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ events: merged });
  } catch (err) {
    console.error("Failed to fetch calendar events:", err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 502 });
  }
}
