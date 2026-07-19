import { getDb } from "@/lib/db";
import { getInboxSummary } from "@/lib/google/gmail";
import { triageEmails } from "@/lib/claude";
import type { EmailMessage } from "@/types";

export interface EmailDigest {
  computedAt: string;
  items: EmailMessage[];
}

// The dashboard's live poll only ever reads this cached row — the actual
// Gmail fetch + Claude triage runs once a night from the cron route below.
export async function getCachedDigest(): Promise<EmailDigest | null> {
  const sql = getDb();
  const rows = await sql`
    select computed_at as "computedAt", items
    from email_digest
    where id = 1
  `;
  const row = rows[0] as { computedAt: string; items: EmailMessage[] } | undefined;
  return row ? { computedAt: row.computedAt, items: row.items } : null;
}

export async function computeAndStoreDigest(): Promise<EmailDigest> {
  const messages = await getInboxSummary();
  const triaged = await triageEmails(messages);

  const byId = new Map(messages.map((message) => [message.id, message]));
  const items: EmailMessage[] = [];
  for (const { id, reason } of triaged) {
    const message = byId.get(id);
    if (message) items.push({ ...message, reason });
  }

  const sql = getDb();
  const rows = await sql`
    insert into email_digest (id, computed_at, items)
    values (1, now(), ${JSON.stringify(items)}::jsonb)
    on conflict (id) do update
      set computed_at = excluded.computed_at,
          items = excluded.items
    returning computed_at as "computedAt"
  `;

  const computedAt = rows[0]?.computedAt as string;
  return { computedAt, items };
}
