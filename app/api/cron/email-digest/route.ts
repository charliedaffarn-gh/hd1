import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { computeAndStoreDigest, storeDigest } from "@/lib/email-digest";

export const dynamic = "force-dynamic";

// Triggered once nightly by Vercel Cron (see vercel.json). Vercel attaches
// `Authorization: Bearer ${CRON_SECRET}` automatically on its own
// invocations; this route is excluded from the passcode-gate matcher in
// proxy.ts since that cookie can't be present on a cron-triggered request.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const digest = await computeAndStoreDigest();
    return NextResponse.json({ ok: true, computedAt: digest.computedAt, count: digest.items.length });
  } catch (err) {
    console.error("Email digest cron failed:", err);
    return NextResponse.json({ error: "Failed to compute digest" }, { status: 500 });
  }
}

const ImportBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      subject: z.string(),
      snippet: z.string(),
      receivedAt: z.string(),
      sourceEmail: z.string(),
      reason: z.string(),
    }),
  ),
});

// Alternate path for the same nightly digest: a Claude Code Routine reads
// GET /api/cron/raw-inbox, does the triage judgment itself (no metered API
// call), and POSTs the curated result here to store — same
// DIGEST_IMPORT_SECRET bearer auth, same email_digest row as the GET path
// above. Whichever of the two runs writes last wins; both are harmless to
// run side by side.
export async function POST(request: NextRequest) {
  const secret = process.env.DIGEST_IMPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ImportBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid digest payload" }, { status: 400 });
  }

  try {
    const digest = await storeDigest(parsed.data.items);
    return NextResponse.json({ ok: true, computedAt: digest.computedAt, count: digest.items.length });
  } catch (err) {
    console.error("Email digest import failed:", err);
    return NextResponse.json({ error: "Failed to store digest" }, { status: 500 });
  }
}
