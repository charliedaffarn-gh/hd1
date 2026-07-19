import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { computeAndStoreDigest } from "@/lib/email-digest";

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
