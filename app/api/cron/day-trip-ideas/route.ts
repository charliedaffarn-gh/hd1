import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { storeDayTripIdeas } from "@/lib/day-trip-ideas";

export const dynamic = "force-dynamic";

const ImportBodySchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      whyItFits: z.string(),
      travelTime: z.string(),
      booking: z.string(),
      wetWeatherFallback: z.string(),
    }),
  ),
});

// Fired weekly by a Claude Code Routine — migrated from a ChatGPT scheduled
// task the user ran manually. The Routine generates the suggestions itself
// (WebSearch for current openings/events/booking info) and posts the result
// here. Reuses DIGEST_IMPORT_SECRET, same trust boundary as the email
// digest and Hitchin events' Routine-import paths — no new secret needed.
export async function POST(request: NextRequest) {
  const secret = process.env.DIGEST_IMPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ImportBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid day trip ideas payload" }, { status: 400 });
  }

  try {
    const stored = await storeDayTripIdeas(parsed.data.items);
    return NextResponse.json({ ok: true, computedAt: stored.computedAt, count: stored.items.length });
  } catch (err) {
    console.error("Day trip ideas import failed:", err);
    return NextResponse.json({ error: "Failed to store day trip ideas" }, { status: 500 });
  }
}
