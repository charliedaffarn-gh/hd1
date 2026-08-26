import { google, type tasks_v1 } from "googleapis";
import { getPrimaryRefreshToken } from "@/lib/accounts";
import { buildOAuth2Client } from "./oauth";
import type { Task } from "@/types";

const DEFAULT_TASKLIST_NAME = "Family";

async function getAuthorizedClient() {
  const refreshToken = await getPrimaryRefreshToken();
  if (!refreshToken) {
    throw new Error("No primary Google account connected");
  }
  const client = buildOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function getTasklistName(): string {
  return process.env.GOOGLE_TASKLIST_NAME?.trim() || DEFAULT_TASKLIST_NAME;
}

async function resolveFamilyTasklistId(tasks: tasks_v1.Tasks): Promise<string> {
  const name = getTasklistName();
  const { data } = await tasks.tasklists.list({ maxResults: 100 });
  const existing = data.items?.find((list) => list.title === name);
  if (existing?.id) return existing.id;

  const { data: created } = await tasks.tasklists.insert({ requestBody: { title: name } });
  if (!created.id) {
    throw new Error("Google Tasks did not return an id for the created list");
  }
  return created.id;
}

async function getTasksClient(): Promise<{ tasks: tasks_v1.Tasks; tasklistId: string }> {
  const auth = await getAuthorizedClient();
  const tasks = google.tasks({ version: "v1", auth });
  const tasklistId = await resolveFamilyTasklistId(tasks);
  return { tasks, tasklistId };
}

export async function listTasks(): Promise<Task[]> {
  const { tasks, tasklistId } = await getTasksClient();
  const { data } = await tasks.tasks.list({
    tasklist: tasklistId,
    // Completed tasks disappear from the dashboard the moment they're
    // checked off rather than lingering struck-through — no need to fetch
    // them at all.
    showCompleted: false,
    maxResults: 100,
  });

  const items = (data.items ?? []).filter(
    (item): item is tasks_v1.Schema$Task & { id: string; title: string } =>
      Boolean(item.id && item.title),
  );

  // Due-dated tasks float to the top (soonest/most overdue first) since
  // they're the ones that actually need acting on; everything else keeps
  // its normal drag-order position from the Tasks app.
  items.sort((a, b) => {
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return (a.position ?? "").localeCompare(b.position ?? "");
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    done: item.status === "completed",
    due: item.due ?? undefined,
  }));
}

export async function createTask(title: string): Promise<Task> {
  const { tasks, tasklistId } = await getTasksClient();
  const { data } = await tasks.tasks.insert({
    tasklist: tasklistId,
    requestBody: { title },
  });
  if (!data.id || !data.title) {
    throw new Error("Google Tasks did not return the created task");
  }
  return { id: data.id, title: data.title, done: data.status === "completed" };
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  const { tasks, tasklistId } = await getTasksClient();
  await tasks.tasks.patch({
    tasklist: tasklistId,
    task: id,
    requestBody: {
      status: done ? "completed" : "needsAction",
      completed: done ? new Date().toISOString() : null,
    },
  });
}
