import { NextResponse } from "next/server";
import { setTaskDone } from "@/lib/google/tasks";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const done = Boolean(body?.done);
    await setTaskDone(id, done);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to update task "${id}":`, err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 502 });
  }
}
