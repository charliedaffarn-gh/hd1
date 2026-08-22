import { NextResponse } from "next/server";
import { getCachedDayTripIdeas } from "@/lib/day-trip-ideas";

export const dynamic = "force-dynamic";

// Passcode-gated like the rest of the app (proxy.ts's default matcher
// covers this route). Only fetched on demand when the popup opens, not
// polled, so a slightly stale cache read is fine.
export async function GET() {
  try {
    const cache = await getCachedDayTripIdeas();
    return NextResponse.json({ computedAt: cache?.computedAt ?? null, items: cache?.items ?? [] });
  } catch (err) {
    console.error("Failed to load day trip ideas:", err);
    return NextResponse.json({ error: "Failed to load day trip ideas" }, { status: 502 });
  }
}
