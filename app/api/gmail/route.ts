import { NextResponse } from "next/server";
import { getCachedDigest } from "@/lib/email-digest";
import { getFlaggedMessages } from "@/lib/google/gmail";
import { getDismissedIds } from "@/lib/dismissed";
import type { EmailMessage } from "@/types";

export const dynamic = "force-dynamic";

const FLAGGED_REASON = "Flagged for attention.";

export async function GET() {
  try {
    const [digest, flagged, dismissed] = await Promise.all([
      getCachedDigest(),
      getFlaggedMessages().catch((err) => {
        console.error("Failed to fetch flagged Gmail messages:", err);
        return [];
      }),
      getDismissedIds(),
    ]);

    // Cached nightly Claude triage and the live "manually flagged" lookup
    // can overlap — dedupe by id, preferring the digest's more specific
    // reason when a message shows up in both.
    const byId = new Map<string, EmailMessage>();
    for (const item of digest?.items ?? []) {
      byId.set(item.id, item);
    }
    for (const message of flagged) {
      if (!byId.has(message.id)) {
        byId.set(message.id, { ...message, reason: FLAGGED_REASON });
      }
    }

    const messages = Array.from(byId.values())
      .filter((message) => !dismissed.has(message.id))
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

    return NextResponse.json({ messages, computedAt: digest?.computedAt ?? null });
  } catch (err) {
    console.error("Failed to load email:", err);
    return NextResponse.json({ error: "Failed to load email" }, { status: 502 });
  }
}
