import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { storeHitchinEvents } from "@/lib/hitchin-events";

export const dynamic = "force-dynamic";

const ImportBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      allDay: z.boolean().optional(),
    }),
  ),
});

// Fired monthly by a Claude Code Routine — no Vercel Cron/Anthropic API
// involved, since the listing barely changes. The Routine reads
// visithitchin.com/whats-on/ itself via WebFetch, expands each event into
// one entry per day, and POSTs the result here. Reuses DIGEST_IMPORT_SECRET
// (same trust boundary as the email digest's Routine-import path) rather
// than minting a new secret.
export async function POST(request: NextRequest) {
  const secret = process.env.DIGEST_IMPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ImportBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid events payload" }, { status: 400 });
  }

  try {
    // Force server-side — never trust the Routine's payload to set this.
    const items = parsed.data.items.map((item) => ({ ...item, source: "hitchin" as const }));
    const stored = await storeHitchinEvents(items);
    return NextResponse.json({ ok: true, computedAt: stored.computedAt, count: stored.items.length });
  } catch (err) {
    console.error("Hitchin events import failed:", err);
    return NextResponse.json({ error: "Failed to store events" }, { status: 500 });
  }
}
