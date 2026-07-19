import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getUpcomingEvents();
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Failed to fetch calendar events:", err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 502 });
  }
}
