import { NextResponse } from "next/server";
import { dismissEmail } from "@/lib/dismissed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await dismissEmail(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to dismiss email "${id}":`, err);
    return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
  }
}
