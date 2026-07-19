import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/google/tasks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  let title = "";
  try {
    const body = await request.json();
    title = typeof body?.title === "string" ? body.title.trim() : "";
  } catch {
    // fall through to the validation error below
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const task = await createTask(title);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("Failed to create task:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 502 });
  }
}
