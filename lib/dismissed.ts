import { getDb } from "@/lib/db";

// Dashboard-side dismissal: hides a message from the Email panel going
// forward, regardless of whether it keeps getting surfaced by the nightly
// triage or a NeedsAttention label. Never touches Gmail itself.
export async function getDismissedIds(): Promise<Set<string>> {
  const sql = getDb();
  const rows = await sql`select message_id as "messageId" from dismissed_emails`;
  return new Set((rows as { messageId: string }[]).map((row) => row.messageId));
}

export async function dismissEmail(id: string): Promise<void> {
  const sql = getDb();
  await sql`
    insert into dismissed_emails (message_id)
    values (${id})
    on conflict (message_id) do nothing
  `;
}
