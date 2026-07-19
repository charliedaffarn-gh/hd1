import { NextResponse } from "next/server";
import { getCachedDigest } from "@/lib/email-digest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const digest = await getCachedDigest();
    return NextResponse.json({
      messages: digest?.items ?? [],
      computedAt: digest?.computedAt ?? null,
    });
  } catch (err) {
    console.error("Failed to load email digest:", err);
    return NextResponse.json({ error: "Failed to load email" }, { status: 502 });
  }
}
