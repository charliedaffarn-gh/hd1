import { NextResponse } from "next/server";
import { getInboxSummary } from "@/lib/google/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await getInboxSummary();
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Failed to fetch Gmail messages:", err);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 502 });
  }
}
