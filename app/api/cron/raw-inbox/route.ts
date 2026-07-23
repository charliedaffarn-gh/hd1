import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getInboxSummary } from "@/lib/google/gmail";

export const dynamic = "force-dynamic";

// Read-only feed of recent inbox mail (read or unread) across every
// connected account, for an external triage actor (currently: a nightly
// Claude Code Routine) to read and judge itself, then POST the curated
// result to POST /api/cron/email-digest.
// Same DIGEST_IMPORT_SECRET bearer auth as that route; excluded from the
// passcode-gate matcher in proxy.ts (grouped under /api/cron) since the
// caller can't carry a session cookie.
export async function GET(request: NextRequest) {
  const secret = process.env.DIGEST_IMPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await getInboxSummary();
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Failed to fetch raw inbox for digest import:", err);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 502 });
  }
}
